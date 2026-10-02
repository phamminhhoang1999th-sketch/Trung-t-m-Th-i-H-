import {
  Classroom,
  Student,
  AttendanceSession,
  MakeupRequest,
  Invoice,
  CenterSettings,
  UserAccount,
} from '../types';
import { Storage } from './storage';

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
}

// Lấy toàn bộ dữ liệu từ Backend / Turso API
export async function fetchAllDataFromAPI(): Promise<{
  classes?: Classroom[];
  students?: Student[];
  attendance?: AttendanceSession[];
  makeupRequests?: MakeupRequest[];
  invoices?: Invoice[];
  settings?: CenterSettings;
  users?: UserAccount[];
  isTursoConnected: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      classes: data.classes,
      students: data.students,
      attendance: data.attendance,
      makeupRequests: data.makeupRequests,
      invoices: data.invoices,
      settings: data.settings,
      users: data.users,
      isTursoConnected: Boolean(data.isTursoConnected),
    };
  } catch (err: any) {
    console.warn('Không thể tải từ /api/data, sử dụng dữ liệu cục bộ:', err.message);
    return {
      classes: Storage.getClasses(),
      students: Storage.getStudents(),
      attendance: Storage.getAttendance(),
      makeupRequests: Storage.getMakeupRequests(),
      invoices: Storage.getInvoices(),
      settings: Storage.getSettings(),
      users: Storage.getUsers(),
      isTursoConnected: false,
      error: err.message,
    };
  }
}

// Lưu lớp học lên Turso API
export async function syncSaveClass(classroom: Classroom): Promise<boolean> {
  try {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classroom),
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi sync class lên Turso:', e);
    return false;
  }
}

// Xoá lớp học khỏi Turso API
export async function syncDeleteClass(classId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/classes?id=${encodeURIComponent(classId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi xoá class trên Turso:', e);
    return false;
  }
}

// Lưu học sinh lên Turso API
export async function syncSaveStudent(student: Student): Promise<boolean> {
  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi sync student lên Turso:', e);
    return false;
  }
}

// Xoá học sinh khỏi Turso API
export async function syncDeleteStudent(studentId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/students?id=${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi xoá student trên Turso:', e);
    return false;
  }
}

// Lưu buổi điểm danh lên Turso API
export async function syncSaveAttendance(session: AttendanceSession): Promise<boolean> {
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi sync attendance lên Turso:', e);
    return false;
  }
}

// Lưu yêu cầu học bù lên Turso API
export async function syncSaveMakeup(req: MakeupRequest): Promise<boolean> {
  try {
    const res = await fetch('/api/makeup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi sync makeup lên Turso:', e);
    return false;
  }
}

// Lưu hoá đơn lên Turso API
export async function syncSaveInvoice(invoice: Invoice): Promise<boolean> {
  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi sync invoice lên Turso:', e);
    return false;
  }
}

// Xoá hoá đơn trên Turso API
export async function syncDeleteInvoice(invoiceId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi xoá invoice trên Turso:', e);
    return false;
  }
}

// Lưu cấu hình trung tâm
export async function syncSaveSettings(settings: CenterSettings): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi sync settings lên Turso:', e);
    return false;
  }
}

// Đồng bộ hàng loạt toàn bộ dữ liệu (Sync All)
export async function syncAllData(data: {
  classes: Classroom[];
  students: Student[];
  attendance: AttendanceSession[];
  makeupRequests: MakeupRequest[];
  invoices: Invoice[];
  settings: CenterSettings;
  users: UserAccount[];
}): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.error('Lỗi sync all data:', e);
    return false;
  }
}
