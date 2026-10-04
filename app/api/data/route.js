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
      db.execute('SELECT id, name, email, phone, raw_json, created_at FROM users ORDER BY created_at DESC'),
    ]);

    const classes = classesRes.rows.map((r) => {
      try { return JSON.parse(r.raw_json); } catch (_) { return null; }
    }).filter(Boolean);

    const students = studentsRes.rows.map((r) => {
      try { return JSON.parse(r.raw_json); } catch (_) { return null; }
    }).filter(Boolean);

    const attendance = attendanceRes.rows.map((r) => {
      try { return JSON.parse(r.raw_json); } catch (_) { return null; }
    }).filter(Boolean);

    const makeupRequests = makeupRes.rows.map((r) => {
      try { return JSON.parse(r.raw_json); } catch (_) { return null; }
    }).filter(Boolean);

    const invoices = invoicesRes.rows.map((r) => {
      try { return JSON.parse(r.raw_json); } catch (_) { return null; }
    }).filter(Boolean);

    const settings = settingsRes.rows.length > 0 && settingsRes.rows[0].raw_json
      ? JSON.parse(settingsRes.rows[0].raw_json)
      : null;

    const users = usersRes.rows.map((r) => {
      try {
        if (r.raw_json) return JSON.parse(r.raw_json);
      } catch (_) {}
      return {
        id: String(r.id),
        fullName: r.name || 'Người dùng',
        username: (r.email ? r.email.split('@')[0] : `user_${String(r.id).slice(-4)}`).toLowerCase(),
        email: r.email || '',
        phone: r.phone || '',
        role: 'teacher',
        assignedClassIds: [],
        status: 'active',
        password: 'password123',
        createdAt: r.created_at || new Date().toISOString(),
        permissions: {
          canViewTuition: false,
          canEditTuition: false,
          canManageUsers: false,
          canManageClasses: false,
          canManageStudents: false,
          canMarkAttendance: true,
          canManageMakeup: true,
        },
      };
    }).filter(Boolean);

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
