import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ProfileService } from '@/services/profile.service'
import { jwtService } from '@/services/jwt.service'

// Mirrors the backend's allowlist (schemas/profile.py) so obviously-invalid
// usernames fail fast here too, instead of relying solely on the backend's
// 422 response. Not a substitute for the backend check - just avoids a
// round-trip for the common case and keeps this proxy from being a looser
// gate than the service it forwards to.
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,50}$/

async function requireSession() {
  const cookie = await cookies()
  const token = cookie.get('access_token')
  if (!token) return null
  const payload = jwtService.verify(token.value)
  if (!payload?.token) return null
  const remainingSeconds = payload.exp ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 60) : 60 * 60 * 24 * 7
  return { accessToken: payload.token as string, remainingSeconds }
}

/** Re-signs the session cookie with fresh user data (after a profile edit) so
 * the Navbar/UI don't keep showing the old username/avatar until next login. */
function refreshSessionCookie(response: NextResponse, accessToken: string, data: RampartUser, remainingSeconds: number) {
  const jwtPayload = jwtService.sign({ token: accessToken, data, type: 'session' }, remainingSeconds)
  response.cookies.set('access_token', jwtPayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: remainingSeconds,
  })
}

export async function GET() {
  const session = await requireSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'No access token found' }, { status: 401 })
  }
  const res = await ProfileService.getProfile(session.accessToken)
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'No access token found' }, { status: 401 })
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
