import axios from "axios";

const ERROR_RESPONSE = { success: false, status: 404, message: "Connect Server Error!!!" };

class SetupService {
    private readonly uri = process.env.SERVER_URL || "http://localhost:8006";

    /**
     * Asks the API whether the first master account still has to be created.
     * This is the only thing the web app uses to decide between the setup
     * page and the login page.
     */
    async getStatus() {
        try {
            const res = await axios.get(`${this.uri}/api/auth/setup/status`, { timeout: 5000 });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    /**
     * Creates the first master account.
     */
    async complete(params: {
        username: string
        email: string
        password: string
        confirmPassword: string
    }) {
        try {
            const res = await axios.post(
                `${this.uri}/api/auth/setup/complete`,
                {
                    username: params.username,
                    email: params.email,
                    password: params.password,
                    confirmPassword: params.confirmPassword,
                },
                { timeout: 15000 },
            );
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }
}

export const setupService = new SetupService();
