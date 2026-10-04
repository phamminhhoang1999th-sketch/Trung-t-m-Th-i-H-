export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused' | 'late';

// Ca học: Ca sáng, Chiều 1, Chiều 2, Tối
export type SessionShift = 'morning' | 'afternoon_1' | 'afternoon_2' | 'evening';

export interface SessionShiftConfig {
  id: SessionShift;
  label: string;
  shortLabel: string;
  defaultTime: string;
  description: string;
}

export const SESSION_SHIFTS: SessionShiftConfig[] = [
  { id: 'morning', label: 'Ca sáng', shortLabel: 'Sáng', defaultTime: '08:00 - 11:30', description: '08:00 - 11:30' },
  { id: 'afternoon_1', label: 'Chiều 1', shortLabel: 'Chiều 1', defaultTime: '14:00 - 16:30', description: '14:00 - 16:30' },
  { id: 'afternoon_2', label: 'Chiều 2', shortLabel: 'Chiều 2', defaultTime: '16:30 - 19:00', description: '16:30 - 19:00' },
  { id: 'evening', label: 'Tối', shortLabel: 'Tối', defaultTime: '19:00 - 21:30', description: '19:00 - 21:30' },
];

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  isMakeup?: boolean; // Học sinh từ lớp khác sang học bù
  makeupRequestId?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  shift?: SessionShift; // Ca sáng | Chiều 1 | Chiều 2 | Tối
  startTime?: string;
  endTime?: string;
  lessonTitle: string;
  homework?: string;
  teacherNote?: string;
  records: AttendanceRecord[];
  createdAt: string;
}

export type MakeupStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

export interface MakeupRequest {
  id: string;
  studentId: string;
  originalClassId: string;
  missedDate: string; // Ngày vắng
  reason: string;
  makeupClassId: string; // Lớp dự kiến học bù
  targetDate: string; // Ngày học bù
  status: MakeupStatus;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade: string;
  teacher: string;
  room: string;
  schedule: string; // e.g. "Thứ 3, Thứ 6 (18:00 - 19:30)"
  scheduleDays: number[]; // 0=CN, 1=T2, 2=T3, ..., 6=T7
  feePerSession: number; // e.g. 150000
  totalExpectedSessionsPerMonth: number;
  color: string;
  description?: string;
}

export interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Nam' | 'Nữ';
  parentName: string;
  parentPhone: string;
  address?: string;
  classIds: string[];
  joinDate: string;
  customFeePerSession?: number; // Học phí 1 buổi riêng của học sinh (nếu để trống sẽ tính theo học phí chung của lớp)
  discountPercent?: number; // 0 - 100%
  status: 'active' | 'suspended';
  note?: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceCode: string; // e.g. TH-202610-001
  studentId: string;
  classId: string;
  month: string; // YYYY-MM
  issueDate: string;
  dueDate: string;
  totalSessions: number; // Số buổi thực tế tính tiền
  feePerSession: number;
  baseAmount: number;
  discountPercent: number;
  discountAmount: number;
  materialFee?: number; // Đã bãi bỏ phí tài liệu giáo trình
  makeupSessionsCount: number; // Số buổi đã học bù
  excusedAbsencesCount: number;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  paymentDate?: string;
  paymentMethod?: 'vietqr' | 'cash' | 'transfer';
  transferSyntax: string;
  note?: string;
}

export interface CenterSettings {
  centerName: string;
  brandTitle: string;
  address: string;
  hotline: string;
  email: string;
  directorName: string;
  bankId: string; // e.g. "MB", "VCB", "TCB"
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  transferPrefix: string; // e.g. "THAIHA"
  defaultDueDays: number; // e.g. 7 days from issue
  invoiceFooterNote: string;
}

export interface BankInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  bin: string;
  logo?: string;
}

export type UserRole = 'admin' | 'manager' | 'teacher';

export interface UserPermissions {
  canViewTuition: boolean; // Chỉ admin và manager mới xem được học phí
  canEditTuition: boolean;
  canManageUsers: boolean; // Cấp tài khoản và phân quyền
  canManageClasses: boolean;
  canManageStudents: boolean;
  canMarkAttendance: boolean;
  canManageMakeup: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  assignedClassIds: string[]; // Danh sách ID các lớp giáo viên được phụ trách
  status: 'active' | 'blocked';
  password?: string;
  createdAt: string;
  permissions: UserPermissions;
}

