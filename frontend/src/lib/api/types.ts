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
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PatientSummary {
  id: number;
  patientCode: string;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  patient: PatientSummary;
}

export interface RegisterRequest {
  firstName: string;
  lastName?: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  email?: string;
  password: string;
  address?: string;
}

export interface RegisterResponse {
  patientId: number;
  patientCode: string;
}

export interface PatientProfile {
  id: number;
  patientCode: string;
  firstName: string;
  lastName?: string;
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
  experienceYears: number;
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

export type AppointmentStatus = "BOOKED";

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
