import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AdminReportsListParams {
  page: number
  limit: number
  q?: string
  risk_level?: string
}

export function useAdminReportsList(params: AdminReportsListParams) {
  return useQuery({
    queryKey: queryKeys.adminReportsList(params),
    queryFn: async () => {
      const body: Record<string, unknown> = { page: params.page, limit: params.limit }
      if (params.q) body.q = params.q
      if (params.risk_level) body.risk_level = params.risk_level
      const { data } = await axios.post<AdminFileListResponse>('/api/admin/reports', body)
      if (!data.success) return { data: [] as AdminFileListItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    staleTime: 5_000,
  })
}
