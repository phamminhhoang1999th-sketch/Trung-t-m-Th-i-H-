import { db, initDB, isTursoConfigured } from '../lib/turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isTursoConfigured()) return res.status(200).json({ success: true, savedOffline: true });
  await initDB();

  try {
    const {
      classes = [],
      students = [],
      attendance = [],
      makeupRequests = [],
      invoices = [],
      settings,
      users = [],
    } = req.body;
    const queries = [];

    // Classes
    classes.forEach((c) => {
      queries.push({
        sql: `INSERT INTO classes (id, name, subject, grade, teacher, room, schedule, raw_json, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [c.id, c.name, c.subject, c.grade, c.teacher, c.room, c.schedule, JSON.stringify(c)],
      });
    });

    // Students
    students.forEach((s) => {
      queries.push({
        sql: `INSERT INTO students (id, full_name, parent_name, parent_phone, raw_json, updated_at)
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [s.id, s.fullName, s.parentName, s.parentPhone, JSON.stringify(s)],
      });
    });

    // Attendance
    attendance.forEach((a) => {
      queries.push({
        sql: `INSERT INTO attendance (id, class_id, date, raw_json, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [a.id, a.classId, a.date, JSON.stringify(a)],
      });
    });

    // Makeup
    makeupRequests.forEach((m) => {
      queries.push({
        sql: `INSERT INTO makeup_requests (id, student_id, status, raw_json, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [m.id, m.studentId, m.status, JSON.stringify(m)],
      });
    });

    // Invoices
    invoices.forEach((inv) => {
      queries.push({
        sql: `INSERT INTO invoices (id, student_id, month, status, raw_json, updated_at)
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [inv.id, inv.studentId, inv.month, inv.status, JSON.stringify(inv)],
      });
    });

    // Settings
    if (settings) {
      queries.push({
        sql: `INSERT INTO settings (id, raw_json, updated_at)
              VALUES ('default', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [JSON.stringify(settings)],
      });
    }

    // Users (Giáo viên & Quản trị viên)
    users.forEach((u) => {
      queries.push({
        sql: `INSERT INTO users (id, name, email, phone, raw_json, created_at)
              VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                email = excluded.email,
                phone = excluded.phone,
                raw_json = excluded.raw_json`,
        args: [u.id, u.fullName || u.name || '', u.email || '', u.phone || '', JSON.stringify(u)],
      });
    });

    if (queries.length > 0) {
      await db.batch(queries);
    }
    return res.status(200).json({ success: true, count: queries.length });
  } catch (err) {
    console.error('Lỗi sync all:', err);
    return res.status(500).json({ error: err.message });
  }
}
