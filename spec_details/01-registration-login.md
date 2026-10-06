# HMS Appointment Booking — 01 Registration, Login and Role-Based Screens

Version: 2.3 (PHARMACIST role added)

## 1. Purpose

One portal, one registration page, one login page. The user chooses a role while registering. After login, the screens shown depend on the role:

| Role | Home screen after login | Can use |
|------|-------------------------|---------|
| PATIENT | Book Appointment | Book appointment, My appointments, Notifications (specs 02–04) |
| ADMIN | Manage Doctors | Departments, Doctors, Doctor bookings (spec 05) |
| DOCTOR | Today's Appointments | Today's appointments, patient details, consultation and prescription (spec 06) |
| PHARMACIST | Pending Prescriptions | View prescriptions, give medicine, mark as done (spec 07) |

## 2. Tables

```sql
-- Common login account for every role
CREATE TABLE users (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(15)  NOT NULL UNIQUE,   -- login id
  email          VARCHAR(100) NULL UNIQUE,
  password_hash  VARCHAR(100) NOT NULL,          -- BCrypt
  role           VARCHAR(20)  NOT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at  DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_role CHECK (role IN ('PATIENT','ADMIN','DOCTOR','PHARMACIST'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Extra details, only for PATIENT users (one row per patient user)
CREATE TABLE patients (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT       NOT NULL UNIQUE,
  patient_code   VARCHAR(20)  NULL UNIQUE,       -- PAT000123, set right after insert
  date_of_birth  DATE         NOT NULL,
  gender         VARCHAR(10)  NOT NULL,
  address        VARCHAR(250) NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pat_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_pat_gender CHECK (gender IN ('MALE','FEMALE','OTHER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`appointments.patient_id` and `notifications.patient_id` (specs 03, 04) still reference `patients(id)`. Admin, doctor and pharmacist users have no `patients` row. A doctor user is linked through `doctors.user_id` (spec 02).

## 3. Registration

### 3.1 Screen

One form with a **Register as** dropdown: `Patient` / `Doctor` / `Pharmacist` / `Admin`.

| Field | Patient | Doctor | Pharmacist | Admin |
|-------|---------|--------|------------|-------|
| Register as | ✔ | ✔ | ✔ | ✔ |
| Full name | ✔ required | ✔ required | ✔ required | ✔ required |
| Phone | ✔ required | ✔ required (must match phone admin entered) | ✔ required | ✔ required |
| Email | optional | optional | optional | optional |
| Password / Confirm password | ✔ required | ✔ required | ✔ required | ✔ required |
| Date of birth | ✔ required | hidden | hidden | hidden |
| Gender | ✔ required | hidden | hidden | hidden |
| Address | optional | hidden | hidden | hidden |
| Medical registration number | hidden | ✔ required | hidden | hidden |
| Staff registration code | hidden | hidden | ✔ required | hidden |
| Admin registration code | hidden | hidden | hidden | ✔ required |

When the dropdown changes, the form shows/hides the fields in the table above.

### 3.2 Rules

| ID | Rule |
|----|------|
| REG-R1 | `role` must be `PATIENT`, `DOCTOR`, `PHARMACIST` or `ADMIN` → `REG_INVALID_ROLE`. |
| REG-R2 | Common required fields: fullName, phone, password → else 400 with `fieldErrors`. |
| REG-R3 | Phone must be 10 digits starting 6–9 → `REG_PHONE_INVALID`. |
| REG-R4 | Phone already registered (any role) → `REG_PHONE_EXISTS`. |
| REG-R5 | Email given and already registered → `REG_EMAIL_EXISTS`. |
| REG-R6 | Password: min 8 chars, at least one letter and one digit → `REG_WEAK_PASSWORD`. |
| REG-R7 | If role = PATIENT: dateOfBirth and gender required; date of birth not in the future → `REG_DOB_INVALID`. |
| REG-R8 | If role = ADMIN: `adminCode` must equal `hms.admin-registration-code` from `application.yml` → `REG_ADMIN_CODE_INVALID`. |
| REG-R8a | If role = PHARMACIST: `staffCode` must equal `hms.pharmacy-registration-code` from `application.yml` → `REG_STAFF_CODE_INVALID`. Same reason as REG-R8: stops patients registering as pharmacy staff. |
| REG-R9 | Save in one transaction: insert `users`. If role = PATIENT, insert `patients` and set `patient_code = CONCAT('PAT', LPAD(id, 6, '0'))`. |
| REG-R10 | Fields that don't belong to the chosen role are ignored if sent. |
| REG-R11 | If role = DOCTOR: find `doctors` row by `registration_number`. If not found or inactive → `REG_DOCTOR_NOT_FOUND` ("Ask the admin to add your profile first"). |
| REG-R12 | If role = DOCTOR: the entered phone must equal `doctors.phone` → `REG_DOCTOR_PHONE_MISMATCH`. This proves the person registering is that doctor. |
| REG-R13 | If role = DOCTOR: if `doctors.user_id` is already set → `REG_DOCTOR_ALREADY_REGISTERED`. Otherwise insert `users` and set `doctors.user_id` in the same transaction. |

Why REG-R8: without it, anyone on the internet could pick "Admin" and add or deactivate doctors. The code is one config value and one if-check; share it only with hospital staff.

### 3.3 API

```json
POST /api/v1/auth/register
{
  "role": "PATIENT",
  "fullName": "John Mathew",
  "phone": "9845012345",
  "email": "john@mail.com",
  "password": "john1234",
  "dateOfBirth": "1988-04-12",
  "gender": "MALE",
  "address": "Kuvempunagar, Mysuru"
}
```

```json
POST /api/v1/auth/register
{
  "role": "ADMIN",
  "fullName": "Anita Rao",
  "phone": "9900112233",
  "password": "anita1234",
  "adminCode": "HMS-ADMIN-2026"
}
```

Response `201`:
```json
{ "success": true, "data": { "userId": 7, "role": "PATIENT", "patientCode": "PAT000123" }, "message": "Registration successful. Please log in." }
```
```json
POST /api/v1/auth/register
{
  "role": "DOCTOR",
  "fullName": "Dr. Rahul Menon",
  "phone": "9876543210",
  "password": "rahul1234",
  "registrationNumber": "KMC-45821"
}
```

(`patientCode` is `null` for every role except PATIENT.)

## 4. Login

Same page and same API for every role. The login page has a **Login as** dropdown: `Patient` / `Doctor` / `Pharmacist` / `Admin`, then phone and password.

### 4.0 Screen

| Field | Required |
|-------|----------|
| Login as (Patient / Doctor / Pharmacist / Admin) | ✔ |
| Phone | ✔ |
| Password | ✔ |

After a successful login, the screen shown depends on the role (section 5).

### 4.1 Rules

| ID | Rule |
|----|------|
| LOG-R0 | `role` required and must be `PATIENT`, `DOCTOR`, `PHARMACIST` or `ADMIN` → `REG_INVALID_ROLE`. |
| LOG-R1 | Login with phone + password. Phone not found or wrong password → `AUTH_INVALID_CREDENTIALS` (same message for both). |
| LOG-R1a | Only after the password is verified: if selected `role` ≠ `users.role` → `AUTH_ROLE_MISMATCH` ("This account is not registered as Doctor"). Checking after the password means a stranger can't use this to find out which phones are registered. |
| LOG-R2 | `is_active = 0` → `AUTH_ACCOUNT_INACTIVE`. If role = DOCTOR and the linked `doctors.is_active = 0` → also `AUTH_ACCOUNT_INACTIVE`. |
| LOG-R3 | JWT valid 60 minutes. Claims: `sub` = user id, `role`, `name`, `patientId` only if role = PATIENT, `doctorId` only if role = DOCTOR. |
| LOG-R4 | Backend: `/api/v1/admin/**` requires role ADMIN; `/api/v1/doctor/**` requires role DOCTOR; `/api/v1/pharmacy/**` requires role PHARMACIST; patient APIs (`/appointments`, `/notifications`, `/departments`, `/doctors`) require role PATIENT → else 403 `AUTH_FORBIDDEN`. |
| LOG-R5 | Patient APIs take `patientId`, doctor APIs take `doctorId`, from the token, never from the request body. |

### 4.2 API

```json
POST /api/v1/auth/login
{ "role": "PATIENT", "phone": "9845012345", "password": "john1234" }
```

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 3600,
    "user": { "id": 7, "name": "John Mathew", "role": "PATIENT", "patientId": 123, "patientCode": "PAT000123" }
  }
}
```

`GET /api/v1/auth/me` returns the same `user` object (used on page refresh).

## 5. Role-Based Screen Rendering (frontend)

### 5.1 After login

```
if role == "PATIENT"  → go to /patient/book-appointment
if role == "ADMIN"    → go to /admin/doctors
if role == "DOCTOR"   → go to /doctor/today
if role == "PHARMACIST" → go to /pharmacy/prescriptions
```

### 5.2 Routes

| Route | Role | Screen |
|-------|------|--------|
| /login | public | Login |
| /register | public | Registration (role dropdown) |
| /patient/book-appointment | PATIENT | Department → doctor → date → confirm (spec 03) |
| /patient/appointments | PATIENT | My appointments |
| /patient/notifications | PATIENT | Notifications |
| /admin/doctors | ADMIN | Doctors list, add/edit doctor (spec 05) |
| /admin/departments | ADMIN | Departments |
| /admin/bookings | ADMIN | Doctor bookings by date |
| /doctor/today | DOCTOR | Today's appointments (spec 06) |
| /doctor/appointments/{id} | DOCTOR | Patient details + consultation + prescription |
| /doctor/patients/{id} | DOCTOR | Patient visit history |
| /pharmacy/prescriptions | PHARMACIST | Pending / search prescriptions (spec 07) |
| /pharmacy/prescriptions/{id} | PHARMACIST | Prescription detail, Mark as Done |

### 5.3 Route guard rules

| ID | Rule |
|----|------|
| UI-R1 | No token → redirect to `/login`. |
| UI-R2 | Route starts with `/admin` and role ≠ ADMIN → redirect to the user's own home (5.1). |
| UI-R3 | Route starts with `/patient` and role ≠ PATIENT → redirect to the user's own home. |
| UI-R3a | Route starts with `/doctor` and role ≠ DOCTOR → redirect to the user's own home. |
| UI-R3b | Route starts with `/pharmacy` and role ≠ PHARMACIST → redirect to the user's own home. |
| UI-R4 | Logged-in user opens `/login` or `/register` → redirect to own home. |
| UI-R5 | Any API returns 401 → clear token, redirect to `/login`. |

The guard only hides screens. Real protection is the backend check in LOG-R4.

### 5.4 Menu

| Role | Menu items |
|------|-----------|
| PATIENT | Book Appointment · My Appointments · Notifications (bell with unread count) · Logout |
| ADMIN | Doctors · Departments · Bookings · Logout |
| DOCTOR | Today's Appointments · Logout |
| PHARMACIST | Prescriptions · Logout |

## 6. Error Codes

`REG_INVALID_ROLE`, `REG_PHONE_INVALID`, `REG_PHONE_EXISTS`, `REG_EMAIL_EXISTS`, `REG_WEAK_PASSWORD`, `REG_DOB_INVALID`, `REG_ADMIN_CODE_INVALID`, `REG_STAFF_CODE_INVALID`, `REG_DOCTOR_NOT_FOUND`, `REG_DOCTOR_PHONE_MISMATCH`, `REG_DOCTOR_ALREADY_REGISTERED`, `AUTH_INVALID_CREDENTIALS`, `AUTH_ROLE_MISMATCH`, `AUTH_ACCOUNT_INACTIVE`, `AUTH_FORBIDDEN`