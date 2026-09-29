# HMS Appointment Booking — 04 Booking Notification

Version: 1.0
Depends on: 03

## 1. Purpose

After a successful booking the patient sees a "Booking successful" notification immediately (toast on screen) and can see it later in their notification list (bell icon).

## 2. How it works

1. **Immediate:** the booking API response carries `"message": "Booking successful"`. The frontend shows it as a success toast on the confirmation screen. No extra call needed.
2. **Stored:** in the same transaction as the booking (spec 03, step 9), one row is inserted into `notifications`. If the booking fails or rolls back, no notification is created.

No email/SMS in this version.

## 3. Table

```sql
CREATE TABLE notifications (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id      BIGINT       NOT NULL,
  title           VARCHAR(100) NOT NULL,
  message         VARCHAR(500) NOT NULL,
  appointment_id  BIGINT       NULL,
  is_read         TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at         DATETIME     NULL,
  CONSTRAINT fk_ntf_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_ntf_apt     FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  INDEX idx_ntf_patient (patient_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 4. Message

| Field | Value |
|-------|-------|
| title | `Booking successful` |
| message | `Your appointment with {doctorName} ({departmentName}) on {dd-MM-yyyy} is confirmed. Token No: {tokenNumber}. Please report by {hh:mm a}.` |

Example: *Your appointment with Dr. Rahul Menon (Cardiology) on 28-09-2026 is confirmed. Token No: 17. Please report by 10:48 AM.*

## 5. Business Rules

| ID | Rule |
|----|------|
| NTF-R1 | Notification is inserted only after the appointment insert succeeds, in the same transaction. |
| NTF-R2 | Patient sees only own notifications. |
| NTF-R3 | Marking another patient's notification as read → `NTF_NOT_FOUND`. |

## 6. APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | /notifications/my | Own notifications, newest first, paged |
| GET | /notifications/my/unread-count | Count for the bell badge |
| PATCH | /notifications/{id}/read | Mark as read |

## 7. Error Codes

`NTF_NOT_FOUND`
