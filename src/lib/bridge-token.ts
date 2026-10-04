import jwt from 'jsonwebtoken'

const BRIDGE_TYPE = 'oauth_bridge'

/**
 * Deliberately short. The bridge token only has to survive one hop to the API
 * and be turned into a session there immediately - it is not a login
 * credential, so a leaked copy is worthless within minutes.
 */
const BRIDGE_TTL_SECONDS = 120

export type BridgeProvider = 'google' | 'github'

export type BridgeIdentity = {
    provider: BridgeProvider
    provider_uid: string
    email: string
    email_verified: boolean
    display_name: string | null
}

/**
 * States an already-verified identity to the API in a form the API can check
 * on its own, so it never needs a Google client ID or a provider token.
 *
 * The signature is the whole trust boundary: OAUTH_BRIDGE_SECRET lives only
 * here and in the API, so anything this function signs, the API will believe.
 * Never call it with claims that have not been verified first.
 */
export function signBridgeToken(identity: BridgeIdentity): string {
    const secret = process.env.OAUTH_BRIDGE_SECRET
    if (!secret) {
        throw new Error('ยังไม่ได้ตั้งค่า OAUTH_BRIDGE_SECRET บนเว็บแอป (ต้องตรงกับฝั่ง API)')
    }

    // `sub` is the standard subject claim and is what Google puts the account's
    // stable id in - passing it as an option is the only way jsonwebtoken will
    // place it there. It must not also appear in the payload object.
    return jwt.sign(
        {
            provider: identity.provider,
            email: identity.email,
            email_verified: identity.email_verified,
            display_name: identity.display_name,
            type: BRIDGE_TYPE,
        },
        secret,
        {
            algorithm: 'HS256',
            expiresIn: BRIDGE_TTL_SECONDS,
            subject: identity.provider_uid,
        },
    )
}