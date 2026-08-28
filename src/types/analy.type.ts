interface AnalysisHistoryParams {
    token: string
    page?: number
    limit?: number
    s?: string
    status?: 'pending' | 'processing' | 'success' | 'failed' | null
    file_type?: string | null
    created_at?: 1 | -1 | 0
    file_name?: 1 | -1 | 0
    file_size?: 1 | -1 | 0
    score?: 1 | -1 | 0
}

interface AnalysisHistoryReport {
    rid: number
    score: number | null
    rampart_score: number | null
    risk_level: string | null
    package: string | null
    type: string | null
    recommendation: string | null
    analysis_summary: string | null
    risk_indicators: string[] | null
    created_at: string | null
}

interface AnalysisHistoryItem {
    aid: number
    task_id: string | null
    file_name: string | null
    file_size: number | null
    file_type: string | null
    file_hash: string | null
    tools: string | null
    status: 'pending' | 'processing' | 'success' | 'failed' | null
    md5: string | null
    privacy: boolean
    created_at: string | null
    report: AnalysisHistoryReport | null
}

interface AnalysisHistoryPagination {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
}

interface AnalysisHistoryResponse {
    success: boolean
    data: AnalysisHistoryItem[]
    pagination: AnalysisHistoryPagination
}

interface AnalysisToolProgress {
    status: string
    score?: number | null
    task_id?: string | number | null
    note?: string
}

type ToolNotes = Partial<Record<'virustotal' | 'mobsf' | 'cape', string>>

interface AnalysisProgress {
    stage: 'worker' | 'virustotal' | 'sandboxes' | 'rampart_ai' | 'gemini' | 'complete' | 'failed' | string
    message: string
    updated_at: string
    tools?: {
        virustotal?: AnalysisToolProgress
        mobsf?: AnalysisToolProgress
        cape?: AnalysisToolProgress
        rampart_ai?: AnalysisToolProgress
        gemini?: AnalysisToolProgress
    }
    error?: string
}

interface CheckHashResponse {
    success: boolean
    found: boolean
    status?: string
    task_id?: string
    md5?: string
    sha256?: string
    filename?: string
    message?: string
    report?: {
        score: number | null
        risk_level: string | null
        virustotal_score: number | null
        mobsf_score: number | null
        cape_score: number | null
        rampart_ai_score: number | null
    } | null
}