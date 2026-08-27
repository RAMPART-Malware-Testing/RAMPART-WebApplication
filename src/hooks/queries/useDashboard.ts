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
  riskScore: number
}

export interface DashboardSummary {
  totalFiles: FileStats
  userFiles: FileStats
  totalUsers: number
  topMalwareTypes: {
    daily: MalwareTypeEntry[]
    monthly: MalwareTypeEntry[]
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
        },
        riskScores: data?.riskScores ?? [],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: async (): Promise<any[]> => {
      const { data } = await axios.post("/api/dashboard/reports", { page, limit })
      return data?.data ?? []
    },
    staleTime: 5_000,
  })
}
