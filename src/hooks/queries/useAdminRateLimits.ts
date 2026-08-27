import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export function useAdminRateLimits() {
  return useQuery({
    queryKey: queryKeys.adminRateLimits,
    queryFn: async (): Promise<RateLimitSnapshotResponse['data'] | null> => {
      const { data } = await axios.post<RateLimitSnapshotResponse>('/api/admin/rate-limits')
      return data.success ? data.data : null
    },
    staleTime: 5_000,
  })
}

export function useAdminClearRateLimit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await axios.post<{ success: boolean; message: string }>('/api/admin/rate-limits/clear', { key })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถปลดล็อกได้')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminRateLimits })
    },
  })
}
