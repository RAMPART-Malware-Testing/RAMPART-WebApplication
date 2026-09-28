export const HISTORY_PAGE_SIZE = 25
export const HISTORY_MAX_LIMIT = 100

export function readHistoryPage(body: { page?: unknown; limit?: unknown }): { page: number; limit: number } {
  const rawPage = Number(body?.page)
  const rawLimit = Number(body?.limit)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), HISTORY_MAX_LIMIT)
      : HISTORY_PAGE_SIZE
  return { page, limit }
}
