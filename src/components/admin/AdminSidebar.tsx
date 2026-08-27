'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
  /** Exact match required (only Dashboard uses this, since every other
   * admin route is a prefix of /admin). */
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'fas fa-gauge-high', exact: true },
  { href: '/admin/users', label: 'จัดการผู้ใช้', icon: 'fas fa-users' },
  { href: '/admin/admins', label: 'จัดการแอดมิน', icon: 'fas fa-user-shield' },
  { href: '/admin/files', label: 'จัดการไฟล์', icon: 'fas fa-folder-tree' },
  { href: '/admin/reports', label: 'จัดการ Report', icon: 'fas fa-file-contract' },
  { href: '/admin/audit-logs', label: 'ประวัติการจัดการ', icon: 'fas fa-clipboard-list' },
  { href: '/admin/system-health', label: 'สถานะระบบ', icon: 'fas fa-heart-pulse' },
  { href: '/admin/task-queue', label: 'คิวงานวิเคราะห์', icon: 'fas fa-list-check' },
  { href: '/admin/rate-limits', label: 'ตรวจจับการใช้งานผิดปกติ', icon: 'fas fa-shield-halved' },
  { href: '/admin/broadcast', label: 'ส่งอีเมลประกาศ', icon: 'fas fa-bullhorn' },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
}

export default function AdminSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname()

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-950/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
          <i className="fas fa-shield-halved text-white text-sm" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">RAMPART</p>
            <p className="text-slate-500 text-xs truncate">ระบบหลังบ้าน</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <i className={`${item.icon} w-4 text-center shrink-0`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
        <Link
          href="/dashboard"
          title={collapsed ? 'กลับสู่หน้าหลัก' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <i className="fas fa-arrow-left w-4 text-center shrink-0" />
          {!collapsed && <span>กลับสู่หน้าหลัก</span>}
        </Link>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <i className={`fas ${collapsed ? 'fa-angles-right' : 'fa-angles-left'} w-4 text-center shrink-0`} />
          {!collapsed && <span>ย่อเมนู</span>}
        </button>
      </div>
    </aside>
  )
}
