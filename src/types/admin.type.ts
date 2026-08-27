/** Shape of a single row returned by every /api/admin/* endpoint that
 * surfaces a user record (list, detail, ban, unban, role-change). Mirrors
 * services.admin.admin_service.serialize_user on the backend exactly. */
interface AdminUserListItem {
    uid: string
    username: string
    email: string
    avatar_url: string | null
    role: "user" | "admin" | "master"
    status: string
    is_banned: boolean
    banned_at: string | null
    banned_reason: string | null
    banned_by: string | null
    created_at: string | null
}

interface AdminPagination {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
}

interface AdminUserListResponse {
    success: boolean
    data: AdminUserListItem[]
    pagination: AdminPagination
}

interface AdminUserDetailResponse {
    success: boolean
    status: string
    message: string
    data: AdminUserListItem | null
}

/** One row of a target user's analysis history as seen by an admin/master -
 * includes files the owner marked private, unlike the self-service history
 * endpoint. Mirrors services.admin.admin_service.get_user_analysis_history_admin. */
interface AdminUserHistoryItem {
    aid: string
    task_id: string | null
    file_name: string | null
    file_size: number | null
    file_type: string | null
    file_hash: string | null
    md5: string | null
    tools: string | null
    status: string | null
    privacy: boolean
    is_malicious: boolean | null
    created_at: string | null
    report: {
        score: number | null
        rampart_score: number | null
        risk_level: string | null
        virustotal_score: number | null
        mobsf_score: number | null
        cape_score: number | null
    } | null
}

interface AdminUserHistoryResponse {
    success: boolean
    data: AdminUserHistoryItem[]
    pagination: AdminPagination
}

interface AuditLogItem {
    log_id: string
    actor_uid: string
    actor_username: string | null
    target_uid: string | null
    target_username: string | null
    action: string | null
    detail: string | null
    created_at: string | null
}

interface AuditLogResponse {
    success: boolean
    data: AuditLogItem[]
    pagination: AdminPagination
}

interface AdminDashboardSummary {
    total_users: number
    role_breakdown: {
        user: number
        admin: number
        master: number
    }
    banned_count: number
    total_analyses: number
    malicious_count: number
    /** Daily upload counts for the trailing window (oldest first), e.g. 14 days. */
    upload_trend: { date: string; count: number }[]
    status_breakdown: { status: string; count: number }[]
    /** risk_level values: "Low" | "Caution" | "High" | "Critical" | "N/A" */
    risk_level_breakdown: { risk_level: string; count: number }[]
    file_type_breakdown: { file_type: string; count: number }[]
    tool_usage: { tool: string; count: number }[]
    recent_actions: {
        log_id: string
        actor_username: string | null
        target_username: string | null
        action: string | null
        detail: string | null
        created_at: string | null
    }[]
}

interface AdminDashboardSummaryResponse {
    success: boolean
    data: AdminDashboardSummary
}

/** Generic {success, status, message, data} shape every admin mutation
 * (ban/unban/role-change) responds with - see utils/response.py on the
 * backend. `status` doubles as a machine-readable error code on failure
 * (e.g. "ADMIN_TARGET_FORBIDDEN", "MASTER_PROTECTED", "ACCOUNT_BANNED"). */
interface AdminActionResponse {
    success: boolean
    status: string
    message: string
    data: AdminUserListItem | null
}

/** One row from /api/admin/files or /api/admin/reports - system-wide
 * (cross-user) file listing, unlike AdminUserHistoryItem which is scoped
 * to one target user. Mirrors services.admin.admin_service._serialize_file_row. */
interface AdminFileListItem {
    aid: string
    task_id: string | null
    file_name: string | null
    file_size: number | null
    file_type: string | null
    file_hash: string | null
    md5: string | null
    tools: string | null
    status: string | null
    privacy: boolean
    is_malicious: boolean | null
    created_at: string | null
    owner_uid: string | null
    owner_username: string | null
    report: {
        score: number | null
        risk_level: string | null
        virustotal_score: number | null
        mobsf_score: number | null
        cape_score: number | null
    } | null
}

interface AdminFileListResponse {
    success: boolean
    data: AdminFileListItem[]
    pagination: AdminPagination
}

interface AdminDeleteFileResponse {
    success: boolean
    status: string
    message: string
    data: { aid: string; deleted_at: string | null } | null
}

interface AdminLoginHistoryItem {
    id: string
    provider: string | null
    ip: string | null
    user_agent: string | null
    status: string | null
    created_at: string | null
}

interface AdminLoginHistoryResponse {
    success: boolean
    data: AdminLoginHistoryItem[]
    pagination: AdminPagination
}

interface AdminDownloadHistoryItem {
    id: string
    file_name: string | null
    tool: string | null
    md5: string | null
    created_at: string | null
}

interface AdminDownloadHistoryResponse {
    success: boolean
    data: AdminDownloadHistoryItem[]
    pagination: AdminPagination
}

interface AdminBulkActionResponse {
    success: boolean
    data: { succeeded: string[]; failed: { uid?: string; aid?: string; reason: string }[] } | null
}

interface HealthCheckItem {
    name: string
    status: "up" | "down" | "degraded" | "unconfigured"
    latency_ms: number | null
    detail: string | null
    workers?: { name: string; active_tasks: number; reserved_tasks: number }[]
    total_gb?: number
    used_gb?: number
    free_gb?: number
    available_gb?: number
    percent_used?: number
}

interface SystemHealthResponse {
    success: boolean
    data: {
        overall_status: "up" | "down" | "degraded"
        checked_at: string
        checks: HealthCheckItem[]
    }
}

interface TaskQueueItem {
    aid: string
    task_id: string | null
    file_name: string | null
    status: string | null
    tool_notes: string | null
    owner_username: string | null
    owner_uid: string
    created_at: string | null
    age_seconds: number | null
}

interface TaskQueueResponse {
    success: boolean
    data: TaskQueueItem[]
    pagination: AdminPagination
}

interface TaskQueueDepthResponse {
    success: boolean
    data: { active: number; reserved: number; scheduled: number; workers_online: number; error?: string }
}

interface TaskActionResponse {
    success: boolean
    message: string
    task_id?: string
}

interface RateLimitEntry {
    key: string
    identifier: string
    ttl_seconds: number | null
}

interface RateLimitGroup {
    pattern: string
    label: string
    count: number
    entries: RateLimitEntry[]
}

interface RateLimitSnapshotResponse {
    success: boolean
    data: { total_locked: number; groups: RateLimitGroup[] }
}

interface BroadcastEmailResponse {
    success: boolean
    data: { sent: number; total_recipients: number } | null
}
