import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export type TokenType = "session" | "device";

interface TokenPayload extends JwtPayload {
    type?: TokenType;
    token?: string;
    deviceToken?: string;
    data?: RampartUser;
    [key: string]: any;
}

class JwtService {
    private readonly secret: string;

    constructor(secret: string = JWT_SECRET) {
        if (!secret) throw new Error("JWT_SECRET is not defined");
        this.secret = secret;
    }

    sign(payload: TokenPayload, expiresIn: SignOptions["expiresIn"] = "1h"): string {
        const { exp, iat, ...cleanPayload } = payload;
        return jwt.sign(cleanPayload, this.secret, { expiresIn });
    }

    verify(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, this.secret) as TokenPayload;
        } catch {
            return null;
        }
    }

    decode(token: string): TokenPayload | null {
        return jwt.decode(token) as TokenPayload | null;
    }

    isExpired(token: string): boolean {
        const payload = this.decode(token);
        if (!payload?.exp) return true;
        return Date.now() >= payload.exp * 1000;
    }

}

export const jwtService = new JwtService();