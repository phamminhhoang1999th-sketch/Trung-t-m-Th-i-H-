import {
  Classroom,
  Student,
  AttendanceSession,
  MakeupRequest,
  Invoice,
  CenterSettings,
  UserAccount,
} from '../types';
import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_MAKEUP_REQUESTS,
  INITIAL_INVOICES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
} from '../data/mockData';

const STORAGE_KEYS = {
  CLASSES: 'thaiha_classes_v2',
  STUDENTS: 'thaiha_students_v2',
  ATTENDANCE: 'thaiha_attendance_v2',
  MAKEUP: 'thaiha_makeup_v2',
  INVOICES: 'thaiha_invoices_v2',
  SETTINGS: 'thaiha_settings_v2',
  USERS: 'thaiha_users_v2',
  CURRENT_USER: 'thaiha_current_user_v2',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Failed to read ${key} from storage:`, e);
    return fallback;
  }
}

function setItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export const Storage = {
  getClasses(): Classroom[] {
    return getItem<Classroom[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },
  saveClasses(classes: Classroom[]) {
    setItem(STORAGE_KEYS.CLASSES, classes);
  },

  getStudents(): Student[] {
    return getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },
  saveStudents(students: Student[]) {
    setItem(STORAGE_KEYS.STUDENTS, students);
  },

  getAttendance(): AttendanceSession[] {
    return getItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_SESSIONS);
  },
  saveAttendance(attendance: AttendanceSession[]) {
    setItem(STORAGE_KEYS.ATTENDANCE, attendance);
  },

  getMakeupRequests(): MakeupRequest[] {
    return getItem<MakeupRequest[]>(STORAGE_KEYS.MAKEUP, INITIAL_MAKEUP_REQUESTS);
  },
  saveMakeupRequests(requests: MakeupRequest[]) {
    setItem(STORAGE_KEYS.MAKEUP, requests);
  },

  getInvoices(): Invoice[] {
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },
  saveInvoices(invoices: Invoice[]) {
    setItem(STORAGE_KEYS.INVOICES, invoices);
  },

  getSettings(): CenterSettings {
    return getItem<CenterSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: CenterSettings) {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  },

  getUsers(): UserAccount[] {
    return getItem<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  saveUsers(users: UserAccount[]) {
    setItem(STORAGE_KEYS.USERS, users);
  },

  getCurrentUser(): UserAccount | null {
    return getItem<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user: UserAccount | null) {
    if (user) {
      setItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } catch (e) {
        console.error(e);
      }
    }
  },

  resetToDefault() {
    setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_SESSIONS);
    setItem(STORAGE_KEYS.MAKEUP, INITIAL_MAKEUP_REQUESTS);
    setItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },

  exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      classes: this.getClasses(),
      students: this.getStudents(),
      attendance: this.getAttendance(),
      makeupRequests: this.getMakeupRequests(),
      invoices: this.getInvoices(),
      settings: this.getSettings(),
      users: this.getUsers(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.classes) this.saveClasses(data.classes);
      if (data.students) this.saveStudents(data.students);
      if (data.attendance) this.saveAttendance(data.attendance);
      if (data.makeupRequests) this.saveMakeupRequests(data.makeupRequests);
      if (data.invoices) this.saveInvoices(data.invoices);
      if (data.settings) this.saveSettings(data.settings);
      if (data.users) this.saveUsers(data.users);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },
};
