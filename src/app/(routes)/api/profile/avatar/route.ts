import { NextRequest, NextResponse } from 'next/server'
import { ProfileService } from '@/services/profile.service'
import { requireSession, refreshSessionCookie, unauthorizedResponse } from '@/lib/session'
import { MAX_AVATAR_SIZE_BYTES, sniffImageMimeType } from '@/lib/image-validation'

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (!session) {
    return unauthorizedResponse()
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: 'file is required' }, { status: 400 })
  }

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
