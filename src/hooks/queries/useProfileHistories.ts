import { keepPreviousData, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export const HISTORY_PAGE_SIZE = 25

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

export interface PasswordHistoryItem {
  id: string
  ip: string | null
  user_agent: string | null
  created_at: string | null
}

type HistoryResult<T> = { data: T[]; pagination: AnalysisHistoryPagination | null }

function useHistoryQuery<T>(key: readonly unknown[], endpoint: string, page: number, limit: number) {
  return useQuery({
    queryKey: [...key, page, limit],
    queryFn: async (): Promise<HistoryResult<T>> => {
      const { data } = await axios.post(endpoint, { page, limit })
      if (!data?.success || !Array.isArray(data.data)) return { data: [], pagination: null }
      return { data: data.data, pagination: data.pagination ?? null }
    },
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  })
}

export function useLoginHistory(page = 1, limit = HISTORY_PAGE_SIZE) {
  return useHistoryQuery<LoginHistoryItem>([...queryKeys.loginHistory], "/api/profile/login-history", page, limit)
}

export function useDownloadHistory(page = 1, limit = HISTORY_PAGE_SIZE) {
  return useHistoryQuery<DownloadHistoryItem>([...queryKeys.downloadHistory], "/api/profile/download-history", page, limit)
}

export function usePasswordHistory(page = 1, limit = HISTORY_PAGE_SIZE) {
  return useHistoryQuery<PasswordHistoryItem>([...queryKeys.passwordHistory], "/api/profile/password-history", page, limit)
}
