'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

const COLLAPSE_STORAGE_KEY = 'rampart-admin-sidebar-collapsed'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar collapsed={mounted && collapsed} onToggle={toggle} />
      <div className={`transition-all duration-300 ${mounted && collapsed ? 'pl-[76px]' : 'pl-64'}`}>
        <AdminTopbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
