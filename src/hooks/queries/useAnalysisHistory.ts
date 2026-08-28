import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AnalysisHistoryQueryParams {
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

export interface AnalysisHistoryQueryResult {
  data: AnalysisHistoryItem[]
  pagination: AnalysisHistoryPagination | null
}

export function useAnalysisHistory(params: AnalysisHistoryQueryParams = {}) {
  const normalized = { page: 1, limit: 50, ...params }
  return useQuery({
    queryKey: queryKeys.analysisHistory(normalized),
    queryFn: async (): Promise<AnalysisHistoryQueryResult> => {
      const { data } = await axios.post("/api/analy/history", normalized)
      if (!data?.success || !Array.isArray(data.data)) return { data: [], pagination: null }
      return { data: data.data, pagination: data.pagination ?? null }
    },
    staleTime: 5_000,
  })
}
