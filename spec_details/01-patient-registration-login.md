# HMS Appointment Booking — 01 Patient Registration and Login

Version: 1.0

## 1. Purpose

A patient must register before booking. Registration creates the patient with login credentials. Login returns a JWT used for all booking APIs.

## 2. Table

```sql
CREATE TABLE patients (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_code    VARCHAR(20)  NULL UNIQUE,      -- PAT000123, set right after insert
  first_name      VARCHAR(50)  NOT NULL,
  last_name       VARCHAR(50)  NULL,
  date_of_birth   DATE         NOT NULL,
  gender          VARCHAR(10)  NOT NULL,
  phone           VARCHAR(15)  NOT NULL UNIQUE,  -- used as login id
  email           VARCHAR(100) NULL UNIQUE,
  password_hash   VARCHAR(100) NOT NULL,         -- BCrypt
  address         VARCHAR(250) NULL,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_pat_gender CHECK (gender IN ('MALE','FEMALE','OTHER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 3. Business Rules

| ID | Rule |
|----|------|
| PAT-R1 | Required: firstName, dateOfBirth, gender, phone, password → else 400 with `fieldErrors`. |
| PAT-R2 | Phone must be 10 digits starting with 6–9 → `PAT_PHONE_INVALID`. |
| PAT-R3 | If phone already registered → `PAT_PHONE_EXISTS`. |
| PAT-R4 | If email given and already registered → `PAT_EMAIL_EXISTS`. |
| PAT-R5 | Date of birth cannot be in the future → `PAT_DOB_INVALID`. |
| PAT-R6 | Password: minimum 8 characters, at least one letter and one digit → `PAT_WEAK_PASSWORD`. |
| PAT-R7 | After insert, in the same transaction: `patient_code = CONCAT('PAT', LPAD(id, 6, '0'))`. |
| PAT-R8 | Login with phone + password. If phone not found or password wrong → `AUTH_INVALID_CREDENTIALS` (same message for both). |
| PAT-R9 | If `is_active = 0` → `AUTH_ACCOUNT_INACTIVE`. |
| PAT-R10 | JWT access token valid 60 minutes, claims: `sub` = patient id, `name`, `patientCode`. |
| PAT-R11 | Every booking API takes the patient id from the token, never from the request body. |

## 4. APIs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | public | Register patient |
| POST | /auth/login | public | Login, returns token |
| GET | /patients/me | patient | Own profile |

### 4.1 Register

```json
POST /api/v1/auth/register
{
  "firstName": "John",
  "lastName": "Mathew",
  "dateOfBirth": "1988-04-12",
  "gender": "MALE",
  "phone": "9845012345",
  "email": "john@mail.com",
  "password": "john1234",
  "address": "Kuvempunagar, Mysuru"
}
```

Response `201`:
```json
{ "success": true, "data": { "patientId": 123, "patientCode": "PAT000123" }, "message": "Registration successful. Please log in." }
```

### 4.2 Login

```json
POST /api/v1/auth/login
{ "phone": "9845012345", "password": "john1234" }
```

```json
{ "success": true, "data": { "accessToken": "eyJ...", "expiresIn": 3600, "patient": { "id": 123, "patientCode": "PAT000123", "name": "John Mathew" } } }
```

## 5. Error Codes

`PAT_PHONE_INVALID`, `PAT_PHONE_EXISTS`, `PAT_EMAIL_EXISTS`, `PAT_DOB_INVALID`, `PAT_WEAK_PASSWORD`, `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_INACTIVE`
