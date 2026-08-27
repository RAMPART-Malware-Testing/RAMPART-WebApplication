import { NextRequest, NextResponse } from 'next/server'
import { ProfileService } from '@/services/profile.service'
import { requireSession, refreshSessionCookie, unauthorizedResponse } from '@/lib/session'

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,50}$/

export async function GET() {
  const session = await requireSession()
  if (!session) {
    return unauthorizedResponse()
  }
  const res = await ProfileService.getProfile(session.accessToken)
  const response = NextResponse.json(res, { status: res.success ? 200 : 400 })
  if (res.success && res.data) {
    refreshSessionCookie(response, session.accessToken, res.data as RampartUser, session.remainingSeconds)
  }
  return response
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession()
  if (!session) {
    return unauthorizedResponse()
  }
  const { username } = await request.json()
  if (!username || typeof username !== 'string') {
    return NextResponse.json({ success: false, message: 'username is required' }, { status: 400 })
  }
  const trimmed = username.trim()
  if (!USERNAME_RE.test(trimmed)) {
    return NextResponse.json(
      {
        success: false,
        message: "Username must be 3-50 characters and may only contain letters, numbers, '.', '_' and '-'",
      },
      { status: 400 },
    )
  }
  const res = await ProfileService.updateUsername(session.accessToken, trimmed)
  const response = NextResponse.json(res, { status: res.success ? 200 : 400 })
  if (res.success && res.data) {
    refreshSessionCookie(response, session.accessToken, res.data as RampartUser, session.remainingSeconds)
  }
  return response
}
