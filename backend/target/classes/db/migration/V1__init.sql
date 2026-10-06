-- spec_details/01-registration-login.md — common login account for every role
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

-- spec_details/02-department-doctor-availability.md
CREATE TABLE departments (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  dept_name   VARCHAR(100) NOT NULL UNIQUE,     -- Cardiology
  description VARCHAR(300) NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  created_by  BIGINT       NULL,
  updated_by  BIGINT       NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE doctors (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id              BIGINT        NULL UNIQUE,     -- spec 06: set when the doctor registers (REG-R13)
  department_id        BIGINT        NOT NULL,
  full_name            VARCHAR(100)  NOT NULL,
  qualification        VARCHAR(150)  NOT NULL,        -- MBBS, MD (Cardiology)
  specialization       VARCHAR(100)  NOT NULL,        -- Cardiologist
  registration_number  VARCHAR(50)   NOT NULL UNIQUE,  -- medical council registration no.
  experience_years     INT           NOT NULL DEFAULT 0,
  phone                VARCHAR(15)   NULL,
  email                VARCHAR(100)  NULL,
  about                VARCHAR(1000) NULL,             -- short profile shown to patients
  consultation_fee     DECIMAL(10,2) NOT NULL DEFAULT 0,  -- display only, no payment module
  daily_limit          INT           NOT NULL DEFAULT 50, -- max appointments per day
  is_active            TINYINT(1)    NOT NULL DEFAULT 1,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  created_by           BIGINT        NULL,
  updated_by           BIGINT        NULL,
  CONSTRAINT fk_doc_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(id),
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
  created_by   BIGINT     NULL,
  updated_by   BIGINT     NULL,
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
  CONSTRAINT chk_apt_status CHECK (status IN ('BOOKED','COMPLETED')),   -- COMPLETED set by doctor (spec 06)
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

-- spec_details/06-doctor-portal-consultation.md
CREATE TABLE consultations (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  appointment_id    BIGINT        NOT NULL UNIQUE,   -- one consultation per appointment
  patient_id        BIGINT        NOT NULL,
  doctor_id         BIGINT        NOT NULL,
  chief_complaint   VARCHAR(500)  NULL,              -- "Fever for 3 days"
  symptoms          VARCHAR(1000) NULL,
  temperature_c     DECIMAL(4,1)  NULL,
  pulse_bpm         INT           NULL,
  bp_systolic       INT           NULL,
  bp_diastolic      INT           NULL,
  weight_kg         DECIMAL(5,2)  NULL,
  diagnosis         VARCHAR(500)  NULL,
  doctor_notes      VARCHAR(2000) NULL,              -- internal, not shown to patient
  advice            VARCHAR(1000) NULL,              -- "Rest and hydration", shown to patient
  follow_up_date    DATE          NULL,
  status            VARCHAR(20)   NOT NULL DEFAULT 'IN_PROGRESS',
  completed_at      DATETIME      NULL,
  dispense_status   VARCHAR(20)   NOT NULL DEFAULT 'NOT_REQUIRED',  -- spec 07: set when consultation completes
  dispensed_by      BIGINT        NULL,              -- users.id of pharmacist
  dispensed_at      DATETIME      NULL,
  dispense_remarks  VARCHAR(500)  NULL,               -- "Cetirizine not available, advised to buy outside"
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_con_apt     FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  CONSTRAINT fk_con_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_con_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id),
  CONSTRAINT fk_con_dispensed_by FOREIGN KEY (dispensed_by) REFERENCES users(id),
  CONSTRAINT chk_con_status CHECK (status IN ('IN_PROGRESS','COMPLETED')),
  CONSTRAINT chk_con_dispense CHECK (dispense_status IN ('NOT_REQUIRED','PENDING','DISPENSED')),
  INDEX idx_con_patient (patient_id, created_at),
  INDEX idx_con_dispense (dispense_status, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prescription_items (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  consultation_id   BIGINT       NOT NULL,
  medicine_name     VARCHAR(150) NOT NULL,     -- Paracetamol
  strength          VARCHAR(50)  NULL,         -- 500mg
  dosage_pattern    VARCHAR(20)  NOT NULL,     -- 1-0-1 (morning-afternoon-night)
  timing            VARCHAR(20)  NOT NULL,
  duration_days     INT          NOT NULL,
  instructions      VARCHAR(300) NULL,
  display_order     INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_rxi_con     FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  CONSTRAINT chk_rxi_timing CHECK (timing IN ('BEFORE_FOOD','AFTER_FOOD','BEDTIME','AS_NEEDED')),
  CONSTRAINT chk_rxi_dur    CHECK (duration_days BETWEEN 1 AND 365),
  INDEX idx_rxi_con (consultation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
