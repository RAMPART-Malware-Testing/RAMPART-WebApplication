import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

/** Fixed, known-in-advance set of checks the backend always runs
 * (services.admin.health_service._compute_system_health) - used to render
 * a "checking..." skeleton per-check the instant the page mounts, instead
 * of a single opaque spinner while the whole request is in flight. */
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

/** Backend caches the underlying health checks for 15s
 * (services.admin.health_service.get_system_health) - polling here at
 * the same 15s cadence means the auto-refresh mostly hits that
 * server-side cache instead of re-running every downstream health probe. */
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
