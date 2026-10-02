import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { db, initDB } from './lib/turso.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// API route matching Turso insert
app.post('/api/users', async (req, res) => {
  try {
    await initDB();
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp cả Tên và Email' });
    }

    await db.execute({
      sql: 'INSERT INTO users (name, email) VALUES (?, ?)',
      args: [name, email],
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
