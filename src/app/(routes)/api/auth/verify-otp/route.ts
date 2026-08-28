import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service';
import { jwtService } from '@/services/jwt.service';

const OTP_REDIRECT: Record<string, string> = {
  login_confirm: "/dashboard",
  register_confirm: "/login",
  reset_password_confirm: "/login",
};

async function fetchProfile(accessToken: string) {
    try {
        const axios_ = (await import('axios')).default;
        const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8006';
        const { data } = await axios_.post(`${SERVER_URL}/api/profile`, { token: accessToken });
        if (data?.success && data?.data) return data.data;
    } catch {}
    return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, token, content } = body;
    const newPasswd = body.newPasswd;

    if (!otp || !token || !content) {
      return NextResponse.json({ success: false, status: 1400, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    if (!(content in OTP_REDIRECT)) {
      return NextResponse.json({ success: false, message: 'ชนิดการยืนยันไม่ถูกต้อง' });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("User-Agent");

    let result;
    if (content === 'login_confirm') result = await authService.loginConfirm(token, otp, userAgent, ip);
    else if (content === 'register_confirm') result = await authService.registerConfirm(token, otp);
    else result = await authService.resetPasswordConfirm(token, otp, newPasswd);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        status: result.status || 'OTP_EXPIRED',
        message: result.message || 'การยืนยัน OTP ล้มเหลว',
        data: result.data ?? null,
      });
    }

    const response = NextResponse.json(
      { success: true, message: 'ยืนยัน OTP สำเร็จ', redirect: OTP_REDIRECT[content] },
      { status: 200 }
    );

    if (content === 'login_confirm') {
      const profile = await fetchProfile(result.data?.access_token)
      const session = jwtService.sign(
        { token: result.data?.access_token, type: 'session', data: profile || { role: 'user' } },
        '7d'
      )
      response.cookies.set('access_token', session, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })

      const deviceTokenRaw = result.data?.deiveToken
      if (deviceTokenRaw) {
        const wrappedDevice = jwtService.sign({ deviceToken: deviceTokenRaw, type: 'device' }, '7d')
        response.cookies.set('deviceToken', wrappedDevice, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    }

    return response;
  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}