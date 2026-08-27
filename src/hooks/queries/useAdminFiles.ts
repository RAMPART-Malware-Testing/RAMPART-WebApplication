import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AdminFilesListParams {
  page: number
  limit: number
  q?: string
  status?: string
  privacy?: boolean
}

export function useAdminFilesList(params: AdminFilesListParams) {
  return useQuery({
    queryKey: queryKeys.adminFilesList(params),
    queryFn: async () => {
      const body: Record<string, unknown> = { page: params.page, limit: params.limit }
      if (params.q) body.q = params.q
      if (params.status) body.status = params.status
      if (params.privacy !== undefined) body.privacy = params.privacy
      const { data } = await axios.post<AdminFileListResponse>('/api/admin/files', body)
      if (!data.success) return { data: [] as AdminFileListItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    staleTime: 5_000,
  })
}

function useInvalidateAdminFiles() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "files-list"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "reports-list"] })
  }
}

export function useAdminDeleteFile() {
  const invalidate = useInvalidateAdminFiles()
  return useMutation({
    mutationFn: async ({ aid, reason }: { aid: string; reason: string }) => {
      const { data } = await axios.post<AdminDeleteFileResponse>('/api/admin/files/delete', { aid, reason })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถลบไฟล์ได้')
      return data
    },
    onSuccess: invalidate,
  })
}

export function useAdminBulkDeleteFiles() {
  const invalidate = useInvalidateAdminFiles()
  return useMutation({
    mutationFn: async ({ aids, reason }: { aids: string[]; reason: string }) => {
      const { data } = await axios.post<AdminBulkActionResponse>('/api/admin/files/bulk-delete', { aids, reason })
      if (!data.success || !data.data) throw new Error('ไม่สามารถลบได้')
      return data.data
    },
    onSuccess: invalidate,
  })
}

export async function exportAdminFilesCsv() {
  const res = await axios.post('/api/admin/export/files', {}, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'files.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
