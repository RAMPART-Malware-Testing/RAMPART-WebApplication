type OAuthProvider = "google" | "github"

interface RampartUser {
    uid: string
    username: string
    email: string
    avatar_url: string | null
    role: "user" | "admin" | "master"
    status: string
    created_at: string | null
}

interface OAuthCallbackParams {
    access_token?: string
    token_type?: string
    expires_in?: string
    error?: string
    message?: string
}

interface LoginParams {
    email: string
    password: string
    userAgent: string | null
    ip: string | null
    deviceToken: string | null
}

interface RegisterParams {
    username: string
    email: string
    password: string
}

interface ResetPasswordParams {
    email: string
}

