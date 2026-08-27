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
} from '@/hooks/queries/useAdminUsers'

const ROLE_BADGE: Record<string, string> = {
  admin: 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20',
  master: 'text-purple-300 bg-purple-500/10 border border-purple-500/20',
}

export default function AdminAdminsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const notify = useToast()

  // Ban and demote actions on this page are master-only (an admin
  // viewer cannot act on another admin/master at all, per
  // ensure_can_manage_target on the backend) - hide the buttons for a
  // non-master viewer rather than showing them and letting every click
  // fail server-side.
  const { data: profile } = useProfile()
  const isMaster = profile?.role === 'master'

  const { data: listResult, isLoading } = useAdminUsersList({
    page,
    limit: 20,
    role: ['admin', 'master'],
    q: search || undefined,
  })
  const items = listResult?.data ?? []
  const pagination = listResult?.pagination ?? null

  const banMutation = useAdminBanUser()
  const unbanMutation = useAdminUnbanUser()
  const roleMutation = useAdminChangeRole()

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleBan = async (user: AdminUserListItem) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `แบนผู้ดูแล ${user.username}?`,
      input: 'textarea',
      inputLabel: 'เหตุผลในการแบน (จำเป็น)',
      inputPlaceholder: 'ระบุเหตุผล',
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
      notify.success('แบนผู้ดูแลสำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถแบนผู้ดูแลได้')
    } finally {
      setBusyUid(null)
    }
  }

  const handleUnban = async (user: AdminUserListItem) => {
    const confirm = await Swal.fire({
      title: `ปลดแบนผู้ดูแล ${user.username}?`,
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
      notify.success('ปลดแบนผู้ดูแลสำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถปลดแบนผู้ดูแลได้')
    } finally {
      setBusyUid(null)
    }
  }

  const handleDemote = async (user: AdminUserListItem) => {
    const confirm = await Swal.fire({
      title: `ถอดสิทธิ์ผู้ดูแล ${user.username}?`,
      text: 'ผู้ใช้จะกลับไปเป็นสมาชิกทั่วไป',
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
      await roleMutation.mutateAsync({ uid: user.uid, newRole: 'user' })
      notify.success('ถอดสิทธิ์ผู้ดูแลสำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถถอดสิทธิ์ได้')
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">จัดการแอดมิน</h1>
        <p className="text-blue-200/50 text-sm mt-1">
          รายชื่อผู้ดูแลระบบและผู้คุมสูงสุด — เฉพาะ master เท่านั้นที่แบน/ถอดสิทธิ์ได้ (admin แตะต้องกันเองไม่ได้)
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <label className="block text-sm text-blue-200/60 mb-2">ค้นหา</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล..."
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
        />
      </div>

      {/* List */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">รายชื่อผู้ดูแล</h2>
          {pagination && <span className="text-blue-200/50 text-sm">ทั้งหมด {pagination.total} คน</span>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-white font-medium mb-1">ไม่พบผู้ดูแล</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((user) => (
              <div
                key={user.uid}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <Link href={`/admin/users/${user.uid}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                  <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-white font-medium group-hover:text-cyan-300 transition">{user.username}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                        {ROLE_LABELS[user.role as 'admin' | 'master']}
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

                {/* master role can never be managed by anyone, and only
                    master can manage admins - hide all buttons for master
                    rows, and hide all buttons for a non-master viewer. */}
                {isMaster && user.role === 'admin' && (
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
                    <button
                      disabled={busyUid === user.uid}
                      onClick={() => handleDemote(user)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-blue-200/70 border border-white/10 hover:bg-white/10 transition disabled:opacity-40"
                    >
                      ถอดสิทธิ์ผู้ดูแล
                    </button>
                  </div>
                )}
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
