export type ReadScope = 'reports'

const storageKey = (uid: string, scope: ReadScope) => `rampart:seen:${scope}:${uid}`

function writeCursor(uid: string, scope: ReadScope, at: string): void {
  try {
    window.localStorage.setItem(storageKey(uid, scope), at)
  } catch {
    return
  }
}

export function getCursor(uid: string, scope: ReadScope): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(storageKey(uid, scope))
    if (stored) return stored
  } catch {
    return null
  }
  const now = new Date().toISOString()
  writeCursor(uid, scope, now)
  return now
}

export function markSeen(uid: string, scope: ReadScope): void {
  if (typeof window === 'undefined') return
  writeCursor(uid, scope, new Date().toISOString())
}

const MAX_TRACKED_TASKS = 200

const viewedKey = (uid: string) => `rampart:viewed:reports:${uid}`

export function getViewedTaskIds(uid: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(viewedKey(uid))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function markTaskViewed(uid: string, taskId: string): void {
  if (typeof window === 'undefined' || !taskId) return
  try {
    const current = getViewedTaskIds(uid).filter((id) => id !== taskId)
    current.push(taskId)
    const trimmed = current.slice(-MAX_TRACKED_TASKS)
    window.localStorage.setItem(viewedKey(uid), JSON.stringify(trimmed))
  } catch {
    return
  }
}
