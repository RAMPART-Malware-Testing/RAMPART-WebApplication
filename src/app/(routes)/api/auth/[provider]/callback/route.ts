import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { appUrl } from '@/lib/app-url'
import { applyOAuthSession } from '@/lib/oauth-session'
import { callbackUrl, getOAuthProvider, isOAuthProvider } from '@/lib/oauth-providers'
import { OAUTH_STATE_COOKIE, readOAuthState } from '@/lib/oauth-state'
import { signBridgeToken, type BridgeIdentity } from '@/lib/bridge-token'
import { fetchGithubProfile } from '@/lib/github-profile'
import { fetchGoogleProfile, verifyGoogleIdToken } from '@/lib/google-verify'

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

    // This is where the provider credential stops being trusted-but-unverified.
    // Both providers are asked "who is this and what is their e-mail" from the
    // web app, never from the API, and only once that succeeds do we know
    // anything about the user.
    //
    // Google gets two independent answers that must agree: the ID token proves
    // the credential was minted for *this* app, and a live call to Google's
    // userinfo endpoint proves the account exists right now. GitHub issues
    // opaque tokens, so asking GitHub is the only way.
    let identity: BridgeIdentity
    try {
        if (provider === 'google') {
            const claims = await verifyGoogleIdToken(tokens.id_token)
            // The ID token is a signed statement, not a credential to spend on
            // an API - userinfo needs the access token from the same grant.
            const profile = await fetchGoogleProfile(tokens.access_token, claims.provider_uid)
            identity = { provider: 'google', ...profile }
        } else {
            identity = { provider: 'github', ...(await fetchGithubProfile(credential)) }
        }
    } catch (err) {
        return callbackError(request, 'OAUTH_PROVIDER_ERROR', err instanceof Error ? err.message : String(err))
    }

    // Both providers' answers are now facts, so state them to the API as a
    // token it can check on its own - one shared secret, no provider involved.
    let bridgeToken: string
    try {
        bridgeToken = signBridgeToken(identity)
    } catch (err) {
        return callbackError(request, 'OAUTH_NOT_CONFIGURED', err instanceof Error ? err.message : undefined)
    }

    // The API sees only this: a short-lived token it can verify on its own.
    // No Google client ID, no redirect URI, no provider token crosses over.
    let exchanged: any
    try {
        const { data } = await axios.post(`${SERVER_URL}/api/auth/${provider}/bridge`, {
            bridge_token: bridgeToken,
        })
        exchanged = data
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
            return callbackError(request, 'OAUTH_API_OUTDATED')
        }
        return callbackError(request, 'OAUTH_SERVER_UNREACHABLE')
    }

    if (!exchanged?.success || !exchanged?.data?.access_token || !exchanged?.data?.data) {
        return callbackError(request, exchanged?.status || 'OAUTH_CALLBACK_FAILED', exchanged?.message)
    }

    const response = NextResponse.redirect(appUrl(request, '/dashboard'))
    response.cookies.delete(OAUTH_STATE_COOKIE)
    const ok = applyOAuthSession(
        response,
        exchanged.data.access_token,
        exchanged.data.data,
        exchanged.data.device_token,
    )
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
