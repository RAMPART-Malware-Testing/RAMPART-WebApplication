import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AdminUsersListParams {
  page: number
  limit: number
  role?: string | string[]
  q?: string
  banned?: boolean
}

export function useAdminUsersList(params: AdminUsersListParams) {
  return useQuery({
    queryKey: queryKeys.adminUsersList(params),
    queryFn: async () => {
      const body: Record<string, unknown> = { page: params.page, limit: params.limit }
      if (params.role) body.role = params.role
      if (params.q) body.q = params.q
      if (params.banned !== undefined) body.banned = params.banned
      const { data } = await axios.post<AdminUserListResponse>('/api/admin/users', body)
      if (!data.success) return { data: [] as AdminUserListItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    staleTime: 5_000,
  })
}

function useInvalidateAdminUsers() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "users-list"] })
  }
}

export function useAdminBanUser() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: async ({ uid, reason }: { uid: string; reason: string }) => {
      const { data } = await axios.post<AdminActionResponse>('/api/admin/users/ban', { target_uid: uid, reason })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถแบนผู้ใช้ได้')
      return data
    },
    onSuccess: invalidate,
  })
}

export function useAdminUnbanUser() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: async (uid: string) => {
      const { data } = await axios.post<AdminActionResponse>('/api/admin/users/unban', { target_uid: uid })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถปลดแบนผู้ใช้ได้')
      return data
    },
    onSuccess: invalidate,
  })
}

export function useAdminChangeRole() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: async ({ uid, newRole }: { uid: string; newRole: 'user' | 'admin' }) => {
      const { data } = await axios.post<AdminActionResponse>('/api/admin/users/role', { target_uid: uid, new_role: newRole })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถเปลี่ยนสิทธิ์ได้')
      return data
    },
    onSuccess: invalidate,
  })
}

export function useAdminBulkBanUsers() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: async ({ uids, reason }: { uids: string[]; reason: string }) => {
      const { data } = await axios.post<AdminBulkActionResponse>('/api/admin/users/bulk-ban', { target_uids: uids, reason })
      if (!data.success || !data.data) throw new Error('ไม่สามารถแบนได้')
      return data.data
    },
    onSuccess: invalidate,
  })
}

export async function exportAdminUsersCsv() {
  const res = await axios.post('/api/admin/export/users', {}, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'users.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
