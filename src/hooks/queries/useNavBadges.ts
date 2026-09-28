import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"
import { useProfile } from "./useProfile"
import { getCursor, markSeen, type ReadScope } from "@/lib/readState"

export interface NavBadgeCounts {
  reports: number
  public: number
}

const EMPTY_COUNTS: NavBadgeCounts = { reports: 0, public: 0 }
const POLL_INTERVAL_MS = 60_000

export function useNavBadges() {
  const { data: profile } = useProfile()
  const uid = profile?.uid

  return useQuery({
    queryKey: queryKeys.navBadges(uid ?? ""),
    enabled: Boolean(uid),
    queryFn: async (): Promise<NavBadgeCounts> => {
      const owner = uid as string
      const { data } = await axios.post("/api/profile/notifications", {
        reports_since: getCursor(owner, "reports"),
        public_since: getCursor(owner, "public"),
      })
      const counts = data?.data
      if (!counts) return EMPTY_COUNTS
      return { reports: Number(counts.reports) || 0, public: Number(counts.public) || 0 }
    },
    staleTime: 30_000,
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? POLL_INTERVAL_MS
        : false,
    refetchOnWindowFocus: true,
  })
}

export function useMarkSeen(scope: ReadScope) {
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const uid = profile?.uid

  useEffect(() => {
    if (!uid) return
    markSeen(uid, scope)
    queryClient.invalidateQueries({ queryKey: queryKeys.navBadges(uid) })
  }, [uid, scope, queryClient])
}
