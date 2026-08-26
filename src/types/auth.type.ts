/** Provider identifiers RAMPART supports for "Sign in with ..." */
type OAuthProvider = "google" | "github"

/** Shape of `data.data` returned by the backend on OAuth login/profile calls. */
interface RampartUser {
    uid: string
    username: string
    email: string
    avatar_url: string | null
    role: "user" | "admin" | "master"
    status: string
    created_at: string | null
}

/** Query params the backend appends when redirecting to /auth/callback. */
interface OAuthCallbackParams {
    access_token?: string
    token_type?: string
    expires_in?: string
    error?: string
    message?: string
}

