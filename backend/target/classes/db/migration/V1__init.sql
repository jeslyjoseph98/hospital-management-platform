-- spec_details/01-patient-registration-login.md
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

-- spec_details/02-department-doctor-availability.md
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
  full_name         VARCHAR(100) NOT NULL,
  qualification     VARCHAR(150) NOT NULL,
  experience_years  INT          NOT NULL DEFAULT 0,
  daily_limit       INT          NOT NULL DEFAULT 50,   -- max appointments per day
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT chk_doc_limit CHECK (daily_limit BETWEEN 1 AND 200),
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

-- spec_details/03-appointment-booking.md
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
  CONSTRAINT chk_apt_status CHECK (status IN ('BOOKED')),   -- more statuses added when cancel/consult are built
  CONSTRAINT chk_apt_token  CHECK (token_number >= 1),
  UNIQUE KEY uq_apt_token   (doctor_id, appointment_date, token_number),  -- no two patients get the same token
  UNIQUE KEY uq_apt_patient (patient_id, doctor_id, appointment_date),    -- one booking per patient per doctor per day
  INDEX idx_apt_doctor_date (doctor_id, appointment_date),
  INDEX idx_apt_patient (patient_id, appointment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- spec_details/04-booking-notification.md
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
