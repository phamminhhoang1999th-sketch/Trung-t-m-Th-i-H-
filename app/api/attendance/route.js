import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function POST(request) {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, savedOffline: true });
    await initDB();
    const session = await request.json();

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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
    if (!isTursoConfigured()) return NextResponse.json({ success: true });

    await initDB();
    await db.execute({
      sql: 'DELETE FROM attendance WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
