# HMS Appointment Booking — 05 Admin: Department and Doctor Management

Version: 2.1
Depends on: 01, 02, 03

## 1. Purpose

A user registered with role ADMIN (spec 01) logs in through the common portal and maintains:
- Departments
- Doctors: name, qualification, specialization, experience, registration number, contact, profile text
- Consultation details: consultation fee, daily appointment limit (default 50), weekly consultation days and timings

Patients see this data when booking (spec 02).

## 2. Admin Account

Admins register and log in through the same portal as patients (spec 01), choosing **Register as: Admin** and entering the admin registration code. There is no separate admin table or admin login page. After login, a user with `role = ADMIN` lands on `/admin/doctors`.

To record who changed doctor data, add to `departments`, `doctors` and `doctor_availability`:

```sql
ALTER TABLE departments         ADD COLUMN created_by BIGINT NULL, ADD COLUMN updated_by BIGINT NULL;
ALTER TABLE doctors             ADD COLUMN created_by BIGINT NULL, ADD COLUMN updated_by BIGINT NULL;
ALTER TABLE doctor_availability ADD COLUMN created_by BIGINT NULL, ADD COLUMN updated_by BIGINT NULL;
```

(`created_by` / `updated_by` hold `users.id` of the admin.)

## 3. Access Rule

| ID | Rule |
|----|------|
| ADM-R1 | All `/api/v1/admin/**` APIs require a token with `role = ADMIN` → else 403 `AUTH_FORBIDDEN` (spec 01, LOG-R4). |

## 4. Department Rules

| ID | Rule |
|----|------|
| DEP-R1 | `dept_name` required, max 100 chars, unique (case-insensitive) → `ADM_DEPARTMENT_EXISTS`. |
| DEP-R2 | Deactivating a department that has active doctors → `ADM_DEPARTMENT_HAS_DOCTORS`. Move or deactivate the doctors first. |
| DEP-R3 | Departments are never deleted, only deactivated. |

## 5. Doctor Rules

### 5.1 Create / update profile

| ID | Rule |
|----|------|
| DOC-A1 | Required: departmentId, fullName, qualification, specialization, registrationNumber, phone, consultationFee → else 400 with `fieldErrors`. Phone is required because the doctor uses it to register (spec 01, REG-R12). |
| DOC-A2 | Department must exist and be active → `ADM_DEPARTMENT_INACTIVE`. |
| DOC-A3 | `registration_number` must be unique → `ADM_DOCTOR_REG_EXISTS`. |
| DOC-A4 | `consultation_fee` ≥ 0; `experience_years` 0–70; phone 10 digits starting 6–9 → `ADM_DOCTOR_INVALID`. |
| DOC-A5 | `daily_limit` 1–200, default 50 if not sent. |
| DOC-A6 | Reducing `daily_limit`: if any future date already has more BOOKED appointments than the new limit → `ADM_LIMIT_BELOW_BOOKED` (response lists those dates and counts). |
| DOC-A7 | Changing department is allowed; existing appointments stay as they are. |
| DOC-A7a | Once the doctor has registered (`user_id` set), `registration_number` cannot be changed → `ADM_DOCTOR_REG_LOCKED`. Changing `doctors.phone` does not change the doctor's login phone. |
| DOC-A8 | Create doctor and its weekly timings in one transaction. A doctor may be created with no timings; patients then see all dates as NOT_AVAILABLE. |

### 5.2 Weekly consultation timings

The admin sends the full weekly schedule every time (replace, not patch). The service compares it with what is stored.

| ID | Rule |
|----|------|
| AVL-R1 | One entry per day at most → `ADM_DUPLICATE_DAY`. `dayOfWeek` 1–7. |
| AVL-R2 | `endTime` must be after `startTime` → `ADM_INVALID_TIME`. |
| AVL-R3 | Window must be at least `daily_limit` minutes long (so each token gets ≥ 1 minute of reporting time) → `ADM_WINDOW_TOO_SHORT`. |
| AVL-R4 | If a day is being removed and future BOOKED appointments exist on that weekday → `ADM_DAY_HAS_BOOKINGS` (response lists dates and counts). |
| AVL-R5 | If `startTime` of a day changes and future BOOKED appointments exist on that weekday → `ADM_DAY_HAS_BOOKINGS`, because already-issued reporting times would be wrong. Changing only `endTime` later (extending) is allowed. |
| AVL-R6 | Save = in one transaction: delete the doctor's `doctor_availability` rows, insert the new rows. (Safe because no table references `doctor_availability`.) |

