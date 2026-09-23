import { authService } from '@/services/auth.service'
import { clientIp } from '@/lib/client-ip'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const res = await authService.resetPassword({
      email,
      userAgent: request.headers.get('user-agent'),
      ip: clientIp(request),
    })

    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message || 'ไม่สามารถส่งรหัส OTP ได้ กรุณาลองอีกครั้งภายหลัง' })
    }

    return NextResponse.json({ success: true, requireOtp: true, token: res.data?.token, message: res.message })
  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' })
  }
}