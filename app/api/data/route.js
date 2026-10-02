import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function GET() {
  try {
    if (!isTursoConfigured()) {
      return NextResponse.json({ isTursoConnected: false, message: 'Chưa cấu hình Turso trên Vercel' });
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

    return NextResponse.json({
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
    return NextResponse.json({ isTursoConnected: false, error: err.message }, { status: 500 });
  }
}
