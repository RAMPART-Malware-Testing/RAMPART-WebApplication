import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface ToolProgress { status?: unknown; score?: number }
export interface TaskProgress { stage?: string; message?: string; tools?: Record<string, ToolProgress> }
export interface TaskPoll {
  success: boolean
  task_id: string
  status?: string
  message?: string
  progress?: TaskProgress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report?: any
}

/** Polls GET /api/task_id/{taskId} - the live analysis-status endpoint.
 * The backend itself now caches this DB read for 3s
 * (controller.analysis_controller._compute_analysis_report), so with
 * refetchInterval at 2.5s, concurrent viewers/admins on the same task_id
 * mostly hit that server-side cache instead of Postgres on every poll.
 * Polling stops automatically once the task reaches a terminal state. */
export function useTaskStatus(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.taskStatus(taskId),
    queryFn: async (): Promise<TaskPoll> => {
      const { data } = await axios.get<TaskPoll>(`/api/task_id/${taskId}`, { timeout: 8000 })
      return data
    },
    enabled: !!taskId && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2500
      if (data.success === false && !data.status) return false
      if (data.status === "failed" || data.status === "success") return false
      return 2500
    },
    retry: false,
    staleTime: 0,
  })
}
