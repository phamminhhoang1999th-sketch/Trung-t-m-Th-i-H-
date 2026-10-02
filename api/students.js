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
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const studentId = req.query.id;
      if (!studentId) return res.status(400).json({ error: 'Thiếu studentId' });
      await db.execute({
        sql: 'DELETE FROM students WHERE id = ?',
        args: [studentId],
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
