import { db, initDB, isTursoConfigured } from '../lib/turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isTursoConfigured()) return res.status(200).json({ success: true, savedOffline: true });
  await initDB();

  try {
    const { classes = [], students = [], settings } = req.body;
    const queries = [];

    classes.forEach((c) => {
      queries.push({
        sql: `INSERT INTO classes (id, name, subject, grade, teacher, room, schedule, raw_json, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET raw_json = excluded.raw_json, updated_at = CURRENT_TIMESTAMP`,
        args: [c.id, c.name, c.subject, c.grade, c.teacher, c.room, c.schedule, JSON.stringify(c)],
      });
    });

    students.forEach((s) => {
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
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
