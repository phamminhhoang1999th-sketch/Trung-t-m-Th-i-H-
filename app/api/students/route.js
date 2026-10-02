import { NextResponse } from 'next/server';
import { db, initDB, isTursoConfigured } from '@/lib/turso';

export async function POST(request) {
  try {
    if (!isTursoConfigured()) return NextResponse.json({ success: true, savedOffline: true });
    await initDB();
    const st = await request.json();

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
      sql: 'DELETE FROM students WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
