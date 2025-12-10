import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe, recaptchaToken } = await request.json()

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      }
    )

    const recaptchaData = await recaptchaResponse.json()

    if (!recaptchaData.success) {
      return NextResponse.json(
        { message: 'reCAPTCHA verification failed' },
        { status: 400 }
      )
    }

    if (email === 'a@a.com' && password === '123456') {
      // Login สำเร็จ
      return NextResponse.json(
        { message: 'Login successful' },
        { status: 200 }
      )
    } else {
      // Login ล้มเหลว
      return NextResponse.json(
        { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}