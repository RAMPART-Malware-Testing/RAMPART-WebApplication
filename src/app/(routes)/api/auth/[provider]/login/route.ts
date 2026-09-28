import { NextRequest, NextResponse } from 'next/server'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8006'
const ALLOWED_PROVIDERS = new Set(['google', 'github'])

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
    const { provider } = await context.params
    if (!ALLOWED_PROVIDERS.has(provider)) {
        return NextResponse.json({ success: false, message: 'Unsupported OAuth provider' }, { status: 404 })
    }

    const upstream = await fetch(`${SERVER_URL}/api/auth/${provider}/login`, { redirect: 'manual' })
    const location = upstream.headers.get('location')
    if (!location) {
        return NextResponse.json({ success: false, message: 'ไม่สามารถเริ่มการเข้าสู่ระบบได้ กรุณาลองใหม่' }, { status: 502 })
    }

    const response = NextResponse.redirect(location, { status: 302 })
    for (const cookie of upstream.headers.getSetCookie()) {
        response.headers.append('set-cookie', cookie)
    }
    return response
}
