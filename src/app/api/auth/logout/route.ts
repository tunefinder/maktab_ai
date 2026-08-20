import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/utils/auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: "Tizimdan chiqildi" });
    response.cookies.set({
      name: COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      expires: new Date(0)
    });
    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ error: "Chiqishda xatolik" }, { status: 500 });
  }
}
