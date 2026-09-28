import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export function useAdminUserDetail(uid: string) {
  return useQuery({
    queryKey: queryKeys.adminUserDetail(uid),
    queryFn: async (): Promise<AdminUserListItem | null> => {
      const { data } = await axios.post<AdminUserDetailResponse>("/api/admin/users/detail", { target_uid: uid })
      return data.success ? data.data : null
    },
    enabled: !!uid,
    staleTime: 5_000,
  })
}

export function useAdminUserHistory(uid: string, page: number) {
  return useQuery({
    queryKey: queryKeys.adminUserHistory(uid, page),
    queryFn: async () => {
      const { data } = await axios.post<AdminUserHistoryResponse>("/api/admin/users/history", {
        target_uid: uid,
        page,
        limit: 25,
      })
      if (!data.success) return { data: [] as AdminUserHistoryItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    enabled: !!uid,
    staleTime: 5_000,
  })
}

export function useAdminUserLogins(uid: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminUserLogins(uid, page),
    queryFn: async () => {
      const { data } = await axios.post<AdminLoginHistoryResponse>("/api/admin/users/login-history", {
        target_uid: uid,
        page,
        limit: 25,
      })
      if (!data.success) return { data: [] as AdminLoginHistoryItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    enabled: !!uid && enabled,
    staleTime: 5_000,
  })
}

export function useAdminUserDownloads(uid: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminUserDownloads(uid, page),
    queryFn: async () => {
      const { data } = await axios.post<AdminDownloadHistoryResponse>("/api/admin/users/download-history", {
        target_uid: uid,
        page,
        limit: 25,
      })
      if (!data.success) return { data: [] as AdminDownloadHistoryItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    enabled: !!uid && enabled,
    staleTime: 5_000,
  })
}

export function useAdminUserPasswords(uid: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminUserPasswords(uid, page),
    queryFn: async () => {
      const { data } = await axios.post<AdminPasswordHistoryResponse>("/api/admin/users/password-history", {
        target_uid: uid,
        page,
        limit: 25,
      })
      if (!data.success) return { data: [] as AdminPasswordHistoryItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    enabled: !!uid && enabled,
    staleTime: 5_000,
  })
}

export function useAdminDeleteHistory(uid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ kind, entryId }: { kind: 'analysis' | 'login' | 'password' | 'download'; entryId: string }) => {
      const { data } = await axios.post('/api/admin/users/history-delete', {
        target_uid: uid,
        kind,
        entry_id: entryId,
      })
      if (!data?.success) throw new Error(data?.message || 'ลบประวัติไม่สำเร็จ')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-history", uid] })
      queryClient.invalidateQueries({ queryKey: ["admin", "user-logins", uid] })
      queryClient.invalidateQueries({ queryKey: ["admin", "user-downloads", uid] })
      queryClient.invalidateQueries({ queryKey: ["admin", "user-passwords", uid] })
    },
  })
}
