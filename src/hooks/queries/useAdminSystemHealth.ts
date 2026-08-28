import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export const HEALTH_CHECK_NAMES = [
  'postgresql',
  'redis',
  'celery_workers',
  'mobsf',
  'cape',
  'rampart_ai',
  'disk_space',
  'memory',
] as const

export function useAdminSystemHealth(autoRefresh: boolean) {
  return useQuery({
    queryKey: queryKeys.adminSystemHealth,
    queryFn: async (): Promise<SystemHealthResponse['data'] | null> => {
      const { data } = await axios.post<SystemHealthResponse>('/api/admin/system/health')
      return data.success ? data.data : null
    },
    refetchInterval: autoRefresh ? 15_000 : false,
    staleTime: 5_000,
  })
}
