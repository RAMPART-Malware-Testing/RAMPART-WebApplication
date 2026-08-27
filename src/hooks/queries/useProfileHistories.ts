import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface LoginHistoryItem {
  id: string
  provider: string | null
  ip: string | null
  user_agent: string | null
  status: string | null
  created_at: string | null
}

export interface DownloadHistoryItem {
  id: string
  file_name: string | null
  tool: string | null
  md5: string | null
  created_at: string | null
}

export function useLoginHistory() {
  return useQuery({
    queryKey: queryKeys.loginHistory,
    queryFn: async (): Promise<LoginHistoryItem[]> => {
      const { data } = await axios.post("/api/profile/login-history")
      return data?.success && Array.isArray(data.data) ? data.data : []
    },
    staleTime: 5_000,
  })
}

export function useDownloadHistory() {
  return useQuery({
    queryKey: queryKeys.downloadHistory,
    queryFn: async (): Promise<DownloadHistoryItem[]> => {
      const { data } = await axios.post("/api/profile/download-history")
      return data?.success && Array.isArray(data.data) ? data.data : []
    },
    staleTime: 5_000,
  })
}
