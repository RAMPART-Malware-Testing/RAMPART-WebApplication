import { jwtService } from '@/services/jwt.service'

export const OAUTH_STATE_COOKIE = 'oauth_state'
export const OAUTH_STATE_TTL_SECONDS = 600

export type OAuthState = {
    state: string
    verifier: string
    provider: string
}

export function signOAuthState(payload: OAuthState) {
    return jwtService.sign(payload, OAUTH_STATE_TTL_SECONDS)
}

export function readOAuthState(token: string | undefined): OAuthState | null {
    if (!token) return null
    const payload = jwtService.verify(token)
    if (!payload || typeof payload.state !== 'string' || typeof payload.provider !== 'string') return null
    return {
        state: payload.state,
        verifier: typeof payload.verifier === 'string' ? payload.verifier : '',
        provider: payload.provider,
    }
}
