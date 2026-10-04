import { db, initDB, isTursoConfigured } from '../lib/turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isTursoConfigured()) return res.status(200).json({ success: true, savedOffline: true });
  await initDB();

  // POST: Lưu hoặc cập nhật tài khoản giáo viên/quản trị viên
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const id = data.id || `USR-${Date.now().toString().slice(-6)}`;
      const name = data.fullName || data.name || 'Người dùng';
      const email = data.email || '';
      const phone = data.phone || '';

      // Chuẩn hoá đối tượng tài khoản đầy đủ
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

      return res.status(200).json({ success: true, user: userAccount });
    } catch (err) {
      console.error('Lỗi POST /api/users:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE: Xoá tài khoản giáo viên
  if (req.method === 'DELETE') {
    try {
      const userId = req.query.id;
      if (!userId) return res.status(400).json({ error: 'Thiếu userId' });
      if (userId === 'USR-ADMIN') {
        return res.status(400).json({ error: 'Không thể xoá tài khoản Admin quản trị hệ thống' });
      }

      await db.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [userId],
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Lỗi DELETE /api/users:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET: Lấy danh sách tài khoản
  if (req.method === 'GET') {
    try {
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

      return res.status(200).json({ success: true, users });
    } catch (err) {
      console.error('Lỗi GET /api/users:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
