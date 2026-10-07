import jwt from 'jsonwebtoken'

const BRIDGE_TYPE = 'oauth_bridge'

const BRIDGE_TTL_SECONDS = 120

export type BridgeProvider = 'google' | 'github'

export type BridgeIdentity = {
    provider: BridgeProvider
    provider_uid: string
    email: string
    email_verified: boolean
    display_name: string | null
}

export function signBridgeToken(identity: BridgeIdentity): string {
    const secret = process.env.OAUTH_BRIDGE_SECRET
    if (!secret) {
        throw new Error('ยังไม่ได้ตั้งค่า OAUTH_BRIDGE_SECRET บนเว็บแอป (ต้องตรงกับฝั่ง API)')
    }

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