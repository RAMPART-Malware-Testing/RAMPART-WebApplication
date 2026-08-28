export const ROLE_LABELS: Record<'user' | 'admin' | 'master', string> = {
  user: 'ผู้ใช้ทั่วไป',
  admin: 'ผู้ดูแลระบบ',
  master: 'ผู้คุมสูงสุด',
}

export function roleLabel(role: string | null | undefined): string {
  if (role === 'admin' || role === 'master') return ROLE_LABELS[role]
  return ROLE_LABELS.user
}
