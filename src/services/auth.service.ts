import axios, { AxiosInstance } from "axios";

const ERROR_RESPONSE = { success: false, status: 404, message: "Connect Server Error!!!" };

class AuthService {
    private readonly http: AxiosInstance;
    private readonly uri= process.env.SERVER_URL || "http://localhost:8000"

    constructor() {
        this.http = axios.create({
            baseURL: process.env.SERVER_URL || "http://localhost:8006",
        });
    }

    private buildHeaders(userAgent?: string | null, ip?: string | null, deviceToken?:string|null) {
        return {
            "User-Agent": userAgent ?? "",
            "x-client-ip": ip ?? "",
            "deviceToken": deviceToken ?? ""
        };
    }

    // ─── Login ───────────────────────────────────────────
    async login(req: LoginParams) {
        try {
            const res = await this.http.post(`${this.uri}/api/auth/login`, {
                email: req.email,
                password: req.password,
            }, {
                headers: this.buildHeaders(req.userAgent, req.ip, req.deviceToken),
            });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async loginConfirm(token: string, otp: string, userAgent?: string | null, ip?: string | null) {
        try {
            const res = await this.http.post(`${this.uri}/api/auth/login/confirm`, { otp, token }, {
                headers: this.buildHeaders(userAgent, ip),
            });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    // ─── Register ─────────────────────────────────────────
    async register(req: RegisterParams) {
        try {
            const res = await this.http.post(`${this.uri}/api/auth/register`, {
                username: req.username,
                email: req.email,
                password: req.password,
            });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async registerConfirm(token: string, otp: string) {
        try {
            const res = await this.http.post(`${this.uri}/api/auth/register/confirm`, { otp, token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    // ─── Reset Password ───────────────────────────────────
    async resetPassword(req: ResetPasswordParams) {
        try {
            const res = await this.http.post(`${this.uri}/api/auth/reset-passwd`, {
                email: req.email,
            });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async resetPasswordConfirm(token: string, otp: string, newPasswd: string) {
        try {
            const res = await this.http.post(`${this.uri}/api/auth/reset-passwd/confirm`, { otp, token, newPasswd });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }
}

export const authService = new AuthService();