import axios from "axios";
const ERROR_RESPONSE = { success: false, status: 404, message: "Connect Server Error!!!" };
class DashboardServiceClass {
    private readonly uri = process.env.SERVER_URL || "http://localhost:8000"
    async summary(token:string){
        try {
            const res = await axios.post(`${this.uri}/api/analy/v1/dashboard/summary`, {token});
            return res.data
        } catch {
            return ERROR_RESPONSE
        }
    }
    async recentActivities(token:string){
        try {
            const res = await axios.post(`${this.uri}/api/analy/v1/dashboard/recent-activities`, {token});
            return res.data
        } catch {
            return ERROR_RESPONSE
        }
    }
}

export const DashboardService = new DashboardServiceClass();
