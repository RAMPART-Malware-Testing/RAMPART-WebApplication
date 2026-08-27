import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export function useAdminDashboard(trendDays: number) {
  return useQuery({
    queryKey: queryKeys.adminDashboard(trendDays),
    queryFn: async (): Promise<AdminDashboardSummary | null> => {
      const { data } = await axios.post<AdminDashboardSummaryResponse>('/api/admin/dashboard', { trend_days: trendDays })
      return data.success ? data.data : null
    },
    staleTime: 5_000,
  })
}
