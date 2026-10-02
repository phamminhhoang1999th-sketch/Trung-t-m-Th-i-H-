import { Classroom, Student, AttendanceSession, MakeupRequest, Invoice, CenterSettings, UserAccount } from '../types';

export const INITIAL_SETTINGS: CenterSettings = {
  centerName: 'Trung Tâm Giáo Dục Thái Hà',
  brandTitle: 'Hệ Thống Bồi Dưỡng Kiến Thức & Luyện Thi Chất Lượng Cao',
  address: '180 Phố Thái Hà, TP. Thanh Hóa, Tỉnh Thanh Hóa',
  hotline: '0988.567.890',
  email: 'tuyensinh@giaoducthaiha.edu.vn',
  directorName: 'ThS. Nguyễn Thái Hà',
  bankId: 'MB',
  bankName: 'MBBank (Ngân Hàng Quân Đội)',
  bankAccountNo: '0988567890',
  bankAccountName: 'TRUNG TAM GIAO DUC THAI HA',
  transferPrefix: 'THAIHA',
  defaultDueDays: 7,
  invoiceFooterNote: 'Cảm ơn Quý phụ huynh đã đồng hành cùng Trung tâm Giáo dục Thái Hà. Mọi thắc mắc về buổi học và học phí xin liên hệ hotline 0988.567.890.',
};

// Xoá toàn bộ các lớp mặc định (Admin sẽ tự tạo lớp mới theo thực tế)
export const INITIAL_CLASSES: Classroom[] = [];

// Xoá toàn bộ học sinh mẫu
export const INITIAL_STUDENTS: Student[] = [];

// Xoá các buổi điểm danh mẫu
export const INITIAL_ATTENDANCE_SESSIONS: AttendanceSession[] = [];

// Xoá các đơn học bù mẫu
export const INITIAL_MAKEUP_REQUESTS: MakeupRequest[] = [];

// Xoá các hoá đơn mẫu
export const INITIAL_INVOICES: Invoice[] = [];

// Xoá toàn bộ tài khoản giáo viên mặc định - Chỉ giữ duy nhất tài khoản Quản trị viên (Admin)
// Admin có toàn quyền tạo mới, cấp mật khẩu và xoá tài khoản giáo viên theo ý muốn
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-ADMIN',
    username: 'admin',
    email: 'admin@thaiha.edu.vn',
    fullName: 'Quản Trị Viên (Admin Trung Tâm)',
    phone: '0988.567.890',
    role: 'admin',
    assignedClassIds: [],
    status: 'active',
    password: 'admin',
    createdAt: '2026-08-01T08:00:00Z',
    permissions: {
      canViewTuition: true, // Xem học phí
      canEditTuition: true, // Sửa/tính học phí
      canManageUsers: true, // Quyền cấp và xoá tài khoản giáo viên
      canManageClasses: true,
      canManageStudents: true,
      canMarkAttendance: true,
      canManageMakeup: true,
    },
  },
];
