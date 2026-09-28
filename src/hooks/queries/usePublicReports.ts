import { keepPreviousData, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface PublicReportsParams {
  page?: number
  limit?: number
  s?: string
  status?: string
  file_type?: string
  created_at?: 1 | -1 | 0
  file_name?: 1 | -1 | 0
  file_size?: 1 | -1 | 0
  score?: 1 | -1 | 0
}

export interface PublicReportOwner {
  username: string | null
  avatar_url: string | null
}

export type PublicReportItem = AnalysisHistoryItem & { uploaded_by?: PublicReportOwner | null }

export interface PublicReportsResult {
  data: PublicReportItem[]
  pagination: AnalysisHistoryPagination | null
}

export function usePublicReports(params: PublicReportsParams = {}) {
  const normalized = {
    page: 1,
    limit: 5,
    created_at: -1 as const,
    file_name: 0 as const,
    file_size: 0 as const,
    score: 0 as const,
    ...params,
  }
  return useQuery({
    queryKey: queryKeys.publicReports(normalized),
    queryFn: async (): Promise<PublicReportsResult> => {
      const { data } = await axios.post("/api/dashboard/reports", normalized)
      if (!data?.success || !Array.isArray(data.data)) return { data: [], pagination: null }
      return { data: data.data, pagination: data.pagination ?? null }
    },
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  })
}
