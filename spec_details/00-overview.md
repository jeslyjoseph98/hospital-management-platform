# HMS Appointment Booking — 00 Overview

Version: 2.2 (pharmacy added)

## 1. Scope

One portal for everyone. Users register choosing a role (Patient, Doctor, Pharmacist or Admin) and log in on the same page; the screens shown after login depend on the role. Admins maintain departments and doctors (name, qualification, consultation fee, timings, daily limit). Doctors see today's appointments, open patient details, and record consultation details and prescriptions. Pharmacy staff see those prescriptions, give the medicines and mark them as done. Patients pick a department, pick a doctor, pick a date the doctor is available, and book. Each doctor takes a maximum of 50 appointments per day. After booking, the patient gets a token number and an estimated reporting time, and sees a "Booking successful" notification.

In scope:
- Common registration (role chosen at sign-up) and common login
- Role-based screens: Patient → booking screens, Admin → doctor management screens, Doctor → today's appointments and consultation
- Doctor: today's appointments, patient details and history, consultation details, prescription
- Pharmacist: pending prescriptions, give medicine, mark as done
- Departments and doctors (doctors listed by department)
- Doctor availability (weekly days and time window)
- Appointment booking with a daily limit of 50 per doctor
- Token number for consultation
- Booking success notification
- Admin: department management, doctor management (profile, qualification, consultation details, weekly timings)

Out of scope for now: cancellation/rescheduling, lab tests, billing, medicine stock, SMS/email.

No seed data is needed. Admins register through the portal with the admin registration code; departments, doctors and timings are entered through the admin screens.

## 2. Spec Files

| # | File | Depends on |
|---|------|------------|
| 01 | 01-registration-login-roles.md | — |
| 02 | 02-department-doctor-availability.md | — |
| 03 | 03-appointment-booking.md | 01, 02 |
| 04 | 04-booking-notification.md | 03 |
| 05 | 05-admin-doctor-management.md | 01, 02, 03 |
| 06 | 06-doctor-portal-consultation.md | 01, 02, 03, 05 |
| 07 | 07-pharmacy-dispensing.md | 01, 06 |

## 3. User Flow

```
                     Register (choose role) ──► Login (same page for all)
                                                      │
              ┌──────────────────────────── role? ────┼───────────────────────────┐
              ▼                                       ▼                           ▼
          PATIENT                                  DOCTOR                       ADMIN
  Department ──► Doctor ──► Date            Today's appointments         Departments
         ──► Confirm booking                 (token order)                Add / edit doctors
              │                                   │                       (profile, qualification,
  Token no. + reporting time               Open patient: details           fee, daily limit, timings)
  + "Booking successful"                   + past visits                  Bookings per doctor
              │                                   │
  View consultation &                      Consultation details
  prescription after visit  ◄────────────  + prescription ──► Complete
                                                  │
                                                  ▼
                                     PHARMACIST: pending prescriptions
                                     ──► give medicine ──► Mark as done
```

Doctor login: admin adds the doctor first; the doctor then registers with role Doctor using the same registration number and phone.

## 4. Technology

| Layer | Choice |
|-------|--------|
| Backend | Java 21, Spring Boot 3.x, Spring Security (JWT), MyBatis (XML mappers) |
| Database | MySQL 8.0.16+ (InnoDB, utf8mb4) — needed so CHECK constraints are enforced |
| Migrations | Flyway |
| Frontend | Next.js + TypeScript |

## 5. Conventions

- Tables `snake_case`, plural. Primary key `id BIGINT AUTO_INCREMENT`.
- Every table has `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` and `updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP`.
- Status columns are `VARCHAR(20)` with a `CHECK` constraint (no MySQL `ENUM`).
- Dates stored as `DATE`, times as `TIME`, timestamps in UTC.
- Business rules are plain if-checks in the service layer; each failure throws `BusinessException(errorCode)`.
- API base path `/api/v1`, JSON, camelCase.

### 5.1 Response format

Success:
```json
{ "success": true, "data": { }, "message": "Booking successful" }
```

Error:
```json
{ "success": false, "errorCode": "APT_DOCTOR_FULLY_BOOKED", "message": "Dr. Rahul is fully booked on 28-09-2026", "fieldErrors": [] }
```

| HTTP | When |
|------|------|
| 400 | Validation failure |
| 401 | Not logged in / token expired |
| 403 | Logged in but wrong role (e.g. patient calling an `/admin` or `/doctor` API) |
| 404 | Record not found |
| 409 | Business rule failed (fully booked, already booked, duplicate registration) |