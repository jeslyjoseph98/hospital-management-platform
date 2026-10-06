# HMS Appointment Booking — 02 Departments, Doctors and Availability

Version: 1.1

## 1. Purpose

List departments, list doctors in a department, and show on which dates a doctor is available and how many of the 50 daily appointments are left.

The data in these tables is entered by the admin (spec 05). This spec covers the tables and the patient-facing read APIs.

## 2. Tables

```sql
CREATE TABLE departments (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  dept_name   VARCHAR(100) NOT NULL UNIQUE,     -- Cardiology
  description VARCHAR(300) NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE doctors (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  department_id     BIGINT       NOT NULL,
  full_name            VARCHAR(100)  NOT NULL,
  qualification        VARCHAR(150)  NOT NULL,        -- MBBS, MD (Cardiology)
  specialization       VARCHAR(100)  NOT NULL,        -- Cardiologist
  registration_number  VARCHAR(50)   NOT NULL UNIQUE, -- medical council registration no.
  experience_years     INT           NOT NULL DEFAULT 0,
  phone                VARCHAR(15)   NULL,
  email                VARCHAR(100)  NULL,
  about                VARCHAR(1000) NULL,            -- short profile shown to patients
  consultation_fee     DECIMAL(10,2) NOT NULL DEFAULT 0,  -- display only, no payment module
  daily_limit          INT           NOT NULL DEFAULT 50, -- max appointments per day
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT chk_doc_limit CHECK (daily_limit BETWEEN 1 AND 200),
  CONSTRAINT chk_doc_fee   CHECK (consultation_fee >= 0),
  CONSTRAINT chk_doc_exp   CHECK (experience_years BETWEEN 0 AND 70),
  INDEX idx_doc_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Weekly availability: one row per working day
CREATE TABLE doctor_availability (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  doctor_id    BIGINT     NOT NULL,
  day_of_week  TINYINT    NOT NULL,     -- 1 = Monday ... 7 = Sunday
  start_time   TIME       NOT NULL,     -- 10:00
  end_time     TIME       NOT NULL,     -- 14:00
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME   NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_da_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  CONSTRAINT chk_da_day  CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT chk_da_time CHECK (end_time > start_time),
  UNIQUE KEY uq_da_doctor_day (doctor_id, day_of_week)   -- one window per day keeps it simple
) ENGINE=InnoDB;
```

`daily_limit` defaults to 50. It is a column (not a hard-coded 50) so it can be changed per doctor later without code changes.

## 3. Availability Calculation

For `GET /doctors/{id}/availability`, for each date from today to today + 6 (7 days):

1. Get the date's `day_of_week` (Monday = 1).
2. If no active `doctor_availability` row for that day → status `NOT_AVAILABLE`, skip the rest.
3. Count bookings: `SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status = 'BOOKED'`.
4. `remaining = daily_limit - bookedCount`.
5. If date is today and current time ≥ `end_time` → status `CLOSED`.
6. Else if `remaining <= 0` → status `FULLY_BOOKED`.
7. Else → status `AVAILABLE`.

The UI disables dates that are not `AVAILABLE`.

## 4. Business Rules

| ID | Rule |
|----|------|
| DOC-R1 | Only active departments are listed. |
| DOC-R2 | Only active doctors of an active department are listed. |
| DOC-R3 | Department with id not found or inactive → `DOC_DEPARTMENT_NOT_FOUND`. |
| DOC-R4 | Doctor not found or inactive → `DOC_NOT_FOUND`. |
| DOC-R5 | Booking window is today + 6 days. Availability is only returned for this window. |

## 5. APIs

All require a logged-in patient.

| Method | Path | Description |
|--------|------|-------------|
| GET | /departments | Active departments |
| GET | /departments/{id}/doctors | Active doctors in the department, with weekly timings |
| GET | /doctors/{id}/availability | Next 7 days with status and remaining count |

### 5.1 Doctors by department

```json
GET /api/v1/departments/2/doctors
{
  "success": true,
  "data": [
    {
      "id": 3,
      "fullName": "Dr. Rahul Menon",
      "qualification": "MBBS, MD (Cardiology)",
      "specialization": "Cardiologist",
      "experienceYears": 12,
      "consultationFee": 500.00,
      "about": "Interventional cardiologist with 12 years of experience.",
      "timings": [
        { "day": "MONDAY",    "startTime": "10:00", "endTime": "13:00" },
        { "day": "WEDNESDAY", "startTime": "14:00", "endTime": "17:00" },
        { "day": "FRIDAY",    "startTime": "10:00", "endTime": "13:00" }
      ]
    }
  ]
}
```

### 5.2 Availability

```json
GET /api/v1/doctors/3/availability
{
  "success": true,
  "data": {
    "doctorId": 3,
    "doctorName": "Dr. Rahul Menon",
    "dailyLimit": 50,
    "dates": [
      { "date": "2026-09-28", "day": "MONDAY",    "startTime": "10:00", "endTime": "13:00", "booked": 38, "remaining": 12, "status": "AVAILABLE" },
      { "date": "2026-09-29", "day": "TUESDAY",   "status": "NOT_AVAILABLE" },
      { "date": "2026-09-30", "day": "WEDNESDAY", "startTime": "14:00", "endTime": "17:00", "booked": 50, "remaining": 0, "status": "FULLY_BOOKED" }
    ]
  }
}
```

## 6. Data Entry

Departments, doctors and timings are created by the admin (spec 05). Patients never see `registration_number`, `phone` or `email` of doctors.

## 7. Error Codes

`DOC_DEPARTMENT_NOT_FOUND`, `DOC_NOT_FOUND`