'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import axios from 'axios'
import { resolveAvatarUrl, userInitials } from '@/lib/avatar'
import { roleLabel } from '@/lib/roles'
import Image from 'next/image'

const SECTION_TITLES: { prefix: string; title: string; exact?: boolean }[] = [
  { prefix: '/admin', title: 'Dashboard', exact: true },
  { prefix: '/admin/users', title: 'จัดการผู้ใช้' },
  { prefix: '/admin/admins', title: 'จัดการแอดมิน' },
  { prefix: '/admin/files', title: 'จัดการไฟล์' },
  { prefix: '/admin/reports', title: 'จัดการ Report' },
  { prefix: '/admin/audit-logs', title: 'ประวัติการจัดการ' },
]

function currentTitle(pathname: string): string {
  const match = SECTION_TITLES.find((s) => (s.exact ? pathname === s.prefix : pathname.startsWith(s.prefix)))
  return match?.title ?? 'ระบบหลังบ้าน'
}

export default function AdminTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<RampartUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    axios
      .get('/api/profile')
      .then(({ data }) => {
        if (data?.success) setUser(data.data as RampartUser)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout')
    } finally {
      router.push('/login')
    }
  }

  const avatarUrl = resolveAvatarUrl(user?.avatar_url)

  return (
    <header className="h-16 shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h2 className="text-white font-semibold text-lg leading-tight">{currentTitle(pathname)}</h2>
        <p className="text-slate-500 text-xs">RAMPART Back Office</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-3 bg-white/5 rounded-xl pl-2 pr-3 py-1.5 border border-white/10 hover:bg-white/10 transition"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden relative shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={user?.username ?? 'avatar'} fill className="object-cover" />
            ) : (
              userInitials(user?.username)
            )}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-white text-sm font-medium leading-tight">{user?.username ?? '...'}</p>
            <p className="text-slate-500 text-xs leading-tight">{roleLabel(user?.role)}</p>
          </div>
          <i className={`fas fa-chevron-down text-slate-500 text-xs transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="py-2">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-3 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
              >
                <i className="fas fa-user w-4" />
                <span>โปรไฟล์</span>
              </button>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
              >
                <i className="fas fa-right-from-bracket w-4" />
                <span className="font-medium">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
