import type { VerifiedProfile } from './google-verify'

export class GithubProfileError extends Error {}

const API = 'https://api.github.com'

function authHeaders(accessToken: string) {
    return {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'RAMPART-Web',
    }
}

type GithubEmail = { email: string; primary?: boolean; verified?: boolean }

/**
 * Asks GitHub who the access token belongs to. GitHub issues opaque tokens
 * rather than signed ones, so the only way to learn the identity behind one is
 * to present it - which is why this happens here and not in the API.
 */
export async function fetchGithubProfile(accessToken: string): Promise<VerifiedProfile> {
    const headers = authHeaders(accessToken)

    let profile: Record<string, unknown>
    try {
        const res = await fetch(`${API}/user`, { headers, cache: 'no-store' })
        if (res.status === 401 || res.status === 403) {
            throw new GithubProfileError('GitHub ไม่ยอมรับ access token ที่ส่งมา')
        }
        if (!res.ok) throw new GithubProfileError(`GitHub ตอบกลับผิดพลาด (HTTP ${res.status})`)
        profile = (await res.json()) as Record<string, unknown>
    } catch (err) {
        if (err instanceof GithubProfileError) throw err
        throw new GithubProfileError('ติดต่อ GitHub ไม่สำเร็จ')
    }

    if (!profile.id) throw new GithubProfileError('บัญชี GitHub ไม่ได้ส่งข้อมูลผู้ใช้กลับมา')

    let email = typeof profile.email === 'string' ? profile.email : ''
    let emailVerified = email.length > 0

    if (!email) {
        const res = await fetch(`${API}/user/emails`, { headers, cache: 'no-store' })
        if (!res.ok) throw new GithubProfileError('อ่านรายชื่ออีเมลของบัญชี GitHub ไม่สำเร็จ')

        const emails = (await res.json()) as GithubEmail[]
        const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified)
        if (!primary) throw new GithubProfileError('บัญชี GitHub ไม่มีอีเมลที่ยืนยันแล้ว')
        email = primary.email
        emailVerified = true
    }

    const displayName = typeof profile.name === 'string' && profile.name ? profile.name : null

    return {
        provider_uid: String(profile.id),
        email: email.toLowerCase(),
        email_verified: emailVerified,
        display_name: displayName ?? (typeof profile.login === 'string' ? profile.login : null),
    }
}