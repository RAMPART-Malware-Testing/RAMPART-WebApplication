import axios from "axios";

const ERROR_RESPONSE = { success: false, status: 404, message: "Connect Server Error!!!" };
const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";

class ProfileServiceClass {
    async getProfile(token: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/profile`, { token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async updateUsername(token: string, username: string) {
        try {
            const res = await axios.patch(`${SERVER_URL}/api/profile`, { token, username });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async uploadAvatar(token: string, file: File) {
        try {
            const form = new FormData();
            form.append("token", token);
            form.append("file", file);
            const res = await axios.post(`${SERVER_URL}/api/profile/avatar`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async changePassword(token: string, currentPasswd: string, newPasswd: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/profile/change-password`, {
                token,
                currentPasswd,
                newPasswd,
            });
            return res.data;
        } catch (err) {
            const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
            if (Array.isArray(detail) && detail[0]?.msg) {
                return { success: false, status: "PASSWORD_POLICY_INVALID", message: String(detail[0].msg).replace(/^Value error, /, "") };
            }
            return ERROR_RESPONSE;
        }
    }

    async passwordHistory(token: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/profile/password-history`, { token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async notificationCounts(token: string, reportsSince: string | null, publicSince: string | null) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/profile/notifications`, {
                token,
                reports_since: reportsSince,
                public_since: publicSince,
            });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }
}

export const ProfileService = new ProfileServiceClass();
