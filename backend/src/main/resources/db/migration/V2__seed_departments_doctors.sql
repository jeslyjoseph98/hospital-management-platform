INSERT INTO departments (dept_name, description) VALUES
  ('General Medicine', 'Primary and general health consultations'),
  ('Cardiology', 'Heart and cardiovascular care'),
  ('Orthopaedics', 'Bone, joint and muscle care'),
  ('Pediatrics', 'Child health care'),
  ('Dermatology', 'Skin, hair and nail care');

INSERT INTO doctors (department_id, full_name, qualification, specialization, registration_number, experience_years, phone, email, about, consultation_fee) VALUES
  (2, 'Dr. Rahul Menon', 'MBBS, MD (Cardiology)', 'Cardiologist', 'KMC-45821', 12, '9876543210', 'rahul.menon@hospital.in', 'Interventional cardiologist with 12 years of experience.', 500.00),
  (2, 'Dr. Sunitha Rao', 'MBBS, DM (Cardiology)', 'Cardiologist', 'KMC-45822', 9, '9876543211', 'sunitha.rao@hospital.in', 'Specialist in non-invasive cardiac imaging.', 450.00),
  (1, 'Dr. Anil Kumar', 'MBBS, MD (General Medicine)', 'General Physician', 'KMC-45823', 15, '9876543212', 'anil.kumar@hospital.in', 'General physician focused on preventive care.', 300.00),
  (3, 'Dr. Priya Nair', 'MBBS, MS (Orthopaedics)', 'Orthopaedic Surgeon', 'KMC-45824', 7, '9876543213', 'priya.nair@hospital.in', 'Joint replacement and sports injury specialist.', 400.00),
  (4, 'Dr. Kavitha Shetty', 'MBBS, MD (Pediatrics)', 'Pediatrician', 'KMC-45825', 10, '9876543214', 'kavitha.shetty@hospital.in', 'Child health and vaccination specialist.', 350.00),
  (5, 'Dr. Arjun Pillai', 'MBBS, MD (Dermatology)', 'Dermatologist', 'KMC-45826', 6, '9876543215', 'arjun.pillai@hospital.in', 'Skin, hair and cosmetic dermatology.', 400.00);

INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
  (1, 1, '10:00', '13:00'),
  (1, 3, '14:00', '17:00'),
  (1, 5, '10:00', '13:00'),
  (2, 2, '09:00', '12:00'),
  (2, 4, '09:00', '12:00'),
  (2, 6, '09:00', '11:00'),
  (3, 1, '09:00', '13:00'),
  (3, 2, '09:00', '13:00'),
  (3, 3, '09:00', '13:00'),
  (3, 4, '09:00', '13:00'),
  (3, 5, '09:00', '13:00'),
  (4, 2, '11:00', '15:00'),
  (4, 5, '11:00', '15:00'),
  (5, 1, '10:00', '14:00'),
  (5, 3, '10:00', '14:00'),
  (6, 6, '10:00', '13:00');
