import { NextRequest, NextResponse } from 'next/server'
import { ProfileService } from '@/services/profile.service'
import { jwtService } from '@/services/jwt.service'

/**
 * Exchanges the backend's raw OAuth access_token (handed to the browser via
 * the /auth/callback redirect) for this app's own httpOnly session cookie.
 *
 * This has to be a server route because httpOnly cookies can't be set from
 * client-side JS - the /auth/callback page calls this right after it reads
 * access_token out of the URL.
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, expires_in } = await request.json()

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing access_token' },
        { status: 400 }
      )
    }

    const profileRes = await ProfileService.getProfile(access_token)
    if (!profileRes?.success) {
      return NextResponse.json(
        { success: false, message: profileRes?.message || 'Failed to load profile' },
        { status: 401 }
      )
    }

    const maxAge = typeof expires_in === 'number' && expires_in > 0 ? expires_in : 60 * 60 * 24 * 7

    const jwtPayload = jwtService.sign(
      {
        token: access_token,
        data: profileRes.data as RampartUser,
        type: 'session',
      },
      maxAge
    )

    const response = NextResponse.json({ success: true, data: profileRes.data })
    response.cookies.set('access_token', jwtPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    })
    return response
  } catch (error) {
    console.error('Session exchange error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
