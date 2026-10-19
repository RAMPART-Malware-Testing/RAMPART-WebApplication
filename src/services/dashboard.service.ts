import axios from "axios";
const ERROR_RESPONSE = { success: false, status: 404, message: "Connect Server Error!!!" };
class DashboardServiceClass {
    private readonly uri = process.env.SERVER_URL || "http://localhost:8006"
    private failure(err: unknown) {
        if (axios.isAxiosError(err)) {
            const detail = (err.response?.data as { detail?: string } | undefined)?.detail
            if (err.response?.status === 401) {
                return { success: false, status: "TOKEN_INVALID", message: detail || "เซสชันหมดอายุหรือบัญชีนี้ไม่พร้อมใช้งาน" }
            }
            if (err.response?.status === 403) {
                return { success: false, status: "ACCOUNT_BANNED", message: detail || "บัญชีนี้ไม่พร้อมใช้งาน" }
            }
        }
        return ERROR_RESPONSE
    }
    async summary(token:string){
        try {
            const res = await axios.post(`${this.uri}/api/analy/v1/dashboard/summary`, {token});
            return res.data
        } catch (err) {
            return this.failure(err)
        }
    }
    async recentActivities(token:string){
        try {
            const res = await axios.post(`${this.uri}/api/analy/v1/dashboard/recent-activities`, {token});
            return res.data
        } catch (err) {
            return this.failure(err)
        }
    }
}

export const DashboardService = new DashboardServiceClass();
