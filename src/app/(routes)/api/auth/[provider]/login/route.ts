import { NextRequest, NextResponse } from 'next/server'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8006'
const ALLOWED_PROVIDERS = new Set(['google', 'github'])

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
    const { provider } = await context.params
    if (!ALLOWED_PROVIDERS.has(provider)) {
        return NextResponse.json({ success: false, message: 'Unsupported OAuth provider' }, { status: 404 })
    }
    return NextResponse.redirect(`${SERVER_URL}/api/auth/${provider}/login`, { status: 302 })
}
