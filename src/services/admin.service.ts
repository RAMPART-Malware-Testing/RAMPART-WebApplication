import axios from "axios";

const ERROR_RESPONSE = { success: false, status: "SERVER_ERROR", message: "Connect Server Error!!!" };
const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";

/** Server-side-only client for the backend's /api/admin/* endpoints.
 * Follows the same shape as profile.service.ts / dashboard.service.ts:
 * the caller's access token travels in the JSON body (not an Authorization
 * header), matching this project's existing convention everywhere else. */
class AdminServiceClass {
    async listUsers(token: string, params: { page?: number; limit?: number; q?: string; role?: string | string[]; banned?: boolean }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users`, { token, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async getUserDetail(token: string, targetUid: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/detail`, { token, target_uid: targetUid });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async getUserHistory(token: string, targetUid: string, params: { page?: number; limit?: number; s?: string; status?: string; file_type?: string }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/history`, { token, target_uid: targetUid, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async banUser(token: string, targetUid: string, reason: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/ban`, { token, target_uid: targetUid, reason });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async unbanUser(token: string, targetUid: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/unban`, { token, target_uid: targetUid });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async changeRole(token: string, targetUid: string, newRole: "user" | "admin") {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/role`, { token, target_uid: targetUid, new_role: newRole });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async dashboardSummary(token: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/dashboard/summary`, { token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async auditLogs(token: string, params: { page?: number; limit?: number; actor_uid?: string; action?: string }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/audit-logs`, { token, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async listFiles(token: string, params: { page?: number; limit?: number; q?: string; status?: string; file_type?: string; privacy?: boolean }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/files`, { token, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async deleteFile(token: string, aid: string, reason: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/files/delete`, { token, aid, reason });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async listReports(token: string, params: { page?: number; limit?: number; q?: string; risk_level?: string; file_type?: string }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/reports`, { token, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }
}

export const AdminService = new AdminServiceClass();
