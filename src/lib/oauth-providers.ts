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

export function getOAuthProvider(provider: string): OAuthProviderConfig | null {
    if (provider !== 'google' && provider !== 'github') return null
    const config = PROVIDERS[provider]
    if (!config.clientId || !config.clientSecret) return null
    return config
}

export function isOAuthProvider(provider: string): provider is OAuthProvider {
    return provider === 'google' || provider === 'github'
}

export function callbackUrl(provider: string) {
    return `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')}/api/auth/${provider}/callback`
}
