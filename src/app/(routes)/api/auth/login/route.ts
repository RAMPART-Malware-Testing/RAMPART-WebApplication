import { authService } from '@/services/auth.service';
import { jwtService } from '@/services/jwt.service';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, recaptchaToken } = await request.json()
    const userAgent = request.headers.get("user-agent");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    const cookie = await cookies();
    const token = cookie.get("deviceToken");
    let device = ""

    if (!token) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { success: false, require_captcha: true, message: 'กรุณายืนยัน reCAPTCHA' },
          { status: 200 }
        )
      }

      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        }
      )

      const recaptchaData = await recaptchaResponse.json()
      if (!recaptchaData.success) {
        return NextResponse.json(
          { success: false, require_captcha: true, message: 'reCAPTCHA ไม่ถูกต้อง กรุณาลองใหม่' },
          { status: 200 }
        )
      }

    } else {
      const payload = jwtService.verify(token.value)
      if (payload) {
        device = payload.deviceToken
      }
    }

    const res = await authService.login({ email, password, userAgent, ip, deviceToken: device })

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    const response = NextResponse.json(
      { success: true, message: 'เข้าสู่ระบบสำเร็จ' },
      { status: 200 }
    )

    if (res.data.bypass_otp) {
      const jwtPayload = await jwtService.sign({
        token: res.data.access_token,
        data: res.data.data,
        type: "login_success",
      })
      response.cookies.set("access_token", jwtPayload, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
      return response
    }

    const jwtPayload = await jwtService.sign({
      token: res.data.token,
      type: "login_confirm",
    })
    response.cookies.set("access_token", jwtPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    })
    return response

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}