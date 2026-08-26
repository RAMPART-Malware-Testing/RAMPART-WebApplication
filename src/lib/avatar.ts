/**
 * The backend returns `avatar_url` as a path relative to itself
 * (e.g. "/api/profile/avatar/{uid}.png"), or `null` if the user never
 * uploaded a picture. This resolves it to a URL the browser can load
 * directly from the backend.
 */
export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl
  const base = process.env.NEXT_PUBLIC_SERVER_URL || ''
  return `${base}${avatarUrl}`
}

export function userInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
