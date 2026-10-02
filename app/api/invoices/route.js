import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function POST(request) {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, savedOffline: true });
    await initDB();
    const inv = await request.json();

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
      sql: 'DELETE FROM invoices WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
