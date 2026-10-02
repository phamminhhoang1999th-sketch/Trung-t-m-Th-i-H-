import { NextResponse } from 'next/server';
import { db, initDB } from '@/lib/turso';

export async function POST(request) {
  try {
    await initDB(); // Đảm bảo bảng đã được tạo trong Turso
    const { name, email } = await request.json();

    await db.execute({
      sql: 'INSERT INTO users (name, email) VALUES (?, ?)',
      args: [name, email],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
