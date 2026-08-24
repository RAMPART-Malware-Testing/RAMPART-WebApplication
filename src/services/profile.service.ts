import axios from "axios";

const ERROR_RESPONSE = { success: false, status: 404, message: "Connect Server Error!!!" };

class ProfileServiceClass {
    private readonly uri = process.env.SERVER_URL || "http://localhost:8006";

    async getProfile(token: string) {
        try {
            const res = await axios.post(`${this.uri}/api/profile`, { token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async updateUsername(token: string, username: string) {
        try {
            const res = await axios.patch(`${this.uri}/api/profile`, { token, username });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }
}

export const ProfileService = new ProfileServiceClass();
