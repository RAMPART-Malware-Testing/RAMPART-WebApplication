import { authService } from '@/services/auth.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, recaptchaToken } = await request.json()

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return NextResponse.json({ success: false, message: 'กรุณายืนยัน reCAPTCHA' }, { status: 400 })
    }
    const recaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    })
    const recaptchaData = await recaptchaResponse.json()
    if (!recaptchaData.success) {
      return NextResponse.json({ success: false, message: 'reCAPTCHA ไม่ถูกต้อง กรุณาลองใหม่' }, { status: 400 })
    }

    const res = await authService.register({ username, email, password })
    if (!res.success) {
      return NextResponse.json({ success: false, status: res.status, message: res.message || 'ไม่สามารถลงทะเบียนได้' })
    }

    // OTP step — hand back the register token so the verify-otp page posts it.
    return NextResponse.json({ success: true, requireOtp: true, token: res.data?.token })
  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json({ success: false, status: 404, message: 'Internal server error' })
  }
}