import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function POST(request) {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, savedOffline: true });
    await initDB();
    const cls = await request.json();

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
      sql: 'DELETE FROM classes WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
