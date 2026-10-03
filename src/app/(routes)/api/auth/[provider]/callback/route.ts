import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { appUrl } from '@/lib/app-url'
import { applyOAuthSession } from '@/lib/oauth-session'
import { callbackUrl, getOAuthProvider, isOAuthProvider } from '@/lib/oauth-providers'
import { OAUTH_STATE_COOKIE, readOAuthState } from '@/lib/oauth-state'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8006'

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
    const { provider } = await context.params
    const { searchParams } = request.nextUrl
    const stored = readOAuthState(request.cookies.get(OAUTH_STATE_COOKIE)?.value)

    if (!isOAuthProvider(provider)) {
        return callbackError(request, 'OAUTH_PROVIDER_UNSUPPORTED')
    }

    const providerError = searchParams.get('error')
    if (providerError) {
        return callbackError(request, 'OAUTH_PROVIDER_ERROR', searchParams.get('error_description'))
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state || !stored || stored.state !== state || stored.provider !== provider) {
        return callbackError(request, 'OAUTH_STATE_MISMATCH')
    }

    const config = getOAuthProvider(provider)
    if (!config) {
        return callbackError(request, 'OAUTH_NOT_CONFIGURED')
    }

    const grant = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl(provider),
    })
    if (config.usePkce) grant.set('code_verifier', stored.verifier)

    let tokens: Record<string, string>
    try {
        const res = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
            body: grant,
            cache: 'no-store',
        })
        const payload = await res.json()
        if (!res.ok || payload?.error) {
            return callbackError(request, 'OAUTH_TOKEN_EXCHANGE_FAILED', payload?.error_description || payload?.error)
        }
        tokens = payload
    } catch {
        return callbackError(request, 'OAUTH_SERVER_UNREACHABLE')
    }

    const credential = tokens?.[config.credential]
    if (!credential) {
        return callbackError(request, 'OAUTH_TOKEN_MISSING')
    }

    let exchanged: any
    try {
        const { data } = await axios.post(`${SERVER_URL}/api/auth/${provider}/exchange`, { [config.credential]: credential })
        exchanged = data
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
            return callbackError(request, 'OAUTH_API_OUTDATED')
        }
        return callbackError(request, 'OAUTH_SERVER_UNREACHABLE')
    }

    if (!exchanged?.success || !exchanged?.data?.access_token) {
        return callbackError(request, exchanged?.status || 'OAUTH_CALLBACK_FAILED', exchanged?.message)
    }

    const response = NextResponse.redirect(appUrl(request, '/dashboard'))
    response.cookies.delete(OAUTH_STATE_COOKIE)
    const ok = await applyOAuthSession(response, exchanged.data.access_token, exchanged.data.device_token)
    if (!ok) {
        return callbackError(request, 'OAUTH_SESSION_FAILED')
    }
    return response
}

function callbackError(request: NextRequest, error: string, message?: string | null) {
    const base = appUrl(request, '/login')
    base.searchParams.set('error', error)
    if (message) base.searchParams.set('message', message)
    const response = NextResponse.redirect(base)
    response.cookies.delete(OAUTH_STATE_COOKIE)
    return response
}
