export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string | null;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  errorCode: string;
  message: string;
  fieldErrors?: FieldError[];
  data?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type Role = "PATIENT" | "ADMIN" | "DOCTOR" | "PHARMACIST";

export interface UserSummary {
  id: number;
  name: string;
  role: Role;
  patientId?: number;
  patientCode?: string;
  doctorId?: number;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: UserSummary;
}

export interface RegisterRequest {
  role: Role;
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  adminCode?: string;
  registrationNumber?: string;
  staffCode?: string;
}

export interface RegisterResponse {
  userId: number;
  role: Role;
  patientCode?: string;
}

export interface PatientProfile {
  id: number;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface Department {
  id: number;
  deptName: string;
  description?: string;
}

export interface DoctorTiming {
  day: string;
  startTime: string;
  endTime: string;
}

export interface DoctorWithTimings {
  id: number;
  fullName: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  about?: string;
  timings: DoctorTiming[];
}

export type DateStatus = "AVAILABLE" | "FULLY_BOOKED" | "CLOSED" | "NOT_AVAILABLE";

export interface DateAvailability {
  date: string;
  day: string;
  startTime?: string;
  endTime?: string;
  booked?: number;
  remaining?: number;
  status: DateStatus;
}

export interface DoctorAvailability {
  doctorId: number;
  doctorName: string;
  dailyLimit: number;
  dates: DateAvailability[];
}

export interface BookRequest {
  doctorId: number;
  appointmentDate: string;
  reason?: string;
}

export interface BookResponse {
  appointmentId: number;
  appointmentCode: string;
  tokenNumber: number;
  reportingTime: string;
  appointmentDate: string;
  doctorName: string;
  departmentName: string;
  consultationTimings: string;
  patientName: string;
  patientCode: string;
}

export type AppointmentStatus = "BOOKED" | "COMPLETED";

export interface AppointmentSummary {
  id: number;
  appointmentCode: string;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  tokenNumber: number;
  reportingTime: string;
  status: AppointmentStatus;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  appointmentId?: number;
  isRead: boolean;
  createdAt: string;
}

// ---- Admin ----

export interface AdminDepartment {
  id: number;
  deptName: string;
  description?: string;
  active: boolean;
  activeDoctorCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TimingInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AdminTiming extends TimingInput {
  day: string;
}

export interface CreateDoctorRequest {
  departmentId: number;
  fullName: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  experienceYears?: number;
  phone?: string;
  email?: string;
  about?: string;
  consultationFee: number;
  dailyLimit?: number;
  timings?: TimingInput[];
}

export type UpdateDoctorRequest = Omit<CreateDoctorRequest, "timings">;

export interface AdminDoctor {
  id: number;
  departmentId: number;
  departmentName: string;
  fullName: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  experienceYears: number;
  phone?: string;
  email?: string;
  about?: string;
  consultationFee: number;
  dailyLimit: number;
  active: boolean;
  timings: AdminTiming[];
}

export interface AdminDoctorSummary {
  id: number;
  fullName: string;
  departmentName: string;
  specialization: string;
  consultationFee: number;
  dailyLimit: number;
  days: string[];
  active: boolean;
}

export interface DoctorBookingToken {
  tokenNumber: number;
  patientName: string;
  patientCode: string;
  reportingTime: string;
  status: string;
}

export interface DoctorBookings {
  date: string;
  booked: number;
  dailyLimit: number;
  tokens: DoctorBookingToken[];
}

export interface AffectedDate {
  date: string;
  booked: number;
}

// ---- Doctor portal (spec 06) ----

export type DoctorAppointmentStatus = "BOOKED" | "IN_PROGRESS" | "COMPLETED";

export interface TodayAppointmentItem {
  appointmentId: number;
  tokenNumber: number;
  reportingTime: string;
  patientId: number;
  patientName: string;
  patientCode: string;
  age: number;
  gender: string;
  status: DoctorAppointmentStatus;
}

export interface TodayAppointments {
  date: string;
  total: number;
  completed: number;
  pending: number;
  appointments: TodayAppointmentItem[];
}

export interface PatientBrief {
  patientId: number;
  patientCode: string;
  fullName: string;
  age: number;
  gender: string;
  phone?: string;
  address?: string;
}

export interface PrescriptionItem {
  medicineName: string;
  strength?: string;
  dosagePattern: string;
  timing: "BEFORE_FOOD" | "AFTER_FOOD" | "BEDTIME" | "AS_NEEDED";
  durationDays: number;
  instructions?: string;
}

export interface Consultation {
  id: number;
  status: "IN_PROGRESS" | "COMPLETED";
  chiefComplaint?: string;
  symptoms?: string;
  temperatureC?: number;
  pulseBpm?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  weightKg?: number;
  diagnosis?: string;
  doctorNotes?: string;
  advice?: string;
  followUpDate?: string;
  prescription: PrescriptionItem[];
}

export interface DoctorAppointmentDetail {
  appointmentId: number;
  tokenNumber: number;
  appointmentDate: string;
  reportingTime: string;
  reason?: string;
  status: string;
  patient: PatientBrief;
  consultation: Consultation | null;
}

export interface PastVisit {
  date: string;
  doctorName: string;
  departmentName: string;
  diagnosis?: string;
  advice?: string;
  doctorNotes?: string;
  prescription: PrescriptionItem[];
  dispenseStatus: DispenseStatus;
  dispensedAt?: string;
  dispenseRemarks?: string;
}

export interface PatientDetail {
  patient: PatientBrief;
  pastVisits: PastVisit[];
}

export interface SaveConsultationRequest {
  chiefComplaint?: string;
  symptoms?: string;
  temperatureC?: number;
  pulseBpm?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  weightKg?: number;
  diagnosis?: string;
  doctorNotes?: string;
  advice?: string;
  followUpDate?: string;
  prescription: PrescriptionItem[];
}

export type DispenseStatus = "NOT_REQUIRED" | "PENDING" | "DISPENSED";

export interface PatientConsultationView {
  date: string;
  doctorName: string;
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
  temperatureC?: number;
  pulseBpm?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  weightKg?: number;
  prescription: PrescriptionItem[];
  dispenseStatus: DispenseStatus;
  dispensedAt?: string;
  dispenseRemarks?: string;
}

// ---- Pharmacy (spec 07) ----

export interface PrescriptionListItem {
  consultationId: number;
  appointmentCode: string;
  tokenNumber: number;
  patientName: string;
  patientCode: string;
  doctorName: string;
  departmentName: string;
  completedAt: string;
  itemCount: number;
  dispenseStatus: DispenseStatus;
}

export interface PrescriptionPatientMini {
  name: string;
  patientCode: string;
  age: number;
  gender: string;
}

export interface PrescriptionDetail {
  consultationId: number;
  patient: PrescriptionPatientMini;
  doctorName: string;
  consultationDate: string;
  diagnosis?: string;
  items: PrescriptionItem[];
  followUpDate?: string;
  dispenseStatus: DispenseStatus;
  dispensedAt?: string;
  dispensedByName?: string;
  dispenseRemarks?: string;
}
