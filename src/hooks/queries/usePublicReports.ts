import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export type PublicReportsSortField = "created_at" | "file_name" | "file_size" | "score"

export interface PublicReportsParams {
  page: number
  limit: number
  s?: string
  status?: string
  file_type?: string
  score_min?: number
  score_max?: number
  sort?: PublicReportsSortField
  dir?: 1 | -1
}

export interface PublicReportsResponse {
  success: boolean
  data: AnalysisHistoryItem[]
  pagination: AnalysisHistoryPagination | null
}

const EMPTY: PublicReportsResponse = { success: true, data: [], pagination: null }

export function usePublicReports(params: PublicReportsParams) {
  return useQuery({
    queryKey: queryKeys.publicReports(params),
    queryFn: async (): Promise<PublicReportsResponse> => {
      const body: PublicReportsParams = { page: params.page, limit: params.limit }
      if (params.s) body.s = params.s
      if (params.status) body.status = params.status
      if (params.file_type) body.file_type = params.file_type
      if (params.score_min !== undefined) body.score_min = params.score_min
      if (params.score_max !== undefined) body.score_max = params.score_max
      if (params.sort) body.sort = params.sort
      if (params.dir) body.dir = params.dir
      const { data } = await axios.post<PublicReportsResponse>("/api/dashboard/reports", body)
      if (!data?.success || !Array.isArray(data.data)) return EMPTY
      return { success: true, data: data.data, pagination: data.pagination ?? null }
    },
    staleTime: 60_000,
  })
}
