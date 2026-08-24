import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ProfileService } from '@/services/profile.service'
import { jwtService } from '@/services/jwt.service'
import { MAX_AVATAR_SIZE_BYTES, sniffImageMimeType } from '@/lib/image-validation'

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

  // This route is a real, independently-reachable HTTP endpoint (anyone
  // with a valid session cookie can POST to it directly, not just the
  // profile page's own UI) - so it must not trust the client any more
  // than the backend does. The backend re-validates from scratch as the
  // actual security boundary (full decode + re-encode with Pillow); these
  // checks exist so obviously-bad uploads fail fast, close to the caller,
  // without ever leaving this process, and so a compromised/absent
  // frontend check can't silently downgrade the app's posture.
  if (file.size <= 0) {
    return NextResponse.json({ success: false, message: 'Uploaded file is empty.' }, { status: 400 })
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, message: 'Avatar image exceeds the 5MB limit.' },
      { status: 413 },
    )
  }
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!sniffImageMimeType(header)) {
    return NextResponse.json(
      { success: false, message: 'Unsupported image type. Allowed: PNG, JPEG, WEBP.' },
      { status: 400 },
    )
  }

  const res = await ProfileService.uploadAvatar(session.accessToken, file)
  const response = NextResponse.json(res, { status: res.success ? 200 : 400 })
  if (res.success && res.data) {
    refreshSessionCookie(response, session.accessToken, res.data as RampartUser, session.remainingSeconds)
  }
  return response
}
