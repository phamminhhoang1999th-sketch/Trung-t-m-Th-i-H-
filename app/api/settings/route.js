import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function POST(request) {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, savedOffline: true });
    await initDB();
    const settings = await request.json();

    await db.execute({
      sql: `INSERT INTO settings (id, raw_json, updated_at)
            VALUES ('default', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [JSON.stringify(settings)],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
