import { db, initDB, isTursoConfigured } from '../lib/turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!isTursoConfigured()) {
      return res.status(200).json({ isTursoConnected: false, message: 'Chưa cấu hình Turso trên Vercel' });
    }

    await initDB();

    const [classesRes, studentsRes, attendanceRes, makeupRes, invoicesRes, settingsRes, usersRes] = await Promise.all([
      db.execute('SELECT raw_json FROM classes ORDER BY updated_at DESC'),
      db.execute('SELECT raw_json FROM students ORDER BY updated_at DESC'),
      db.execute('SELECT raw_json FROM attendance ORDER BY updated_at DESC'),
      db.execute('SELECT raw_json FROM makeup_requests ORDER BY updated_at DESC'),
      db.execute('SELECT raw_json FROM invoices ORDER BY updated_at DESC'),
      db.execute('SELECT raw_json FROM settings LIMIT 1'),
      db.execute('SELECT raw_json FROM users ORDER BY created_at DESC'),
    ]);

    const classes = classesRes.rows.map((r) => JSON.parse(r.raw_json));
    const students = studentsRes.rows.map((r) => JSON.parse(r.raw_json));
    const attendance = attendanceRes.rows.map((r) => JSON.parse(r.raw_json));
    const makeupRequests = makeupRes.rows.map((r) => JSON.parse(r.raw_json));
    const invoices = invoicesRes.rows.map((r) => JSON.parse(r.raw_json));
    const settings = settingsRes.rows.length > 0 ? JSON.parse(settingsRes.rows[0].raw_json) : null;
    const users = usersRes.rows.map((r) => JSON.parse(r.raw_json));

    return res.status(200).json({
      success: true,
      isTursoConnected: true,
      classes,
      students,
      attendance,
      makeupRequests,
      invoices,
      settings,
      users,
    });
  } catch (err) {
    console.error('Lỗi Vercel API /api/data:', err);
    return res.status(500).json({ isTursoConnected: false, error: err.message });
  }
}
