import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'
import { requireSession, unauthorizedResponse } from '@/lib/session'
import { clientIp } from '@/lib/client-ip'

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (!session) {
    return unauthorizedResponse()
  }
  try {
    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' }, { status: 400 })
    }
    const res = await authService.changePassword(
      session.accessToken,
      newPassword,
      currentPassword,
      request.headers.get('user-agent'),
      clientIp(request),
    )
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  } catch (error) {
    console.error('Change password API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
