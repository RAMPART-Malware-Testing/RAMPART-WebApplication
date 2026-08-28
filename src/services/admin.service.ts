import axios from "axios";

const ERROR_RESPONSE = { success: false, status: "SERVER_ERROR", message: "Connect Server Error!!!" };
const SERVER_URL = process.env.SERVER_URL || "http://localhost:8006";

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

    async dashboardSummary(token: string, trendDays?: number) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/dashboard/summary`, { token, trend_days: trendDays || 14 });
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

    async getUserLoginHistory(token: string, targetUid: string, params: { page?: number; limit?: number }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/login-history`, { token, target_uid: targetUid, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async getUserDownloadHistory(token: string, targetUid: string, params: { page?: number; limit?: number }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/download-history`, { token, target_uid: targetUid, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async bulkBanUsers(token: string, targetUids: string[], reason: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/users/bulk-ban`, { token, target_uids: targetUids, reason });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async bulkDeleteFiles(token: string, aids: string[], reason: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/files/bulk-delete`, { token, aids, reason });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async exportUsers(token: string) {
        const res = await axios.post(`${SERVER_URL}/api/admin/export/users`, { token }, { responseType: "text" });
        return res.data as string;
    }

    async exportFiles(token: string) {
        const res = await axios.post(`${SERVER_URL}/api/admin/export/files`, { token }, { responseType: "text" });
        return res.data as string;
    }

    async exportAuditLogs(token: string) {
        const res = await axios.post(`${SERVER_URL}/api/admin/export/audit-logs`, { token }, { responseType: "text" });
        return res.data as string;
    }

    async broadcastEmail(token: string, subject: string, message: string, targetRole?: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/broadcast-email`, { token, subject, message, target_role: targetRole || null });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async systemHealth(token: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/system/health`, { token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async taskQueueList(token: string, params: { page?: number; limit?: number; status?: string; q?: string }) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/tasks`, { token, ...params });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async taskQueueDepth(token: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/tasks/depth`, { token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async taskRetry(token: string, taskId: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/tasks/retry`, { token, task_id: taskId });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async taskCancel(token: string, taskId: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/tasks/cancel`, { token, task_id: taskId });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async rateLimitSnapshot(token: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/rate-limits`, { token });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

    async rateLimitClear(token: string, key: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/api/admin/rate-limits/clear`, { token, key });
            return res.data;
        } catch {
            return ERROR_RESPONSE;
        }
    }

}

export const AdminService = new AdminServiceClass();
