import { db, initDB, isTursoConfigured } from '../lib/turso.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isTursoConfigured()) return res.status(200).json({ success: true, savedOffline: true });
  await initDB();

  if (req.method === 'POST') {
    try {
      const settings = req.body;
      await db.execute({
        sql: `INSERT INTO settings (id, raw_json, updated_at)
              VALUES ('default', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                raw_json = excluded.raw_json,
                updated_at = CURRENT_TIMESTAMP`,
        args: [JSON.stringify(settings)],
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Lỗi lưu settings:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
