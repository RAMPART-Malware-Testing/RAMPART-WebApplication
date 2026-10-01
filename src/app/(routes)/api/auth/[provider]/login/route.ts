import { NextRequest, NextResponse } from 'next/server'
import { appUrl } from '@/lib/app-url'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8006'
const ALLOWED_PROVIDERS = new Set(['google', 'github'])

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
    const { provider } = await context.params
    if (!ALLOWED_PROVIDERS.has(provider)) {
        const base = appUrl(request, '/login')
        base.searchParams.set('error', 'OAUTH_PROVIDER_UNSUPPORTED')
        return NextResponse.redirect(base)
    }

    return NextResponse.redirect(`${SERVER_URL}/api/auth/${provider}/login`)
}
