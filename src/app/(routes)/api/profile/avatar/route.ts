import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ProfileService } from '@/services/profile.service'
import { jwtService } from '@/services/jwt.service'

async function requireSession() {
  const cookie = await cookies()
  const token = cookie.get('access_token')
  if (!token) return null
  const payload = jwtService.verify(token.value)
  if (!payload?.token) return null
  const remainingSeconds = payload.exp ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 60) : 60 * 60 * 24 * 7
  return { accessToken: payload.token as string, remainingSeconds }
}

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

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (!session) {
    return NextResponse.json({ success: false, message: 'No access token found' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: 'file is required' }, { status: 400 })
  }

  const res = await ProfileService.uploadAvatar(session.accessToken, file)
  const response = NextResponse.json(res, { status: res.success ? 200 : 400 })
  if (res.success && res.data) {
    refreshSessionCookie(response, session.accessToken, res.data as RampartUser, session.remainingSeconds)
  }
  return response
}
