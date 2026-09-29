INSERT INTO departments (dept_name, description) VALUES
  ('General Medicine', 'Primary and general health consultations'),
  ('Cardiology', 'Heart and cardiovascular care'),
  ('Orthopaedics', 'Bone, joint and muscle care'),
  ('Pediatrics', 'Child health care'),
  ('Dermatology', 'Skin, hair and nail care');

INSERT INTO doctors (department_id, full_name, qualification, experience_years) VALUES
  (2, 'Dr. Rahul Menon', 'MBBS, MD (Cardiology)', 12),
  (2, 'Dr. Sunitha Rao', 'MBBS, DM (Cardiology)', 9),
  (1, 'Dr. Anil Kumar', 'MBBS, MD (General Medicine)', 15),
  (3, 'Dr. Priya Nair', 'MBBS, MS (Orthopaedics)', 7),
  (4, 'Dr. Kavitha Shetty', 'MBBS, MD (Pediatrics)', 10),
  (5, 'Dr. Arjun Pillai', 'MBBS, MD (Dermatology)', 6);

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
