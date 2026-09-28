import { useCallback, useEffect, useState } from "react"
import { useProfile } from "./queries/useProfile"
import { getViewedTaskIds, markTaskViewed } from "@/lib/readState"

export function useViewedTasks() {
  const { data: profile } = useProfile()
  const uid = profile?.uid
  const [viewed, setViewed] = useState<Set<string> | null>(null)

  useEffect(() => {
    setViewed(new Set(uid ? getViewedTaskIds(uid) : []))
  }, [uid])

  const markViewed = useCallback(
    (taskId: string | null | undefined) => {
      if (!uid || !taskId) return
      markTaskViewed(uid, taskId)
      setViewed((prev) => {
        if (prev?.has(taskId)) return prev
        const next = new Set(prev ?? [])
        next.add(taskId)
        return next
      })
    },
    [uid],
  )

  return { viewed, markViewed }
}
