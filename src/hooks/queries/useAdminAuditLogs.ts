import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AdminAuditLogsParams {
  page: number
  limit: number
  action?: string
}

export function useAdminAuditLogs(params: AdminAuditLogsParams) {
  return useQuery({
    queryKey: queryKeys.adminAuditLogs(params),
    queryFn: async () => {
      const body: Record<string, unknown> = { page: params.page, limit: params.limit }
      if (params.action) body.action = params.action
      const { data } = await axios.post<AuditLogResponse>('/api/admin/audit-logs', body)
      if (!data.success) return { data: [] as AuditLogItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    staleTime: 5_000,
  })
}

export async function exportAdminAuditLogsCsv() {
  const res = await axios.post('/api/admin/export/audit-logs', {}, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'audit_logs.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
