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
}

export const ProfileService = new ProfileServiceClass();
