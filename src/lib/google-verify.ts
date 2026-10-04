import { createPublicKey, type KeyObject, type JsonWebKey } from 'node:crypto'
import jwt from 'jsonwebtoken'

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'] as [string, ...string[]]
const JWKS_TTL_MS = 60 * 60 * 1000

export class GoogleVerificationError extends Error {}

/** The identity facts the API needs, already checked against Google's keys. */
export type VerifiedProfile = {
    provider_uid: string
    email: string
    email_verified: boolean
    display_name: string | null
}

let cache: { expiresAt: number; keys: Record<string, KeyObject> } = { expiresAt: 0, keys: {} }

async function googlePublicKeys(force = false): Promise<Record<string, KeyObject>> {
    if (!force && Object.keys(cache.keys).length > 0 && Date.now() < cache.expiresAt) {
        return cache.keys
    }

    const res = await fetch(GOOGLE_JWKS_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    })
    if (!res.ok) throw new GoogleVerificationError(`ดึงกุญแจของ Google ไม่สำเร็จ (HTTP ${res.status})`)

    const keys: Record<string, KeyObject> = {}
    for (const jwk of (await res.json())?.keys ?? []) {
        if (!jwk?.kid) continue
        try {
            keys[jwk.kid] = createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' })
        } catch {
            // Skip a key we cannot parse rather than failing the whole refresh.
        }
    }
    if (Object.keys(keys).length === 0) {
        throw new GoogleVerificationError('Google ไม่ได้ส่งกุญแจที่ใช้ได้กลับมา')
    }

    cache = { expiresAt: Date.now() + JWKS_TTL_MS, keys }
    return keys
}

/**
 * Checks a Google ID token the way Google's own libraries do: signature against
 * the published JWKS, audience pinned to this app's client ID, issuer pinned to
 * Google, and expiry enforced. All four matter - the audience check is what
 * stops an ID token minted for some other website from being replayed at us.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedProfile> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) throw new GoogleVerificationError('ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID บนเว็บแอป')

    const decoded = jwt.decode(idToken, { complete: true })
    const header = decoded?.header
    if (!header) throw new GoogleVerificationError('รูปแบบ Google ID token ไม่ถูกต้อง')
    if (header.alg !== 'RS256') {
        throw new GoogleVerificationError(`คาดหวังให้ Google เซ็นด้วย RS256 แต่พบ ${String(header.alg)}`)
    }

    let keys = await googlePublicKeys()
    if (!header.kid || !keys[header.kid]) keys = await googlePublicKeys(true)
    const key = header.kid ? keys[header.kid] : undefined
    if (!key) throw new GoogleVerificationError('ไม่พบกุญแจของ Google ที่ใช้เซ็น token')

    let claims: jwt.JwtPayload
    try {
        claims = jwt.verify(idToken, key, {
            algorithms: ['RS256'],
            audience: clientId,
            issuer: GOOGLE_ISSUERS,
        }) as jwt.JwtPayload
    } catch (err) {
        throw new GoogleVerificationError(
            `ยืนยัน Google ID token ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`,
        )
    }

    if (!claims.sub) throw new GoogleVerificationError('บัญชี Google ไม่ได้ส่งรหัสประจำตัวกลับมา')
    if (!claims.email) throw new GoogleVerificationError('บัญชี Google ไม่ได้ส่งที่อยู่อีเมลกลับมา')
    if (!claims.email_verified) throw new GoogleVerificationError('อีเมลของบัญชี Google ยังไม่ได้ยืนยัน')

    return {
        provider_uid: String(claims.sub),
        email: String(claims.email).toLowerCase(),
        email_verified: true,
        display_name: (claims.name as string) ?? (claims.given_name as string) ?? null,
    }
}

type GoogleUserinfo = {
    sub?: string
    email?: string
    email_verified?: boolean
    name?: string
    picture?: string
}

/**
 * Presents the access token to Google and asks who it belongs to - the same
 * shape of check GitHub gets from `api.github.com/user`.
 *
 * The ID token check above proves the token was minted by Google *for this
 * app*; this proves the account is really there right now. `expectedSub` is
 * the ID token's own subject claim, and the two have to agree, so a valid
 * access token for one account cannot be paired with an ID token for another.
 */
export async function fetchGoogleProfile(accessToken: string, expectedSub: string): Promise<VerifiedProfile> {
    if (!accessToken) throw new GoogleVerificationError('Google ไม่ได้ส่ง access token กลับมา')

    let info: GoogleUserinfo
    try {
        const res = await fetch(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
            cache: 'no-store',
        })
        if (res.status === 401 || res.status === 403) {
            throw new GoogleVerificationError(`Google ไม่ยอมรับ access token ที่ส่งมา (HTTP ${res.status})`)
        }
        if (!res.ok) throw new GoogleVerificationError(`Google ตอบกลับผิดพลาด (HTTP ${res.status})`)
        info = (await res.json()) as GoogleUserinfo
    } catch (err) {
        if (err instanceof GoogleVerificationError) throw err
        throw new GoogleVerificationError('ติดต่อ Google ไม่สำเร็จ')
    }

    if (!info.sub) throw new GoogleVerificationError('Google ไม่ได้ส่งรหัสประจำตัวกลับมา')
    if (info.sub !== expectedSub) {
        throw new GoogleVerificationError(
            'access token ไม่ตรงกับบัญชีที่ยืนยันไว้ - อาจมีการปลอมแปลงคำขอ',
        )
    }
    if (!info.email) throw new GoogleVerificationError('บัญชี Google ไม่ได้ส่งที่อยู่อีเมลกลับมา')
    if (!info.email_verified) throw new GoogleVerificationError('อีเมลของบัญชี Google ยังไม่ได้ยืนยัน')

    return {
        provider_uid: info.sub,
        email: info.email.toLowerCase(),
        email_verified: true,
        display_name: info.name ?? null,
    }
}