import { db, initDB, isTursoConfigured } from '../lib/turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isTursoConfigured()) {
    return res.status(200).json({ success: true, savedOffline: true });
  }

  await initDB();

  if (req.method === 'POST') {
    try {
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
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const classId = req.query.id;
      if (!classId) return res.status(400).json({ error: 'Thiếu classId' });
      await db.execute({
        sql: 'DELETE FROM classes WHERE id = ?',
        args: [classId],
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
