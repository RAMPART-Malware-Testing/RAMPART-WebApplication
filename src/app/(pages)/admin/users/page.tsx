'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { useToast } from '@/components/ui/ToastProvider'
import { ROLE_LABELS } from '@/lib/roles'
import { useProfile } from '@/hooks/queries/useProfile'
import {
  useAdminUsersList,
  useAdminBanUser,
  useAdminUnbanUser,
  useAdminChangeRole,
  useAdminBulkBanUsers,
  exportAdminUsersCsv,
} from '@/hooks/queries/useAdminUsers'

const ROLE_BADGE: Record<string, string> = {
  user: 'text-blue-300 bg-blue-500/10 border border-blue-500/20',
  admin: 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20',
  master: 'text-purple-300 bg-purple-500/10 border border-purple-500/20',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [bannedFilter, setBannedFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const notify = useToast()

  // Role-change is master-only, and an admin viewer can never act on
  // another admin - hide those buttons entirely rather than showing them
  // and letting every click fail server-side. UX nicety only; the
  // backend (services/admin/authz.py::ensure_can_manage_target) enforces
  // the real rule regardless of what this component decides to render.
  const { data: profile } = useProfile()
  const isMaster = profile?.role === 'master'

  // This page is fixed to plain "user" rows only - /admin/admins is
  // the dedicated view for admin/master accounts.
  const { data: listResult, isLoading } = useAdminUsersList({
    page,
    limit: 20,
    role: 'user',
    q: search || undefined,
    banned: bannedFilter !== 'all' ? bannedFilter === 'banned' : undefined,
  })
  const items = listResult?.data ?? []
  const pagination = listResult?.pagination ?? null

  const banMutation = useAdminBanUser()
  const unbanMutation = useAdminUnbanUser()
  const roleMutation = useAdminChangeRole()
  const bulkBanMutation = useAdminBulkBanUsers()
  const isBulkBusy = bulkBanMutation.isPending

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [search, bannedFilter])

  const toggleSelect = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((u) => u.uid))))
  }

  const handleBulkBan = async () => {
    if (selected.size === 0) return
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `แบนผู้ใช้ ${selected.size} คน?`,
      input: 'textarea',
      inputLabel: 'เหตุผลในการแบน (จำเป็น)',
      showCancelButton: true,
      confirmButtonText: 'แบนทั้งหมด',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      background: '#0f172a',
      color: '#fff',
      inputValidator: (value) => (!value?.trim() ? 'กรุณาระบุเหตุผล' : undefined),
    })
    if (!isConfirmed || !reason) return

    try {
      const result = await bulkBanMutation.mutateAsync({ uids: Array.from(selected), reason: reason.trim() })
      notify.success(`แบนสำเร็จ ${result.succeeded.length} คน${result.failed.length ? `, ล้มเหลว ${result.failed.length} คน` : ''}`)
      setSelected(new Set())
    } catch {
      notify.error('ไม่สามารถแบนได้')
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportAdminUsersCsv()
    } catch {
      notify.error('ไม่สามารถ export ได้')
    } finally {
      setIsExporting(false)
    }
  }

  const handleBan = async (user: AdminUserListItem) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `แบนผู้ใช้ ${user.username}?`,
      input: 'textarea',
      inputLabel: 'เหตุผลในการแบน (จำเป็น)',
      inputPlaceholder: 'ระบุเหตุผล เช่น กระทำผิดกฎหมาย, อัปโหลดไฟล์อันตราย ฯลฯ',
      showCancelButton: true,
      confirmButtonText: 'แบน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      background: '#0f172a',
      color: '#fff',
      inputValidator: (value) => (!value?.trim() ? 'กรุณาระบุเหตุผล' : undefined),
    })
    if (!isConfirmed || !reason) return

    setBusyUid(user.uid)
    try {
      await banMutation.mutateAsync({ uid: user.uid, reason: reason.trim() })
      notify.success('แบนผู้ใช้สำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถแบนผู้ใช้ได้')
    } finally {
      setBusyUid(null)
    }
  }

  const handleUnban = async (user: AdminUserListItem) => {
    const confirm = await Swal.fire({
      title: `ปลดแบนผู้ใช้ ${user.username}?`,
      showCancelButton: true,
      confirmButtonText: 'ปลดแบน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#16a34a',
      background: '#0f172a',
      color: '#fff',
    })
    if (!confirm.isConfirmed) return

    setBusyUid(user.uid)
    try {
      await unbanMutation.mutateAsync(user.uid)
      notify.success('ปลดแบนผู้ใช้สำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถปลดแบนผู้ใช้ได้')
    } finally {
      setBusyUid(null)
    }
  }

  const handleRoleChange = async (user: AdminUserListItem, newRole: 'user' | 'admin') => {
    const confirm = await Swal.fire({
      title: `เปลี่ยนสิทธิ์ของ ${user.username} เป็น ${ROLE_LABELS[newRole]}?`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#0891b2',
      background: '#0f172a',
      color: '#fff',
    })
    if (!confirm.isConfirmed) return

    setBusyUid(user.uid)
    try {
      await roleMutation.mutateAsync({ uid: user.uid, newRole })
      notify.success('เปลี่ยนสิทธิ์สำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนสิทธิ์ได้')
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">จัดการผู้ใช้งาน</h1>
            <p className="text-blue-200/50 text-sm mt-1">
              รายชื่อสมาชิกทั่วไป — แบน / ปลดแบน / เลื่อนขึ้นเป็นผู้ดูแลระบบ (เฉพาะ master)
            </p>
          </div>
          <button
            disabled={isExporting}
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition disabled:opacity-40"
          >
            <i className="fas fa-file-csv mr-2" />
            Export CSV
          </button>
        </div>

        {selected.size > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <span className="text-red-300 text-sm font-medium">เลือกแล้ว {selected.size} คน</span>
            <div className="flex gap-2">
              <button
                disabled={isBulkBusy}
                onClick={handleBulkBan}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition text-sm disabled:opacity-40"
              >
                แบนที่เลือกทั้งหมด
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
              >
                ยกเลิกการเลือก
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">ค้นหา</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">สถานะ</label>
              <select
                value={bannedFilter}
                onChange={(e) => setBannedFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="all" className="bg-slate-800">ทั้งหมด</option>
                <option value="active" className="bg-slate-800">ใช้งานได้</option>
                <option value="banned" className="bg-slate-800">ถูกแบน</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {items.length > 0 && (
                <input
                  type="checkbox"
                  checked={selected.size === items.length}
                  onChange={toggleSelectAll}
                  className="accent-cyan-500 w-4 h-4"
                />
              )}
              <h2 className="text-white font-semibold text-lg">รายชื่อผู้ใช้</h2>
            </div>
            {pagination && <span className="text-blue-200/50 text-sm">ทั้งหมด {pagination.total} คน</span>}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-white font-medium mb-1">ไม่พบผู้ใช้</p>
              <p className="text-blue-200/50 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((user) => (
                <div
                  key={user.uid}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(user.uid)}
                      onChange={() => toggleSelect(user.uid)}
                      className="accent-cyan-500 w-4 h-4 shrink-0"
                    />
                  <Link href={`/admin/users/${user.uid}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                    <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-white font-medium group-hover:text-cyan-300 transition">{user.username}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                        {user.is_banned && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20">
                            ถูกแบน
                          </span>
                        )}
                      </div>
                      <p className="text-blue-200/50 text-sm truncate">{user.email}</p>
                    </div>
                  </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {user.is_banned ? (
                      <button
                        disabled={busyUid === user.uid}
                        onClick={() => handleUnban(user)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition disabled:opacity-40"
                      >
                        ปลดแบน
                      </button>
                    ) : (
                      <button
                        disabled={busyUid === user.uid}
                        onClick={() => handleBan(user)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-40"
                      >
                        แบน
                      </button>
                    )}
                    {isMaster && (
                      <button
                        disabled={busyUid === user.uid}
                        onClick={() => handleRoleChange(user, 'admin')}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition disabled:opacity-40"
                      >
                        ตั้งเป็นผู้ดูแล
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
              <button
                disabled={!pagination.has_prev}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
              >
                ← ก่อนหน้า
              </button>
              <span className="text-blue-200/50 text-sm">
                หน้า {pagination.page} / {pagination.total_pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </div>
    </div>
  )
}
