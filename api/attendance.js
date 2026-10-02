import { db, initDB, isTursoConfigured } from '../lib/turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isTursoConfigured()) return res.status(200).json({ success: true, savedOffline: true });
  await initDB();

  if (req.method === 'POST') {
    try {
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
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Lỗi lưu attendance:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Thiếu id' });
      await db.execute({
        sql: 'DELETE FROM attendance WHERE id = ?',
        args: [id],
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
