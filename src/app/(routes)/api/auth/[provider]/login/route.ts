import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { appUrl } from '@/lib/app-url'
import { callbackUrl, getOAuthProvider, isOAuthProvider } from '@/lib/oauth-providers'
import { OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS, signOAuthState } from '@/lib/oauth-state'

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
    const { provider } = await context.params
    if (!isOAuthProvider(provider)) {
        return startError(request, 'OAUTH_PROVIDER_UNSUPPORTED')
    }

    const config = getOAuthProvider(provider)
    if (!config) {
        return startError(request, 'OAUTH_NOT_CONFIGURED')
    }

    const state = randomBytes(24).toString('base64url')
    const verifier = config.usePkce ? randomBytes(48).toString('base64url') : ''

    const url = new URL(config.authorizeUrl)
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('redirect_uri', callbackUrl(provider))
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', config.scope)
    url.searchParams.set('state', state)
    if (config.usePkce) {
        url.searchParams.set('code_challenge', createHash('sha256').update(verifier).digest('base64url'))
        url.searchParams.set('code_challenge_method', 'S256')
    }

    const response = NextResponse.redirect(url.toString())
    response.cookies.set(OAUTH_STATE_COOKIE, signOAuthState({ state, verifier, provider }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: OAUTH_STATE_TTL_SECONDS,
    })
    return response
}

function startError(request: NextRequest, error: string) {
    const base = appUrl(request, '/login')
    base.searchParams.set('error', error)
    return NextResponse.redirect(base)
}