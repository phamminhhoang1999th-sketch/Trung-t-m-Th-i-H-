import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function POST(request) {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, savedOffline: true });
    await initDB();

    const data = await request.json();
    const id = data.id || `USR-${Date.now().toString().slice(-6)}`;
    const name = data.fullName || data.name || 'Người dùng';
    const email = data.email || '';
    const phone = data.phone || '';

    const userAccount = {
      id,
      fullName: name,
      username: data.username || (email ? email.split('@')[0] : `user_${id.slice(-4)}`).toLowerCase(),
      email,
      phone,
      role: data.role || 'teacher',
      assignedClassIds: data.assignedClassIds || [],
      status: data.status || 'active',
      password: data.password || '123456',
      createdAt: data.createdAt || new Date().toISOString(),
      permissions: data.permissions || {
        canViewTuition: data.role === 'admin' || data.role === 'manager',
        canEditTuition: data.role === 'admin' || data.role === 'manager',
        canManageUsers: data.role === 'admin',
        canManageClasses: data.role === 'admin',
        canManageStudents: data.role === 'admin',
        canMarkAttendance: true,
        canManageMakeup: true,
      },
    };

    await db.execute({
      sql: `INSERT INTO users (id, name, email, phone, raw_json, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              email = excluded.email,
              phone = excluded.phone,
              raw_json = excluded.raw_json`,
      args: [id, name, email, phone, JSON.stringify(userAccount)],
    });

    return NextResponse.json({ success: true, user: userAccount });
  } catch (error) {
    console.error('Lỗi POST Next.js /api/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    if (userId === 'USR-ADMIN') {
      return NextResponse.json({ error: 'Không thể xoá tài khoản Admin quản trị' }, { status: 400 });
    }
    if (!isTursoConfigured()) return NextResponse.json({ success: true });

    await initDB();
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [userId],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, users: [] });
    await initDB();

    const result = await db.execute('SELECT id, name, email, phone, raw_json, created_at FROM users ORDER BY created_at DESC');
    const users = result.rows.map((r) => {
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
    });

    return NextResponse.json({ success: true, users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
