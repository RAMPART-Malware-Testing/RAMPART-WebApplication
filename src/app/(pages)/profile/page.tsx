'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from '@/components/GeometricLoader'
import HistoryFileComponent from '@/components/HistoryFileComponent'
import { useToast } from '@/components/ui/ToastProvider'
import { resolveAvatarUrl, userInitials } from '@/lib/avatar'
import { MAX_AVATAR_SIZE_BYTES, sniffImageMimeType } from '@/lib/image-validation'
import { roleLabel } from '@/lib/roles'

function ProfileContent() {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('m')
  const notify = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<RampartUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameValue, setUsernameValue] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (modeParam === 'report') {
      setActiveTab('upload')
    }
  }, [modeParam])

  const loadProfile = async () => {
    try {
      const { data } = await axios.get('/api/profile')
      if (data?.success) {
        setUser(data.data as RampartUser)
      }
    } catch {
      notify.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEditUsername = () => {
    setUsernameValue(user?.username ?? '')
    setEditingUsername(true)
  }

  const handleSaveUsername = async () => {
    const trimmed = usernameValue.trim()
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(trimmed)) {
      notify.warning('ชื่อผู้ใช้ต้องมี 3-50 ตัวอักษร และใช้ได้เฉพาะ a-z, 0-9, "." "_" "-" เท่านั้น')
      return
    }
    setSavingUsername(true)
    try {
      const { data } = await axios.patch('/api/profile', { username: trimmed })
      if (data?.success) {
        setUser(data.data as RampartUser)
        setEditingUsername(false)
        notify.success('อัปเดตชื่อผู้ใช้สำเร็จ')
      } else {
        notify.error(data?.message || 'ไม่สามารถอัปเดตชื่อผู้ใช้ได้')
      }
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'ไม่สามารถอัปเดตชื่อผู้ใช้ได้')
    } finally {
      setSavingUsername(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      notify.warning('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB')
      return
    }

    // Fast-fail on the actual file bytes, not just the browser-reported
    // `file.type` (which is trivially spoofable). This is only a
    // convenience check - the Next.js proxy route and the backend both
    // re-validate independently, since a client can never be trusted.
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    if (!sniffImageMimeType(header)) {
      notify.warning('ไฟล์ที่เลือกไม่ใช่รูปภาพที่รองรับ (PNG, JPEG, WEBP)')
      return
    }

    setUploadingAvatar(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await axios.post('/api/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data?.success) {
        setUser(data.data as RampartUser)
        notify.success('อัปเดตรูปโปรไฟล์สำเร็จ')
      } else {
        notify.error(data?.message || 'ไม่สามารถอัปเดตรูปโปรไฟล์ได้')
      }
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'ไม่สามารถอัปเดตรูปโปรไฟล์ได้')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: 'fas fa-user' },
    { id: 'upload', label: 'ไฟล์ของฉัน', icon: 'fas fa-upload' },
  ]

  if (isLoading) {
    return <GeometricLoader />
  }

  const avatarUrl = resolveAvatarUrl(user?.avatar_url)

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <NavbarComponent />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">โปรไฟล์ของฉัน</h1>
          <p className="text-slate-400">จัดการข้อมูลส่วนตัวและดูประวัติกิจกรรมของคุณ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="relative h-24 bg-gradient-to-r from-cyan-500 to-blue-600">
                <div className="absolute -bottom-12 left-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="group relative w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-4 border-slate-900 shadow-xl overflow-hidden"
                    title="อัปโหลดรูปโปรไฟล์"
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={user?.username ?? 'avatar'} fill className="object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{userInitials(user?.username)}</span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploadingAvatar ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <i className="fas fa-camera text-white" />
                      )}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="pt-14 pb-6 px-6">
                <h2 className="text-white font-bold text-xl">{user?.username}</h2>
                <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-medium border border-cyan-500/20">
                    {roleLabel(user?.role)}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">เข้าร่วมเมื่อ</span>
                  <span className="text-white text-sm font-medium">
                    {formatDate(user?.created_at ?? null)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-bolt text-amber-400" />
                การดำเนินการด่วน
              </h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="w-full group flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  <i className="fas fa-tachometer-alt text-blue-400"></i>
                  <span className="text-white flex-1 text-left">ไปที่ Dashboard</span>
                  <i className="fas fa-chevron-right text-slate-400 text-sm group-hover:translate-x-1 transition-transform"></i>
                </Link>
                <Link
                  href="/reports"
                  className="w-full group flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  <i className="fas fa-folder text-emerald-400"></i>
                  <span className="text-white flex-1 text-left">ไฟล์ทั้งหมด</span>
                  <i className="fas fa-chevron-right text-slate-400 text-sm group-hover:translate-x-1 transition-transform"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Tabs */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-6 overflow-x-auto">
              <div className="flex p-1 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <i className={tab.icon}></i>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid gap-6">
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <i className="fas fa-id-card text-cyan-400"></i>
                        <span>ข้อมูลบัญชีผู้ใช้</span>
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-400 text-sm mb-2">ชื่อผู้ใช้</label>
                          <div className="flex items-center gap-3">
                            {editingUsername ? (
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={usernameValue}
                                  onChange={(e) => setUsernameValue(e.target.value)}
                                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                  autoFocus
                                  minLength={3}
                                  maxLength={50}
                                  pattern="[a-zA-Z0-9_.-]{3,50}"
                                  title="3-50 ตัวอักษร: a-z, A-Z, 0-9, '.', '_', '-' เท่านั้น"
                                />
                                <button
                                  onClick={handleSaveUsername}
                                  disabled={savingUsername}
                                  className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition disabled:opacity-50"
                                >
                                  {savingUsername ? (
                                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <i className="fas fa-check"></i>
                                  )}
                                </button>
                                <button onClick={() => setEditingUsername(false)} className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition">
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={user?.username || ''}
                                  readOnly
                                  className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white cursor-default"
                                />
                                <button onClick={handleEditUsername} className="p-2.5 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition">
                                  <i className="fas fa-pen"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 text-sm mb-2">อีเมล</label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white cursor-default"
                          />
                          <p className="text-xs text-slate-500 mt-1.5">
                            <i className="fas fa-lock mr-1" />
                            อีเมลผูกกับบัญชี Google/GitHub ของคุณ ไม่สามารถแก้ไขได้โดยตรง
                          </p>
                        </div>

                        <div>
                          <label className="block text-slate-400 text-sm mb-2">บทบาท</label>
                          <input
                            type="text"
                            value={roleLabel(user?.role)}
                            readOnly
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white cursor-default"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <i className="fas fa-shield-alt text-emerald-400"></i>
                        <span>ความปลอดภัย</span>
                      </h4>
                      <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <i className="fab fa-google text-red-400"></i>
                          <i className="fab fa-github text-white"></i>
                          <span className="text-white">เข้าสู่ระบบด้วย Google / GitHub</span>
                        </div>
                        <span className="text-emerald-400 text-sm">
                          <i className="fas fa-check-circle mr-1" />
                          เปิดใช้งานอยู่
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload History Tab */}
              {activeTab === 'upload' && (
                <HistoryFileComponent />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<GeometricLoader />}>
      <ProfileContent />
    </Suspense>
  )
}
