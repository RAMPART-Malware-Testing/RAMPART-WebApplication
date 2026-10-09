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
  useAdminBulkBanUsers,
  useAdminCreateUser,
  useAdminDeleteUser,
  useAdminResetUserPassword,
  exportAdminUsersCsv,
} from '@/hooks/queries/useAdminUsers'

const ROLE_BADGE: Record<string, string> = {
  user: 'text-blue-300 bg-blue-500/10 border border-blue-500/20',
  admin: 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20',
  master: 'text-purple-300 bg-purple-500/10 border border-purple-500/20',
}

const EMAIL_PATTERN = /^[^\s@+]+@[^\s@]+\.[^\s@]+$/

const EMPTY_CREATE_FORM = { username: '', email: '', password: '', role: 'user' as 'user' | 'admin' }

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [bannedFilter, setBannedFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'deleted' | 'all'>('active')
  const [roleFilter, setRoleFilter] = useState<'all' | 'master' | 'user' | 'admin'>('all')
  const [page, setPage] = useState(1)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM)
  const [createError, setCreateError] = useState('')
  const notify = useToast()

  const { data: profile } = useProfile()
  const actorRole = profile?.role
  const isMaster = actorRole === 'master'
  const canBanTarget = (targetRole: AdminUserListItem['role']) =>
    targetRole !== 'master' && (isMaster || (actorRole === 'admin' && targetRole === 'user'))
  const canManageTarget = (targetRole: AdminUserListItem['role']) =>
    targetRole !== 'master' && (isMaster || (actorRole === 'admin' && targetRole === 'user'))

  const { data: listResult, isLoading } = useAdminUsersList({
    page,
    limit: 20,
    role: roleFilter === 'all' ? undefined : roleFilter,
    q: search || undefined,
    banned: bannedFilter !== 'all' ? bannedFilter === 'banned' : undefined,
    status: statusFilter,
  })
  const items = listResult?.data ?? []
  const manageableItems = items.filter((user) => canBanTarget(user.role) && user.status !== 'deleted')
  const pagination = listResult?.pagination ?? null

  const banMutation = useAdminBanUser()
  const unbanMutation = useAdminUnbanUser()
  const bulkBanMutation = useAdminBulkBanUsers()
  const createUserMutation = useAdminCreateUser()
  const deleteUserMutation = useAdminDeleteUser()
  const resetPasswordMutation = useAdminResetUserPassword()
  const isBulkBusy = bulkBanMutation.isPending

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [search, bannedFilter, roleFilter, statusFilter])

  const toggleSelect = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => (prev.size === manageableItems.length ? new Set() : new Set(manageableItems.map((u) => u.uid))))
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

  const handleResetPassword = async (user: AdminUserListItem) => {
    const { value, isConfirmed } = await Swal.fire({
      title: `ตั้งรหัสผ่านใหม่ให้ ${user.username}`,
      html: '<p style="text-align:left;color:#cbd5e1;font-size:13px">ต้องมี 8–128 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ</p>',
      input: 'password',
      inputPlaceholder: 'รหัสผ่านใหม่',
      showCancelButton: true,
      confirmButtonText: 'บันทึกรหัสผ่าน',
      cancelButtonText: 'ยกเลิก',
      background: '#0f172a',
      color: '#fff',
      inputValidator: (password) => {
        if (!password || password.length < 8 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          return 'รหัสผ่านไม่ตรงตามนโยบาย'
        }
        return undefined
      },
    })
    if (!isConfirmed || !value) return
    setBusyUid(user.uid)
    try {
      await resetPasswordMutation.mutateAsync({ uid: user.uid, newPassword: value })
      notify.success('ตั้งรหัสผ่านสำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถตั้งรหัสผ่านได้')
    } finally {
      setBusyUid(null)
    }
  }

  const handleDelete = async (user: AdminUserListItem) => {
    const confirm = await Swal.fire({
      title: `ลบบัญชี ${user.username}?`,
      text: 'บัญชีจะเข้าสถานะถูกลบและไม่สามารถเข้าสู่ระบบได้ ข้อมูลประวัติจะถูกเก็บไว้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบบัญชี',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      background: '#0f172a',
      color: '#fff',
    })
    if (!confirm.isConfirmed) return
    setBusyUid(user.uid)
    try {
      await deleteUserMutation.mutateAsync(user.uid)
      notify.success('ลบบัญชีสำเร็จ')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'ไม่สามารถลบบัญชีได้')
    } finally {
      setBusyUid(null)
    }
  }

  const openCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM)
    setCreateError('')
    setCreateOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const username = createForm.username.trim()
    const email = createForm.email.trim()
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
      setCreateError('ชื่อผู้ใช้ต้องมี 3–50 ตัวอักษร ใช้ภาษาอังกฤษ ตัวเลข จุด ขีดล่าง หรือขีดกลาง')
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      setCreateError('รูปแบบอีเมลไม่ถูกต้อง')
      return
    }
    if (createForm.password.length < 8 || createForm.password.length > 128 ||
        !/[A-Z]/.test(createForm.password) || !/[a-z]/.test(createForm.password) ||
        !/[0-9]/.test(createForm.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(createForm.password)) {
      setCreateError('รหัสผ่านต้องมี 8–128 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ')
      return
    }
    setCreateError('')
    try {
      await createUserMutation.mutateAsync({ username, email, password: createForm.password, role: createForm.role })
      setCreateOpen(false)
      setCreateForm(EMPTY_CREATE_FORM)
      Swal.fire({
        icon: 'success',
        title: 'สร้างบัญชีสำเร็จ',
        text: `สร้างบัญชี ${username} แล้ว`,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#0891b2',
      })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'ไม่สามารถสร้างบัญชีได้')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">จัดการผู้ใช้งาน</h1>
            <p className="text-blue-200/50 text-sm mt-1">
              รายชื่อผู้ใช้งานทั้งหมด — สร้างบัญชี / แบน / ปลดแบน
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isMaster && (
              <button
                onClick={openCreateDialog}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition"
              >
                <i className="fas fa-user-plus mr-2" />
                สร้างบัญชี
              </button>
            )}
            <button
              disabled={isExporting}
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition disabled:opacity-40"
            >
              <i className="fas fa-file-csv mr-2" />
              Export CSV
            </button>
          </div>
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="lg:order-2 lg:sticky lg:top-20 bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <i className="fas fa-filter text-cyan-400" />
            ตัวกรอง
          </h3>
          <div className="grid grid-cols-1 gap-4">
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
              <label className="block text-sm text-blue-200/60 mb-2">สิทธิ์</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'master' | 'user' | 'admin')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="all" className="bg-slate-800">ทั้งหมด</option>
                <option value="master" className="bg-slate-800">มาสเตอร์</option>
                <option value="admin" className="bg-slate-800">ผู้ดูแล</option>
                <option value="user" className="bg-slate-800">ผู้ใช้</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">สถานะแบน</label>
              <select
                value={bannedFilter}
                onChange={(e) => setBannedFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="all" className="bg-slate-800">ทั้งหมด</option>
                <option value="banned" className="bg-slate-800">ถูกแบน</option>
                <option value="active" className="bg-slate-800">ไม่ถูกแบน</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-blue-200/60 mb-2">สถานะบัญชี</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'active' | 'deleted' | 'all')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              >
                <option value="active" className="bg-slate-800">ใช้งานอยู่</option>
                <option value="deleted" className="bg-slate-800">ถูกลบ</option>
                <option value="all" className="bg-slate-800">ทุกสถานะ</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:order-1 bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {manageableItems.length > 0 && (
                <input
                  type="checkbox"
                  checked={selected.size === manageableItems.length}
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
                    {canBanTarget(user.role) && (
                      <input
                        type="checkbox"
                        checked={selected.has(user.uid)}
                        onChange={() => toggleSelect(user.uid)}
                        className="accent-cyan-500 w-4 h-4 shrink-0"
                      />
                    )}
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
                        {user.status === 'deleted' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-slate-300 bg-slate-500/10 border border-slate-500/20">
                            ถูกลบ
                          </span>
                        )}
                      </div>
                      <p className="text-blue-200/50 text-sm truncate">{user.email}</p>
                    </div>
                  </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canManageTarget(user.role) && user.status !== 'deleted' && (
                      <>
                        <button
                          disabled={busyUid === user.uid}
                          onClick={() => handleResetPassword(user)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition disabled:opacity-40"
                        >
                          ตั้งรหัสผ่าน
                        </button>
                        <button
                          disabled={busyUid === user.uid}
                          onClick={() => handleDelete(user)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition disabled:opacity-40"
                        >
                          ลบบัญชี
                        </button>
                      </>
                    )}
                    {canBanTarget(user.role) && user.status !== 'deleted' && (user.is_banned ? (
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && (
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

      {createOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setCreateOpen(false)}>
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <i className="fas fa-user-plus text-cyan-400"></i>
                สร้างบัญชี
              </h3>
              <p className="text-slate-400 text-sm mt-1">เพิ่มผู้ใช้หรือผู้ดูแลระบบใหม่เข้าสู่ระบบ</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                  placeholder="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">อีเมล</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                  placeholder="rampart@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">รหัสผ่าน</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">รหัสผ่านต้องมี 8–128 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">สิทธิ์</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition"
                >
                  <option value="user" className="bg-slate-800">ผู้ใช้</option>
                  <option value="admin" className="bg-slate-800">ผู้ดูแล</option>
                </select>
              </div>

              {createError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                  <i className="fas fa-exclamation-circle mt-0.5"></i>
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition disabled:opacity-40"
                >
                  {createUserMutation.isPending ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
