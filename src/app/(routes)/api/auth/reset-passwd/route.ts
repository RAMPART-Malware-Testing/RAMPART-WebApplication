import { authService } from '@/services/auth.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const res = await authService.resetPassword({ email })

    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message || 'ไม่พบผู้ใช้งานระบบ' })
    }

    return NextResponse.json({ success: true, requireOtp: true, token: res.data?.token, message: res.message })
  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' })
  }
}