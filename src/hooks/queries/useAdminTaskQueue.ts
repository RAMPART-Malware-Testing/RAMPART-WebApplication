import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface AdminTaskQueueListParams {
  page: number
  limit: number
  status?: string
  q?: string
}

export function useAdminTaskQueueList(params: AdminTaskQueueListParams) {
  return useQuery({
    queryKey: queryKeys.adminTaskQueueList(params),
    queryFn: async () => {
      const body: Record<string, unknown> = { page: params.page, limit: params.limit }
      if (params.status) body.status = params.status
      if (params.q) body.q = params.q
      const { data } = await axios.post<TaskQueueResponse>('/api/admin/tasks', body)
      if (!data.success) return { data: [] as TaskQueueItem[], pagination: null as AdminPagination | null }
      return { data: data.data, pagination: data.pagination }
    },
    staleTime: 5_000,
  })
}

/** Backend already caches queue-depth for 5s
 * (services.admin.task_queue_service.get_queue_depth) - poll at 10s on
 * top of that so concurrent admins mostly hit the server-side cache. */
export function useAdminTaskQueueDepth() {
  return useQuery({
    queryKey: queryKeys.adminTaskQueueDepth,
    queryFn: async (): Promise<TaskQueueDepthResponse['data'] | null> => {
      const { data } = await axios.post<TaskQueueDepthResponse>('/api/admin/tasks/depth')
      return data.success ? data.data : null
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}

function useInvalidateAdminTaskQueue() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "task-queue-list"] })
    queryClient.invalidateQueries({ queryKey: queryKeys.adminTaskQueueDepth })
  }
}

export function useAdminRetryTask() {
  const invalidate = useInvalidateAdminTaskQueue()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await axios.post<TaskActionResponse>('/api/admin/tasks/retry', { task_id: taskId })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถส่ง task ใหม่ได้')
      return data
    },
    onSuccess: invalidate,
  })
}

export function useAdminCancelTask() {
  const invalidate = useInvalidateAdminTaskQueue()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await axios.post<TaskActionResponse>('/api/admin/tasks/cancel', { task_id: taskId })
      if (!data.success) throw new Error(data.message || 'ไม่สามารถยกเลิก task ได้')
      return data
    },
    onSuccess: invalidate,
  })
}
