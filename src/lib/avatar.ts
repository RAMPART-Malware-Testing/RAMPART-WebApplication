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
