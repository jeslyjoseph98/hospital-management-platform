# HMS Appointment Booking — 00 Overview

Version: 1.0

## 1. Scope

Patients register, log in, pick a department, pick a doctor, pick a date the doctor is available, and book. Each doctor takes a maximum of 50 appointments per day. After booking, the patient gets a token number and an estimated reporting time, and sees a "Booking successful" notification.

In scope:
- Patient registration and login
- Departments and doctors (doctors listed by department)
- Doctor availability (weekly days and time window)
- Appointment booking with a daily limit of 50 per doctor
- Token number for consultation
- Booking success notification

Out of scope for now: cancellation/rescheduling, doctor login, admin screens, consultation, prescriptions, SMS/email.

Departments, doctors and availability are loaded with a SQL seed script (`V2__seed_departments_doctors.sql`). No admin UI in v1.

## 2. Spec Files

| # | File | Depends on |
|---|------|------------|
| 01 | 01-patient-registration-login.md | — |
| 02 | 02-department-doctor-availability.md | — |
| 03 | 03-appointment-booking.md | 01, 02 |
| 04 | 04-booking-notification.md | 03 |

## 3. User Flow

```
Register ──► Login ──► Select Department ──► Select Doctor ──► Select Date
                                                                   │
                        (dates show "Available: 12 of 50" or "Fully booked")
                                                                   ▼
                                                           Confirm Booking
                                                                   │
                                  ┌────────────────────────────────┴───────────────┐
                                  ▼                                                ▼
                    Success: token no. + reporting time               Fail: "Fully booked" /
                    + "Booking successful" notification                "Already booked" etc.
```

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
| 404 | Record not found |
| 409 | Business rule failed (fully booked, already booked, duplicate registration) |
