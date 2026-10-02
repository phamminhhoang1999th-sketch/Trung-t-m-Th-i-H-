import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { db, initDB, isTursoConfigured } from './lib/turso.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// 1. GET /api/data - Lấy toàn bộ dữ liệu từ Turso
app.get('/api/data', async (_req, res) => {
  try {
    if (!isTursoConfigured()) {
      return res.json({ isTursoConnected: false, message: 'Chưa cấu hình Turso credentials' });
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

    const classes = classesRes.rows.map((r: any) => JSON.parse(r.raw_json as string));
    const students = studentsRes.rows.map((r: any) => JSON.parse(r.raw_json as string));
    const attendance = attendanceRes.rows.map((r: any) => JSON.parse(r.raw_json as string));
    const makeupRequests = makeupRes.rows.map((r: any) => JSON.parse(r.raw_json as string));
    const invoices = invoicesRes.rows.map((r: any) => JSON.parse(r.raw_json as string));
    const settings = settingsRes.rows.length > 0 ? JSON.parse(settingsRes.rows[0].raw_json as string) : null;
    const users = usersRes.rows.map((r: any) => JSON.parse(r.raw_json as string));

    return res.json({
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
  } catch (error: any) {
    console.error('Lỗi GET /api/data từ Turso:', error);
    return res.status(500).json({ isTursoConnected: false, error: error.message });
  }
});

// 2. Lớp học (Classes)
app.post('/api/classes', async (req, res) => {
  try {
    if (!isTursoConfigured()) {
      return res.json({ success: true, savedOffline: true });
    }
    await initDB();
    const cls = req.body;
    await db.execute({
      sql: `INSERT INTO classes (id, name, subject, grade, teacher, room, schedule, raw_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              subject = excluded.subject,
              grade = excluded.grade,
              teacher = excluded.teacher,
              room = excluded.room,
              schedule = excluded.schedule,
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [
        cls.id,
        cls.name || '',
        cls.subject || '',
        cls.grade || '',
        cls.teacher || '',
        cls.room || '',
        cls.schedule || '',
        JSON.stringify(cls),
      ],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi POST /api/classes:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/classes', async (req, res) => {
  try {
    const classId = req.query.id as string;
    if (!classId) return res.status(400).json({ error: 'Thiếu classId' });
    if (!isTursoConfigured()) return res.json({ success: true });

    await initDB();
    await db.execute({
      sql: 'DELETE FROM classes WHERE id = ?',
      args: [classId],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi DELETE /api/classes:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Học sinh (Students)
app.post('/api/students', async (req, res) => {
  try {
    if (!isTursoConfigured()) {
      return res.json({ success: true, savedOffline: true });
    }
    await initDB();
    const st = req.body;
    await db.execute({
      sql: `INSERT INTO students (id, full_name, parent_name, parent_phone, custom_fee, raw_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              full_name = excluded.full_name,
              parent_name = excluded.parent_name,
              parent_phone = excluded.parent_phone,
              custom_fee = excluded.custom_fee,
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [
        st.id,
        st.fullName || '',
        st.parentName || '',
        st.parentPhone || '',
        st.customFeePerSession || null,
        JSON.stringify(st),
      ],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi POST /api/students:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/students', async (req, res) => {
  try {
    const studentId = req.query.id as string;
    if (!studentId) return res.status(400).json({ error: 'Thiếu studentId' });
    if (!isTursoConfigured()) return res.json({ success: true });

    await initDB();
    await db.execute({
      sql: 'DELETE FROM students WHERE id = ?',
      args: [studentId],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi DELETE /api/students:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. Điểm danh (Attendance)
app.post('/api/attendance', async (req, res) => {
  try {
    if (!isTursoConfigured()) return res.json({ success: true });
    await initDB();
    const session = req.body;
    await db.execute({
      sql: `INSERT INTO attendance (id, class_id, date, raw_json, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              class_id = excluded.class_id,
              date = excluded.date,
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [session.id, session.classId, session.date, JSON.stringify(session)],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi POST /api/attendance:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 5. Học bù (Makeup)
app.post('/api/makeup', async (req, res) => {
  try {
    if (!isTursoConfigured()) return res.json({ success: true });
    await initDB();
    const reqData = req.body;
    await db.execute({
      sql: `INSERT INTO makeup_requests (id, student_id, status, raw_json, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              student_id = excluded.student_id,
              status = excluded.status,
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [reqData.id, reqData.studentId, reqData.status, JSON.stringify(reqData)],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi POST /api/makeup:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 6. Hoá đơn (Invoices)
app.post('/api/invoices', async (req, res) => {
  try {
    if (!isTursoConfigured()) return res.json({ success: true });
    await initDB();
    const inv = req.body;
    await db.execute({
      sql: `INSERT INTO invoices (id, student_id, month, status, raw_json, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              student_id = excluded.student_id,
              month = excluded.month,
              status = excluded.status,
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [inv.id, inv.studentId, inv.month, inv.status, JSON.stringify(inv)],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi POST /api/invoices:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/invoices', async (req, res) => {
  try {
    const invId = req.query.id as string;
    if (!invId) return res.status(400).json({ error: 'Thiếu invId' });
    if (!isTursoConfigured()) return res.json({ success: true });

    await initDB();
    await db.execute({ sql: 'DELETE FROM invoices WHERE id = ?', args: [invId] });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 7. Cài đặt trung tâm (Settings)
app.post('/api/settings', async (req, res) => {
  try {
    if (!isTursoConfigured()) return res.json({ success: true });
    await initDB();
    const settings = req.body;
    await db.execute({
      sql: `INSERT INTO settings (id, raw_json, updated_at)
            VALUES ('default', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [JSON.stringify(settings)],
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 8. Đồng bộ toàn bộ (Sync All)
app.post('/api/sync', async (req, res) => {
  try {
    if (!isTursoConfigured()) return res.json({ success: true, savedOffline: true });
    await initDB();
    const { classes = [], students = [], attendance = [], makeupRequests = [], invoices = [], settings, users = [] } = req.body;

    const queries: any[] = [];

    classes.forEach((c: any) => {
      queries.push({
        sql: `INSERT INTO classes (id, name, subject, grade, teacher, room, schedule, raw_json, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [c.id, c.name, c.subject, c.grade, c.teacher, c.room, c.schedule, JSON.stringify(c)],
      });
    });

    students.forEach((s: any) => {
      queries.push({
        sql: `INSERT INTO students (id, full_name, parent_name, parent_phone, custom_fee, raw_json, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [s.id, s.fullName, s.parentName, s.parentPhone, s.customFeePerSession || null, JSON.stringify(s)],
      });
    });

    if (settings) {
      queries.push({
        sql: `INSERT INTO settings (id, raw_json, updated_at)
              VALUES ('default', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [JSON.stringify(settings)],
      });
    }

    if (queries.length > 0) {
      await db.batch(queries);
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi POST /api/sync:', error);
    return res.status(500).json({ error: error.message });
  }
});

// API route users
app.post('/api/users', async (req, res) => {
  try {
    await initDB();
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp cả Tên và Email' });
    }
    const id = `USR-${Date.now()}`;
    await db.execute({
      sql: 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
      args: [id, name, email],
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error saving user to Turso:', error);
    return res.status(500).json({ error: error.message || 'Lỗi kết nối cơ sở dữ liệu Turso' });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    await initDB();
    const result = await db.execute('SELECT * FROM users ORDER BY created_at DESC');
    return res.json({ success: true, users: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
