import { NextRequest, NextResponse } from 'next/server'
import { appUrl } from '@/lib/app-url'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8006'
const ALLOWED_PROVIDERS = new Set(['google', 'github'])

function loginFail(request: NextRequest, error: string, message?: string) {
    const base = appUrl(request, '/login')
    base.searchParams.set('error', error)
    if (message) base.searchParams.set('message', message)
    return NextResponse.redirect(base)
}

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
    const { provider } = await context.params
    if (!ALLOWED_PROVIDERS.has(provider)) {
        return loginFail(request, 'OAUTH_PROVIDER_UNSUPPORTED')
    }

    let upstream: Response
    try {
        upstream = await fetch(`${SERVER_URL}/api/auth/${provider}/login`, { redirect: 'manual' })
    } catch {
        return loginFail(request, 'OAUTH_SERVER_UNREACHABLE')
    }

    const location = upstream.headers.get('location')
    if (!location) {
        if (upstream.status === 503) {
            return loginFail(request, 'OAUTH_NOT_CONFIGURED')
        }
        return loginFail(request, 'OAUTH_START_FAILED', `HTTP ${upstream.status}`)
    }

    const response = NextResponse.redirect(location, { status: 302 })
    for (const cookie of upstream.headers.getSetCookie()) {
        response.headers.append('set-cookie', cookie)
    }
    return response
}