### 5.3 Activate / deactivate

| ID | Rule |
|----|------|
| DOC-A9 | Deactivate: if future BOOKED appointments exist → `ADM_DOCTOR_HAS_BOOKINGS` (no cancellation module yet). |
| DOC-A10 | Inactive doctors are hidden from patients (spec 02) and cannot be booked (spec 03). |
| DOC-A11 | Doctors are never deleted, only deactivated. |

## 6. APIs

All under `/api/v1/admin`, `role = ADMIN`.

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/departments | All departments incl. inactive, with active doctor count |
| POST | /admin/departments | Create |
| PUT | /admin/departments/{id} | Update name / description |
| PATCH | /admin/departments/{id}/status | `{ "active": false }` |
| GET | /admin/doctors | List; filters `departmentId`, `name`, `active`; paged |
| GET | /admin/doctors/{id} | Full profile + weekly timings |
| POST | /admin/doctors | Create profile + timings |
| PUT | /admin/doctors/{id} | Update profile and consultation details (fee, daily limit) |
| PUT | /admin/doctors/{id}/timings | Replace weekly timings |
| PATCH | /admin/doctors/{id}/status | `{ "active": false }` |
| GET | /admin/doctors/{id}/bookings?date= | Booked count and list of tokens for a date (read-only) |

### 6.1 Create doctor

```json
POST /api/v1/admin/doctors
{
  "departmentId": 2,
  "fullName": "Dr. Rahul Menon",
  "qualification": "MBBS, MD (Cardiology)",
  "specialization": "Cardiologist",
  "registrationNumber": "KMC-45821",
  "experienceYears": 12,
  "phone": "9876543210",
  "email": "rahul@hospital.in",
  "about": "Interventional cardiologist with 12 years of experience.",
  "consultationFee": 500.00,
  "dailyLimit": 50,
  "timings": [
    { "dayOfWeek": 1, "startTime": "10:00", "endTime": "13:00" },
    { "dayOfWeek": 3, "startTime": "14:00", "endTime": "17:00" },
    { "dayOfWeek": 5, "startTime": "10:00", "endTime": "13:00" }
  ]
}
```

Response `201`: created doctor with `id`, department name, timings. Message: "Doctor added successfully".

### 6.2 Replace timings

```json
PUT /api/v1/admin/doctors/3/timings
{
  "timings": [
    { "dayOfWeek": 1, "startTime": "10:00", "endTime": "13:00" },
    { "dayOfWeek": 3, "startTime": "14:00", "endTime": "18:00" }
  ]
}
```

Blocked example `409`:
```json
{
  "success": false,
  "errorCode": "ADM_DAY_HAS_BOOKINGS",
  "message": "Friday cannot be removed: there are future bookings.",
  "data": { "affected": [ { "date": "2026-10-02", "booked": 14 } ] }
}
```

## 7. Admin Screens

| Screen | Content |
|--------|---------|
| Departments | Table: name, active doctors, status; add / edit / activate-deactivate |
| Doctors list | Filter by department; table: name, department, specialization, fee, daily limit, days, login registered (Yes/No), status |
| Add / edit doctor | Section 1 Profile (name, department, qualification, specialization, reg. no., experience, phone, email, about). Section 2 Consultation (fee, daily limit). Section 3 Weekly timings (7 rows, checkbox per day + start/end time) |
| Doctor bookings | Pick date → booked count "38 / 50" and token list |

## 8. Error Codes

`AUTH_FORBIDDEN`, `ADM_DEPARTMENT_EXISTS`, `ADM_DEPARTMENT_HAS_DOCTORS`, `ADM_DEPARTMENT_INACTIVE`, `ADM_DOCTOR_REG_EXISTS`, `ADM_DOCTOR_REG_LOCKED`, `ADM_DOCTOR_INVALID`, `ADM_LIMIT_BELOW_BOOKED`, `ADM_DUPLICATE_DAY`, `ADM_INVALID_TIME`, `ADM_WINDOW_TOO_SHORT`, `ADM_DAY_HAS_BOOKINGS`, `ADM_DOCTOR_HAS_BOOKINGS`