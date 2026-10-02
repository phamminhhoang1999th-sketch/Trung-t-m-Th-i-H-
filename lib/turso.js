import { createClient } from '@libsql/client';

const url = (typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL) ||
            (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURSO_DATABASE_URL) ||
            '';

const authToken = (typeof process !== 'undefined' && process.env?.TURSO_AUTH_TOKEN) ||
                  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURSO_AUTH_TOKEN) ||
                  '';

export const db = createClient({
  url: url || 'libsql://unconfigured.turso.io',
  authToken: authToken || '',
});

export function isTursoConfigured() {
  return Boolean(url && url.length > 5 && authToken);
}

// Khởi tạo toàn bộ các bảng trong Turso Database
export async function initDB() {
  if (!isTursoConfigured()) {
    console.warn('Turso chưa được cấu hình biến môi trường TURSO_DATABASE_URL và TURSO_AUTH_TOKEN.');
    return;
  }

  // 1. Bảng users (tài khoản)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      raw_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Bảng classes (lớp học)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT,
      subject TEXT,
      grade TEXT,
      teacher TEXT,
      room TEXT,
      schedule TEXT,
      raw_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Bảng students (học sinh)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      full_name TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      raw_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Bảng attendance (điểm danh)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      class_id TEXT,
      date TEXT,
      raw_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Bảng makeup_requests (học bù)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS makeup_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      status TEXT,
      raw_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Bảng invoices (hoá đơn học phí)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      month TEXT,
      status TEXT,
      raw_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Bảng settings (cấu hình trung tâm)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      raw_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
