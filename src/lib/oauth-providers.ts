import type { NextRequest } from 'next/server'
import { appOrigin } from './app-url'

export type OAuthProvider = 'google' | 'github'

export type OAuthProviderConfig = {
    authorizeUrl: string
    tokenUrl: string
    scope: string
    clientId: string
    clientSecret: string
    credential: 'id_token' | 'access_token'
    usePkce: boolean
}

const PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
    google: {
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'openid email profile',
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        credential: 'id_token',
        usePkce: true,
    },
    github: {
        authorizeUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: 'read:user user:email',
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        credential: 'access_token',
        usePkce: true,
    },
}

const ENABLED_PROVIDERS: OAuthProvider[] = ['google']

export function getOAuthProvider(provider: string): OAuthProviderConfig | null {
    if (!isOAuthProvider(provider)) return null
    const config = PROVIDERS[provider]
    if (!config.clientId || !config.clientSecret) return null
    return config
}

export function isOAuthProvider(provider: string): provider is OAuthProvider {
    return (ENABLED_PROVIDERS as string[]).includes(provider)
}

function configuredRedirectUri(provider: OAuthProvider): string {
    const value = provider === 'google' ? process.env.GOOGLE_REDIRECT_URI : process.env.GITHUB_REDIRECT_URI
    return (value || '').trim()
}

export function callbackUrl(provider: string, request?: NextRequest) {
    if (isOAuthProvider(provider)) {
        const configured = configuredRedirectUri(provider)
        if (configured) return configured
    }
    if (request) return new URL(`/api/auth/${provider}/callback`, appOrigin(request)).toString()
    return `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')}/api/auth/${provider}/callback`
}
