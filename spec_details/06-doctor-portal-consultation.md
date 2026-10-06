# HMS Appointment Booking — 06 Doctor Portal: Today's Appointments, Patient Details, Consultation and Prescription

Version: 1.1
Depends on: 01, 02, 03, 05

## 1. Purpose

A doctor logs in through the common portal (spec 01) and can:
- See today's appointments in token order
- Open a patient's details and past visits
- Record consultation details (complaint, symptoms, vitals, diagnosis, notes, advice, follow-up)
- Add a prescription
- Complete the consultation, which marks the appointment COMPLETED

The patient can then view the consultation summary and prescription from My Appointments.

## 2. How a Doctor Gets a Login

1. Admin adds the doctor (spec 05) with registration number and phone.
2. Doctor opens the portal, chooses **Register as: Doctor**, and enters the same registration number and phone.
3. The system links the new user account to that doctor record (`doctors.user_id`).

Rules for this are in spec 01 (REG-R11 to REG-R13).

## 3. Tables

```sql
CREATE TABLE consultations (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  appointment_id    BIGINT        NOT NULL UNIQUE,   -- one consultation per appointment
  patient_id        BIGINT        NOT NULL,
  doctor_id         BIGINT        NOT NULL,
  chief_complaint   VARCHAR(500)  NULL,              -- "Fever for 3 days"
  symptoms          VARCHAR(1000) NULL,
  temperature_c     DECIMAL(4,1)  NULL,
  pulse_bpm         INT           NULL,
  bp_systolic       INT           NULL,
  bp_diastolic      INT           NULL,
  weight_kg         DECIMAL(5,2)  NULL,
  diagnosis         VARCHAR(500)  NULL,
  doctor_notes      VARCHAR(2000) NULL,              -- internal, not shown to patient
  advice            VARCHAR(1000) NULL,              -- "Rest and hydration", shown to patient
  follow_up_date    DATE          NULL,
  status            VARCHAR(20)   NOT NULL DEFAULT 'IN_PROGRESS',
  completed_at      DATETIME      NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_con_apt     FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  CONSTRAINT fk_con_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_con_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id),
  CONSTRAINT chk_con_status CHECK (status IN ('IN_PROGRESS','COMPLETED')),
  INDEX idx_con_patient (patient_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prescription_items (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  consultation_id   BIGINT       NOT NULL,
  medicine_name     VARCHAR(150) NOT NULL,     -- Paracetamol
  strength          VARCHAR(50)  NULL,         -- 500mg
  dosage_pattern    VARCHAR(20)  NOT NULL,     -- 1-0-1 (morning-afternoon-night)
  timing            VARCHAR(20)  NOT NULL,
  duration_days     INT          NOT NULL,
  instructions      VARCHAR(300) NULL,
  display_order     INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_rxi_con     FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  CONSTRAINT chk_rxi_timing CHECK (timing IN ('BEFORE_FOOD','AFTER_FOOD','BEDTIME','AS_NEEDED')),
  CONSTRAINT chk_rxi_dur    CHECK (duration_days BETWEEN 1 AND 365),
  INDEX idx_rxi_con (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

The prescription is stored as items under the consultation; there is no separate prescription header table.

## 4. Appointment Status (change to spec 03)

```
BOOKED ──► COMPLETED   (when doctor completes the consultation)
```

Bookings still count toward the daily limit after they are COMPLETED (spec 02/03 count `status <> 'CANCELLED'`), so finished consultations don't reopen spots.

## 5. Business Rules

### 5.1 Today's appointments

| ID | Rule |
|----|------|
| DRP-R1 | `doctorId` comes from the token. A doctor sees only their own appointments. |
| DRP-R2 | List shows appointments where `appointment_date = CURDATE()`, ordered by `token_number`. |
| DRP-R3 | Each row: token, reporting time, patient name, patient code, age, gender, status (BOOKED / IN_PROGRESS / COMPLETED — IN_PROGRESS when a consultation row exists but is not completed). |
| DRP-R4 | Header shows counts: total, completed, pending. |

### 5.2 Patient details

| ID | Rule |
|----|------|
| DRP-R5 | A doctor can open a patient only if that patient has at least one appointment with this doctor → else `DRP_PATIENT_NOT_FOUND`. |
| DRP-R6 | Details shown: name, patient code, age (from date of birth), gender, phone, address. |
| DRP-R7 | Past visits: the patient's COMPLETED consultations at this hospital, newest first, with date, doctor, department, diagnosis, advice and prescription items. `doctor_notes` of other doctors' visits are also shown (shared hospital record). |

### 5.3 Consultation

| ID | Rule |
|----|------|
| DRP-R8 | Appointment must belong to this doctor → `DRP_NOT_YOUR_APPOINTMENT`. |
| DRP-R9 | Appointment date must be today → `DRP_NOT_TODAY`. |
| DRP-R10 | Appointment must be BOOKED → `DRP_ALREADY_COMPLETED`. |
| DRP-R11 | Save: if no consultation exists for the appointment, insert one (IN_PROGRESS); else update it. Prescription items are replaced on every save (delete + insert in the same transaction). Can be saved many times. |
| DRP-R12 | Vitals ranges if entered (else `DRP_VITALS_INVALID`): temperature 30–45, pulse 20–250, systolic 50–260, diastolic 30–160, weight 0.5–350. |
| DRP-R13 | `follow_up_date`, if given, must be after today → `DRP_FOLLOWUP_INVALID`. |
| DRP-R14 | Prescription: 0–20 items → `DRP_TOO_MANY_ITEMS`. `medicine_name` required. `dosage_pattern` must match `^[0-9]-[0-9]-[0-9]$` and not be `0-0-0` unless timing = AS_NEEDED → `DRP_DOSAGE_INVALID`. |
| DRP-R15 | Complete: `diagnosis` required → `DRP_DIAGNOSIS_REQUIRED`. In one transaction: save (R11), consultation → COMPLETED with `completed_at = now`, appointment → COMPLETED. If prescription has 1+ items → `dispense_status = PENDING` (goes to pharmacy, spec 07); else `NOT_REQUIRED`. |
| DRP-R16 | After COMPLETED, consultation and prescription are read-only → `DRP_ALREADY_COMPLETED`. |

### 5.4 Patient view

| ID | Rule |
|----|------|
| DRP-R17 | Patient can view the consultation of their own COMPLETED appointments: date, doctor, diagnosis, advice, follow-up date, vitals, prescription items. `doctor_notes` is not returned to patients. Also shows dispense status: "Medicines given on {date}" or "Medicines not yet collected" (spec 07). |

## 6. APIs

Doctor APIs: under `/api/v1/doctor`, require `role = DOCTOR`.

| Method | Path | Description |
|--------|------|-------------|
| GET | /doctor/appointments/today | Today's list with counts |
| GET | /doctor/appointments/{id} | Appointment + patient details + consultation (if any) |
| GET | /doctor/patients/{patientId} | Patient details + past visits |
| PUT | /doctor/appointments/{id}/consultation | Save consultation + prescription |
| POST | /doctor/appointments/{id}/consultation/complete | Save and complete |

Patient API (role PATIENT):

| Method | Path | Description |
|--------|------|-------------|
| GET | /appointments/{id}/consultation | Own completed consultation and prescription |

### 6.1 Today's appointments

```json
GET /api/v1/doctor/appointments/today
{
  "success": true,
  "data": {
    "date": "2026-09-28",
    "total": 38, "completed": 12, "pending": 26,
    "appointments": [
      { "appointmentId": 45, "tokenNumber": 17, "reportingTime": "10:48", "patientId": 123,
        "patientName": "John Mathew", "patientCode": "PAT000123", "age": 38, "gender": "MALE", "status": "BOOKED" }
    ]
  }
}
```

### 6.2 Save / complete consultation

```json
POST /api/v1/doctor/appointments/45/consultation/complete
{
  "chiefComplaint": "Fever for 3 days",
  "symptoms": "Fever, headache, body pain",
  "temperatureC": 38.6,
  "pulseBpm": 96,
  "bpSystolic": 124,
  "bpDiastolic": 82,
  "weightKg": 72.5,
  "diagnosis": "Viral fever",
  "doctorNotes": "No rashes. Throat mildly congested.",
  "advice": "Rest and drink plenty of fluids.",
  "followUpDate": "2026-10-03",
  "prescription": [
    { "medicineName": "Paracetamol", "strength": "500mg", "dosagePattern": "1-0-1", "timing": "AFTER_FOOD", "durationDays": 5 },
    { "medicineName": "Cetirizine",  "strength": "10mg",  "dosagePattern": "0-0-1", "timing": "BEDTIME",    "durationDays": 5 }
  ]
}
```

Response: `"message": "Consultation completed"` with the saved consultation.

## 7. Screens

| Route | Screen |
|-------|--------|
| /doctor/today | Today's appointments: counts at top, table by token, "Open" button per row |
| /doctor/appointments/{id} | Left: patient details + past visits. Right: consultation form (complaint, symptoms, vitals, diagnosis, notes, advice, follow-up date) and prescription table (add/remove rows). Buttons: **Save**, **Complete Consultation** |
| /doctor/patients/{id} | Patient details + full visit history |
| /patient/appointments/{id} | (Patient) booking slip; if completed, consultation summary + prescription |

## 8. Error Codes

`DRP_PATIENT_NOT_FOUND`, `DRP_NOT_YOUR_APPOINTMENT`, `DRP_NOT_TODAY`, `DRP_ALREADY_COMPLETED`, `DRP_VITALS_INVALID`, `DRP_FOLLOWUP_INVALID`, `DRP_TOO_MANY_ITEMS`, `DRP_DOSAGE_INVALID`, `DRP_DIAGNOSIS_REQUIRED`