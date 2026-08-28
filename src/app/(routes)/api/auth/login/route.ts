import { authService } from '@/services/auth.service';
import { jwtService } from '@/services/jwt.service';
import { NextRequest, NextResponse } from 'next/server'

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
    const { email, password, recaptchaToken } = await request.json()
    const userAgent = request.headers.get("user-agent");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get("deviceToken");
    let device = ""
    if (token) {
      const payload = jwtService.verify(token.value)
      if (payload) device = payload.deviceToken || ""
    } else if (!recaptchaToken) {
      return NextResponse.json({ success: false, require_captcha: true, message: 'กรุณายืนยัน reCAPTCHA' }, { status: 200 })
    }

    const res = await authService.login({ email, password, userAgent, ip, deviceToken: device })

    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    if (!res.data.bypass_otp) {
      return NextResponse.json({ success: true, requireOtp: true, token: res.data.token }, { status: 200 })
    }

    const profile = await fetchProfile(res.data.access_token)
    const wrapped = jwtService.sign(
      { token: res.data.access_token, type: 'session', data: profile || { role: 'user' } },
      '7d'
    )
    const response = NextResponse.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ' }, { status: 200 })
    response.cookies.set('access_token', wrapped, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    if (res.data.device_token) {
      const wrappedDevice = jwtService.sign({ deviceToken: res.data.device_token, type: 'device' }, '7d')
      response.cookies.set('deviceToken', wrappedDevice, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    return response

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}