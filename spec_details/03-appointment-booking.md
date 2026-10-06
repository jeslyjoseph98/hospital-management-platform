# HMS Appointment Booking — 03 Appointment Booking

Version: 1.1
Depends on: 01, 02

## 1. Purpose

A logged-in patient books an appointment with a doctor on an available date. Each doctor accepts at most `daily_limit` (50) appointments per date; after that the date is blocked. The patient receives a token number (1–50) and an estimated reporting time.

## 2. Table

```sql
CREATE TABLE appointments (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  appointment_code  VARCHAR(20)  NULL UNIQUE,     -- APT00000045, set right after insert
  patient_id        BIGINT       NOT NULL,
  doctor_id         BIGINT       NOT NULL,
  appointment_date  DATE         NOT NULL,
  token_number      INT          NOT NULL,        -- 1..daily_limit
  reporting_time    TIME         NOT NULL,        -- estimated time to arrive
  reason            VARCHAR(300) NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'BOOKED',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_apt_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_apt_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id),
  CONSTRAINT chk_apt_status CHECK (status IN ('BOOKED','COMPLETED')),   -- COMPLETED set by doctor (spec 06)
  CONSTRAINT chk_apt_token  CHECK (token_number >= 1),
  UNIQUE KEY uq_apt_token   (doctor_id, appointment_date, token_number),  -- no two patients get the same token
  UNIQUE KEY uq_apt_patient (patient_id, doctor_id, appointment_date),    -- one booking per patient per doctor per day
  INDEX idx_apt_doctor_date (doctor_id, appointment_date),
  INDEX idx_apt_patient (patient_id, appointment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 3. Booking Steps (single transaction)

```
1. Validate request (rules APT-R1 to APT-R5)
2. SELECT * FROM doctors WHERE id = ? FOR UPDATE           -- lock: bookings for this doctor wait in line
3. SELECT COUNT(*) FROM appointments
     WHERE doctor_id = ? AND appointment_date = ? AND status <> 'CANCELLED'
4. If count >= daily_limit  → APT_DOCTOR_FULLY_BOOKED
5. token_number   = count + 1
6. reporting_time = start_time + (token_number - 1) * minutesPerPatient
                    where minutesPerPatient = FLOOR(window minutes / daily_limit), minimum 1
7. INSERT appointment
8. UPDATE appointments SET appointment_code = CONCAT('APT', LPAD(id, 8, '0'))
9. INSERT notification "Booking successful" (spec 04)
10. COMMIT
```

Why the lock in step 2: without it, two patients booking the 50th spot at the same moment could both read count = 49 and both get in. With `FOR UPDATE` on the doctor row, the second request waits until the first commits, then reads count = 50 and is rejected. `uq_apt_token` is a second safety net.

Example of step 6: window 10:00–13:00 = 180 min, limit 50 → 3 min per patient. Token 17 → 10:00 + 16 × 3 = 10:48.

## 4. Business Rules

| ID | Rule |
|----|------|
| APT-R1 | Patient must be logged in; `patient_id` comes from the token. |
| APT-R2 | Doctor must exist and be active → `DOC_NOT_FOUND`. |
| APT-R3 | Date must be between today and today + 6 → `APT_DATE_OUT_OF_RANGE`. |
| APT-R4 | Doctor must have active availability on that day of week → `APT_DOCTOR_NOT_AVAILABLE`. |
| APT-R5 | If date is today and current time ≥ doctor's `end_time` → `APT_BOOKING_CLOSED`. |
| APT-R6 | If patient already has a BOOKED appointment with this doctor on this date → `APT_ALREADY_BOOKED` (also enforced by `uq_apt_patient`). |
| APT-R7 | If count of BOOKED + COMPLETED appointments for doctor + date ≥ `daily_limit` → `APT_DOCTOR_FULLY_BOOKED`. The date shows as FULLY_BOOKED in availability (spec 02). |
| APT-R8 | Token = count + 1. Tokens are given in booking order. |
| APT-R9 | On success, response includes token number, reporting time, doctor, department, date, and message "Booking successful". |
| APT-R10 | A patient can see only their own appointments. Another patient's id → `APT_NOT_FOUND`. |

## 5. APIs

All require a logged-in patient.

| Method | Path | Description |
|--------|------|-------------|
| POST | /appointments | Book |
| GET | /appointments/my | Own appointments; `upcoming=true` (default) or `false` for past |
| GET | /appointments/{id} | Own appointment detail (booking slip) |

### 5.1 Book

```json
POST /api/v1/appointments
{ "doctorId": 3, "appointmentDate": "2026-09-28", "reason": "Chest pain on exertion" }
```

Response `201`:
```json
{
  "success": true,
  "message": "Booking successful",
  "data": {
    "appointmentId": 45,
    "appointmentCode": "APT00000045",
    "tokenNumber": 17,
    "reportingTime": "10:48",
    "appointmentDate": "2026-09-28",
    "doctorName": "Dr. Rahul Menon",
    "departmentName": "Cardiology",
    "consultationTimings": "10:00 - 13:00",
    "patientName": "John Mathew",
    "patientCode": "PAT000123"
  }
}
```

Fully booked `409`:
```json
{ "success": false, "errorCode": "APT_DOCTOR_FULLY_BOOKED", "message": "Dr. Rahul Menon is fully booked on 28-09-2026. Please choose another date." }
```

## 6. Screens

| Screen | Content |
|--------|---------|
| Book appointment | Department dropdown → doctor cards → 7-day date strip (disabled if not AVAILABLE, shows "12 left") → reason → Confirm |
| Booking success | Large token number, reporting time, doctor, department, date, appointment code; "Booking successful" toast |
| My appointments | List of upcoming bookings with token number |

## 7. Error Codes

`DOC_NOT_FOUND`, `APT_DATE_OUT_OF_RANGE`, `APT_DOCTOR_NOT_AVAILABLE`, `APT_BOOKING_CLOSED`, `APT_ALREADY_BOOKED`, `APT_DOCTOR_FULLY_BOOKED`, `APT_NOT_FOUND`