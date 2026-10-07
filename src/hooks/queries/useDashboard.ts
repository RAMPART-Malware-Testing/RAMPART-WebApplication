import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface FileStats {
  total: number
  success: number
  pending: number
  failed: number
}

export interface MalwareTypeEntry {
  type: string
  count: number
}

export interface RiskScoreEntry {
  fileType: string
  label: string
  riskScore: number | null
  tools: {
    virustotal: number | null
    mobsf: number | null
    cape: number | null
    ai: number | null
  }
  sampleCount: number
  scoredCount: number
}

export interface DashboardSummary {
  totalFiles: FileStats
  userFiles: FileStats
  totalUsers: number
  topMalwareTypes: {
    daily: MalwareTypeEntry[]
    monthly: MalwareTypeEntry[]
    all: MalwareTypeEntry[]
  }
  riskScores: RiskScoreEntry[]
}

export interface RecentActivity {
  id: string
  fileName: string
  status: "success" | "pending" | "failed"
  timestamp: string
  fileType: string
}

const EMPTY_STATS: FileStats = { total: 0, success: 0, pending: 0, failed: 0 }

const num = (value: unknown): number | null => (typeof value === "number" ? value : null)

const normalizeRiskScore = (raw: any): RiskScoreEntry => ({
  fileType: String(raw?.fileType ?? ""),
  label: String(raw?.label ?? raw?.fileType ?? ""),
  riskScore: num(raw?.riskScore),
  tools: {
    virustotal: num(raw?.tools?.virustotal),
    mobsf: num(raw?.tools?.mobsf),
    cape: num(raw?.tools?.cape),
    ai: num(raw?.tools?.ai),
  },
  sampleCount: num(raw?.sampleCount) ?? 0,
  scoredCount: num(raw?.scoredCount) ?? 0,
})

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: async (): Promise<DashboardSummary> => {
      const { data } = await axios.post<Partial<DashboardSummary>>("/api/dashboard")
      return {
        totalFiles: data?.totalFiles ?? EMPTY_STATS,
        userFiles: data?.userFiles ?? EMPTY_STATS,
        totalUsers: typeof data?.totalUsers === "number" ? data.totalUsers : 0,
        topMalwareTypes: {
          daily: data?.topMalwareTypes?.daily ?? [],
          monthly: data?.topMalwareTypes?.monthly ?? [],
          all: data?.topMalwareTypes?.all ?? [],
        },
        riskScores: (data?.riskScores ?? [])
          .filter((row): row is RiskScoreEntry => Boolean(row?.fileType))
          .map(normalizeRiskScore),
      }
    },
    staleTime: 5_000,
  })
}

export function useDashboardRecentActivities() {
  return useQuery({
    queryKey: queryKeys.dashboardRecentActivities,
    queryFn: async (): Promise<RecentActivity[]> => {
      const { data } = await axios.post<RecentActivity[]>("/api/dashboard/recent-activities")
      return Array.isArray(data) ? data : []
    },
    staleTime: 5_000,
  })
}

export function useDashboardPublicReports(page = 1, limit = 8) {
  return useQuery({
    queryKey: queryKeys.dashboardReports(page, limit),
    queryFn: async (): Promise<any[]> => {
      const { data } = await axios.post("/api/dashboard/reports", { page, limit })
      return data?.data ?? []
    },
    staleTime: 5_000,
  })
}
