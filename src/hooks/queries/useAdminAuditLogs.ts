import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AdminAuditLogsParams {
  page: number
  limit: number
  action?: string
  q?: string
  date_from?: string
  date_to?: string
}

export function useAdminAuditLogs(params: AdminAuditLogsParams) {
  return useQuery({
    queryKey: queryKeys.adminAuditLogs(params),
    queryFn: async () => {
      const body: Record<string, unknown> = { page: params.page, limit: params.limit }
      if (params.action) body.action = params.action
      if (params.q) body.q = params.q
      if (params.date_from) body.date_from = params.date_from
      if (params.date_to) body.date_to = params.date_to
      const { data } = await axios.post<AuditLogResponse>('/api/admin/audit-logs', body)
      if (!data.success) throw new Error((data as AuditLogResponse & { message?: string }).message || 'ไม่สามารถดึงประวัติได้')
      return { data: data.data, pagination: data.pagination }
    },
    staleTime: 5_000,
  })
}

export function useAdminDeleteAuditLogsOlderThan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (months: number) => {
      try {
        const { data } = await axios.post<AdminDeleteAuditLogsOlderThanResponse>('/api/admin/audit-logs/delete-older-than', { months })
        if (!data.success || !data.data) throw new Error(data.message || 'ไม่สามารถลบข้อมูลได้')
        return data.data.deleted
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message = (err.response?.data as { message?: string } | undefined)?.message
          throw new Error(message || 'ไม่สามารถลบข้อมูลได้')
        }
        throw err instanceof Error ? err : new Error('ไม่สามารถลบข้อมูลได้')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "user-passwords"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
      queryClient.invalidateQueries({ queryKey: queryKeys.passwordHistory })
    },
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
