import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AdminUsersListParams {
  page: number
  limit: number
  role?: string | string[]
  q?: string
  banned?: boolean
  status?: 'active' | 'deleted' | 'all'
}

export function useAdminUsersList(params: AdminUsersListParams) {
  return useQuery({
    queryKey: queryKeys.adminUsersList(params),
    queryFn: async () => {
      const body: Record<string, unknown> = { page: params.page, limit: params.limit }
      if (params.role) body.role = params.role
      if (params.q) body.q = params.q
      if (params.banned !== undefined) body.banned = params.banned
      if (params.status) body.status = params.status
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
    queryClient.invalidateQueries({ queryKey: ["admin", "user-detail"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] })
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

export function useAdminDeleteUser() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: async (uid: string) => {
      const { data } = await axios.post<AdminActionResponse>('/api/admin/users/delete', { target_uid: uid })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถลบบัญชีได้')
      return data
    },
    onSuccess: invalidate,
  })
}

export function useAdminResetUserPassword() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: async ({ uid, newPassword }: { uid: string; newPassword: string }) => {
      const { data } = await axios.post<AdminActionResponse>('/api/admin/users/password-reset', {
        target_uid: uid,
        new_password: newPassword,
      })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถตั้งรหัสผ่านได้')
      return data
    },
    onSuccess: invalidate,
  })
}

export function useAdminCreateUser() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: async (payload: AdminCreateUserPayload) => {
      try {
        const { data } = await axios.post<AdminCreateUserResponse>('/api/admin/users/create', payload)
        if (!data.success || !data.data) throw new Error(data.message || 'ไม่สามารถสร้างบัญชีได้')
        return data.data
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message = (err.response?.data as { message?: string } | undefined)?.message
          throw new Error(message || 'ไม่สามารถสร้างบัญชีได้')
        }
        throw err instanceof Error ? err : new Error('ไม่สามารถสร้างบัญชีได้')
      }
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
