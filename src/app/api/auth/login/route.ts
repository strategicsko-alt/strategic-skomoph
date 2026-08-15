import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.EDITOR_PASSWORD || 'strategicsko00017';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'admin_strategicsko00017';

    if (password === correctPassword || password === superadminPassword) {
      // Create response and set cookie
      const response = NextResponse.json({ success: true }, { status: 200 });
      
      const authValue = password === superadminPassword ? 'superadmin' : 'authenticated';
      
      response.cookies.set({
        name: 'editor_auth',
        value: authValue,
        httpOnly: false,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return response;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
  }
}
