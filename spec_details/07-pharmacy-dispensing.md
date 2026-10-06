# HMS Appointment Booking — 07 Pharmacy: View Prescription, Give Medicine, Mark as Done

Version: 1.0
Depends on: 01, 06

## 1. Purpose

Pharmacy staff log in through the common portal (role `PHARMACIST`), see prescriptions written by doctors, give the medicines to the patient, and mark the prescription as done.

No stock, no billing in this version: the system only records **whether** and **when** the medicines were given, and by whom.

## 2. Table Changes

Dispensing status is kept on the consultation (one prescription per consultation, spec 06).

```sql
ALTER TABLE consultations
  ADD COLUMN dispense_status   VARCHAR(20)  NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN dispensed_by      BIGINT       NULL,          -- users.id of pharmacist
  ADD COLUMN dispensed_at      DATETIME     NULL,
  ADD COLUMN dispense_remarks  VARCHAR(500) NULL,          -- "Cetirizine not available, advised to buy outside"
  ADD CONSTRAINT chk_con_dispense CHECK (dispense_status IN ('NOT_REQUIRED','PENDING','DISPENSED')),
  ADD CONSTRAINT fk_con_dispensed_by FOREIGN KEY (dispensed_by) REFERENCES users(id),
  ADD INDEX idx_con_dispense (dispense_status, completed_at);
```

## 3. Status Flow

```
Doctor completes consultation (spec 06)
      │
      ├── no prescription items  ──► NOT_REQUIRED
      └── 1 or more items        ──► PENDING ──► DISPENSED  (pharmacist marks done)
```

## 4. Business Rules

| ID | Rule |
|----|------|
| PHR-R1 | All `/api/v1/pharmacy/**` APIs require `role = PHARMACIST` → else 403 `AUTH_FORBIDDEN`. |
| PHR-R2 | Pending list shows consultations with `status = COMPLETED` and `dispense_status = PENDING`. Default filter: completed today. Optional `date` filter (any past date). Oldest first. |
| PHR-R3 | Search by patient code, patient phone, or appointment code (exact match). Search returns PENDING and DISPENSED prescriptions of the last 30 days. |
| PHR-R4 | Pharmacist sees: patient name, code, age, gender; doctor name and department; consultation date; diagnosis; prescription items; follow-up date. Pharmacist does **not** see `doctor_notes` or vitals. |
| PHR-R5 | Mark as done is allowed only when `dispense_status = PENDING` → else `PHR_ALREADY_DISPENSED` (or `PHR_NOTHING_TO_DISPENSE` if NOT_REQUIRED). |
| PHR-R6 | Mark as done runs one statement: `UPDATE consultations SET dispense_status = 'DISPENSED', dispensed_by = ?, dispensed_at = NOW(), dispense_remarks = ? WHERE id = ? AND dispense_status = 'PENDING'`. If 0 rows updated → `PHR_ALREADY_DISPENSED`. This stops two pharmacists marking the same prescription at the same time. |
| PHR-R7 | `remarks` optional, max 500 chars. Use it when some medicine was not given. |
| PHR-R8 | DISPENSED is final in v1 (no undo). |
| PHR-R9 | Patient sees in their consultation view: "Medicines given on {date}" and remarks, or "Medicines not yet collected" (spec 06, DRP-R17). Doctor sees the same in past visits. |

## 5. APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | /pharmacy/prescriptions/pending?date= | Pending list (default today) |
| GET | /pharmacy/prescriptions/search?q= | Search by patient code / phone / appointment code |
| GET | /pharmacy/prescriptions/{consultationId} | Prescription detail |
| POST | /pharmacy/prescriptions/{consultationId}/dispense | Mark as done |

### 5.1 Pending list

```json
GET /api/v1/pharmacy/prescriptions/pending
{
  "success": true,
  "data": [
    { "consultationId": 88, "appointmentCode": "APT00000045", "tokenNumber": 17,
      "patientName": "John Mathew", "patientCode": "PAT000123",
      "doctorName": "Dr. Rahul Menon", "departmentName": "Cardiology",
      "completedAt": "2026-09-28T11:05:00", "itemCount": 2, "dispenseStatus": "PENDING" }
  ]
}
```

### 5.2 Detail

```json
GET /api/v1/pharmacy/prescriptions/88
{
  "success": true,
  "data": {
    "consultationId": 88,
    "patient": { "name": "John Mathew", "patientCode": "PAT000123", "age": 38, "gender": "MALE" },
    "doctorName": "Dr. Rahul Menon",
    "consultationDate": "2026-09-28",
    "diagnosis": "Viral fever",
    "items": [
      { "medicineName": "Paracetamol", "strength": "500mg", "dosagePattern": "1-0-1", "timing": "AFTER_FOOD", "durationDays": 5, "instructions": null },
      { "medicineName": "Cetirizine",  "strength": "10mg",  "dosagePattern": "0-0-1", "timing": "BEDTIME",    "durationDays": 5, "instructions": null }
    ],
    "followUpDate": "2026-10-03",
    "dispenseStatus": "PENDING"
  }
}
```

### 5.3 Mark as done

```json
POST /api/v1/pharmacy/prescriptions/88/dispense
{ "remarks": "All medicines given" }
```

Response: `"message": "Marked as done"` with `dispenseStatus: "DISPENSED"`, `dispensedAt`, `dispensedBy` (name).

## 6. Screens

| Route | Screen |
|-------|--------|
| /pharmacy/prescriptions | Tabs **Pending** / **Search**. Pending: table with token, patient, doctor, time, items count, "Open" button. Date picker (default today) |
| /pharmacy/prescriptions/{id} | Patient + doctor header, prescription table (medicine, strength, dosage, timing, days), remarks box, **Mark as Done** button (confirm dialog). After done: shows "Given on 28-09-2026 11:20 by Priya" and no button |

## 7. Error Codes

`PHR_NOT_FOUND`, `PHR_ALREADY_DISPENSED`, `PHR_NOTHING_TO_DISPENSE`, `AUTH_FORBIDDEN`
