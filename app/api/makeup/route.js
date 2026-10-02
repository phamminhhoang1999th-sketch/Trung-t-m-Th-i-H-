import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function POST(request) {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, savedOffline: true });
    await initDB();
    const item = await request.json();

    await db.execute({
      sql: `INSERT INTO makeup_requests (id, student_id, status, raw_json, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              student_id = excluded.student_id,
              status = excluded.status,
              raw_json = excluded.raw_json,
              updated_at = CURRENT_TIMESTAMP`,
      args: [item.id, item.studentId, item.status, JSON.stringify(item)],
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
      sql: 'DELETE FROM makeup_requests WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
