'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from "@/components/GeometricLoader";
import { useProfile, useUpdateUsername, useUpdateAvatar } from '@/hooks/queries/useProfile'
import { useLoginHistory, useDownloadHistory } from '@/hooks/queries/useProfileHistories'
import { useAnalysisHistory } from '@/hooks/queries/useAnalysisHistory'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

const USERNAME_RE = /^[a-zA-Z0-9_.\-\u0E00-\u0E7F]{3,50}$/
const USERNAME_ERROR_MESSAGE =
  "ชื่อผู้ใช้ต้องมีความยาว 3-50 ตัวอักษร และใช้ได้เฉพาะตัวอักษรไทย ตัวอักษรอังกฤษ ตัวเลข '.', '_' และ '-' เท่านั้น"

interface UserProfile {
  username: string
  email: string
  role: string
  joinDate: string
  lastLogin: string
  avatar?: string
}

interface LoginHistory {
  id: string
  timestamp: string
  ipAddress: string
  location: string
  device: string
  status: 'success' | 'failed'
}

interface UploadHistory {
  id: string
  fileName: string
  fileType: string
  timestamp: string
  status: 'completed' | 'analyzing' | 'failed'
  riskScore?: number
}

interface DownloadHistory {
  id: string
  fileName: string
  reportType: string
  timestamp: string
  fileSize: number
}

function ProfileContent() {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('m')

  const [activeTab, setActiveTab] = useState('profile')
  const { data: profileData, isLoading: profileLoading } = useProfile()
  const { data: rawLoginHistory = [], isLoading: loginLoading } = useLoginHistory()
  const { data: uploadHistoryResult, isLoading: uploadLoading } = useAnalysisHistory({ page: 1, limit: 50 })
  const rawUploadHistory = uploadHistoryResult?.data ?? []
  const { data: rawDownloadHistory = [], isLoading: downloadLoading } = useDownloadHistory()
  const updateUsername = useUpdateUsername()
  const updateAvatar = useUpdateAvatar()

  const user: UserProfile | null = profileData
    ? {
        username: profileData.username || 'ผู้ใช้',
        email: profileData.email || '',
        role: profileData.role || 'user',
        joinDate: profileData.created_at || '',
        lastLogin: profileData.created_at || '',
        avatar: profileData.avatar_url || undefined,
      }
    : null

  const loginHistory: LoginHistory[] = rawLoginHistory.map((it) => ({
    id: it.id,
    timestamp: it.created_at || '',
    ipAddress: it.ip || '—',
    location: it.provider ? it.provider.replace(/^\w/, (c: string) => c.toUpperCase()) : '—',
    device: it.user_agent || it.provider || '—',
    status: it.status === 'success' ? 'success' as const : 'failed' as const,
  }))

  const uploadHistory: UploadHistory[] = rawUploadHistory.map((it) => ({
    id: it.task_id || String(it.aid),
    fileName: it.file_name || '-',
    fileType: it.file_type || 'file',
    timestamp: it.created_at || '',
    status: it.status === 'success' ? 'completed' as const : it.status === 'failed' ? 'failed' as const : 'analyzing' as const,
    riskScore: it.report?.score != null ? Math.round(it.report.score) : undefined,
  }))

  const downloadHistory: DownloadHistory[] = rawDownloadHistory.map((it) => ({
    id: it.id,
    fileName: it.file_name || it.md5 || '-',
    reportType: it.tool || 'report',
    timestamp: it.created_at || '',
    fileSize: 0,
  }))

  const isLoading = profileLoading || loginLoading || uploadLoading || downloadLoading
  const [changePasswordDialog, setChangePasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const uploadingAvatar = updateAvatar.isPending

  useEffect(() => {
    setActiveTab('profile')
  }, [modeParam])

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    console.log('Changing password:', passwordForm)
    setChangePasswordDialog(false)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
    setEditError(null)
  }

  const handleSaveEdit = async () => {
    if (user && editingField === 'username') {
      const trimmed = editValue.trim()
      if (!trimmed) {
        setEditError('กรุณาระบุชื่อผู้ใช้ใหม่')
        return
      }
      if (!USERNAME_RE.test(trimmed)) {
        setEditError(USERNAME_ERROR_MESSAGE)
        return
      }
      try {
        await updateUsername.mutateAsync(trimmed)
      } catch (err) {
        setEditError(err instanceof Error ? err.message : 'อัปเดตชื่อผู้ใช้ไม่สำเร็จ')
        return
      }
    }
    setEditingField(null)
    setEditValue('')
    setEditError(null)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
    setEditError(null)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (PNG/JPEG/WEBP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5MB')
      return
    }

    try {
      setAvatarLoadFailed(false)
      await updateAvatar.mutateAsync(file)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'อัปโหลดรูปโปรไฟล์ไม่สำเร็จ')
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'analyzing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'fas fa-check-circle'
      case 'analyzing':
        return 'fas fa-hourglass-half'
      case 'failed':
        return 'fas fa-times-circle'
      default:
        return 'fas fa-circle'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'สำเร็จ'
      case 'completed': return 'เสร็จสิ้น'
      case 'analyzing': return 'กำลังวิเคราะห์'
      case 'failed': return 'ล้มเหลว'
      default: return 'รอดำเนินการ'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: 'fas fa-user', color: 'cyan' },
    { id: 'login', label: 'ประวัติการเข้าสู่ระบบ', icon: 'fas fa-sign-in-alt', color: 'blue' },
    { id: 'upload', label: 'ประวัติอัพโหลด', icon: 'fas fa-upload', color: 'green' },
    { id: 'download', label: 'ประวัติดาวน์โหลด', icon: 'fas fa-download', color: 'orange' }
  ]

  if (isLoading) {
    return (
      <GeometricLoader />
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#050510]">
      <NavbarComponent />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">โปรไฟล์ของฉัน</h1>
          <p className="text-slate-400">จัดการข้อมูลส่วนตัวและดูประวัติกิจกรรมของคุณ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="relative h-24 bg-gradient-to-r from-cyan-500 to-blue-600">
                <div className="absolute -bottom-12 left-6">
                  <div className="relative w-24 h-24">
                    {user?.avatar && !avatarLoadFailed ? (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-4 border-slate-900 shadow-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${SERVER_URL}${user.avatar}`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                          onError={() => setAvatarLoadFailed(true)}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                        <i className="fas fa-user-shield text-white text-3xl"></i>
                      </div>
                    )}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      title="เปลี่ยนรูปโปรไฟล์"
                      className="absolute -bottom-0 -right-0 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center border-2 border-slate-900 shadow-lg transition disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <i className="fas fa-camera text-xs"></i>
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-14 pb-6 px-6">
                <h2 className="text-white font-bold text-xl">{user?.username}</h2>
                <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-medium border border-cyan-500/20">
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">เข้าร่วมเมื่อ</span>
                  <span className="text-white text-sm font-medium">
                    {user ? formatDate(user.joinDate) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">เข้าสู่ระบบล่าสุด</span>
                  <span className="text-white text-sm font-medium">
                    {user ? formatDate(user.lastLogin) : ''}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-6 overflow-x-auto">
              <div className="flex p-1 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white`
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className={tab.icon}></i>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
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
                            {editingField === 'username' ? (
                              <div className="flex-1 flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => {
                                      setEditValue(e.target.value)
                                      if (editError) setEditError(null)
                                    }}
                                    maxLength={50}
                                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={updateUsername.isPending}
                                    className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition disabled:opacity-50"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button onClick={handleCancelEdit} className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition">
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                                {editError && (
                                  <p className="text-rose-400 text-sm">{editError}</p>
                                )}
                              </div>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={user?.username || ''}
                                  readOnly
                                  className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white cursor-default"
                                />
                                <button onClick={() => handleEdit('username', user?.username || '')} className="p-2.5 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition">
                                  <i className="fas fa-pen"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 text-sm mb-2">อีเมล</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="email"
                              value={user?.email || ''}
                              readOnly
                              disabled
                              title="ไม่สามารถแก้ไขอีเมลได้"
                              className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white cursor-not-allowed opacity-70"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 text-sm mb-2">บทบาท</label>
                          <input
                            type="text"
                            value={user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
                            readOnly
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white cursor-default"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'login' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold">ประวัติการเข้าสู่ระบบ</h4>
                    <span className="text-slate-400 text-sm">ทั้งหมด {loginHistory.length} รายการ</span>
                  </div>
                  {loginHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <i className="fas fa-sign-in-alt text-3xl mb-3 opacity-40"></i>
                      <p>ไม่มีข้อมูลการเข้าสู่ระบบ</p>
                    </div>
                  ) : (
                    loginHistory.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.status === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <i className={`${log.status === 'success' ? 'fas fa-check-circle text-emerald-400' : 'fas fa-times-circle text-rose-400'}`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-white font-medium">{log.device}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {getStatusText(log.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
                          <span><i className="fas fa-map-marker-alt mr-1"></i>{log.location}</span>
                          <span><i className="fas fa-network-wired mr-1"></i>{log.ipAddress}</span>
                          <span><i className="fas fa-calendar mr-1"></i>{formatDate(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold">ประวัติการอัพโหลดไฟล์</h4>
                    <span className="text-slate-400 text-sm">ทั้งหมด {uploadHistory.length} รายการ</span>
                  </div>
                  {uploadHistory.map((upload) => (
                    <Link
                      key={upload.id}
                      href={upload.status === 'completed' ? `/reports/${upload.id}` : `/scan/analysis?taskId=${upload.id}`}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <i className="fas fa-file text-cyan-400"></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-white font-medium">{upload.fileName}</p>
                          <span className="text-slate-400 text-xs bg-white/5 px-2 py-0.5 rounded">.{upload.fileType}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                            <i className={`${getStatusIcon(upload.status)} mr-1 text-xs`}></i>
                            {getStatusText(upload.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
                          <span><i className="fas fa-calendar mr-1"></i>{formatDate(upload.timestamp)}</span>
                          {upload.riskScore != null && (
                            <span className={`font-medium ${upload.riskScore >= 60 ? 'text-rose-400' : upload.riskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              <i className="fas fa-chart-line mr-1"></i>คะแนนความเสี่ยง: {upload.riskScore}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all"></i>
                    </Link>
                  ))}
                </div>
              )}

              {activeTab === 'download' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold">ประวัติการดาวน์โหลดรายงาน</h4>
                    <span className="text-slate-400 text-sm">ทั้งหมด {downloadHistory.length} รายการ</span>
                  </div>
                  {downloadHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <i className="fas fa-download text-3xl mb-3 opacity-40"></i>
                      <p>ไม่มีข้อมูลการดาวน์โหลด</p>
                    </div>
                  ) : (
                    downloadHistory.map((download) => (
                    <div key={download.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <i className="fas fa-file-pdf text-emerald-400"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">{download.fileName}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
                          <span><i className="fas fa-tag mr-1"></i>{download.reportType}</span>
                          <span><i className="fas fa-calendar mr-1"></i>{formatDate(download.timestamp)}</span>
                          <span><i className="fas fa-database mr-1"></i>{formatFileSize(download.fileSize)}</span>
                        </div>
                      </div>
                      <button className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all group-hover:scale-110">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {changePasswordDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setChangePasswordDialog(false)}>
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <i className="fas fa-key text-cyan-400"></i>
                เปลี่ยนรหัสผ่าน
              </h3>
              <p className="text-slate-400 text-sm mt-1">กรุณากรอกรหัสผ่านใหม่ของคุณ</p>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  ยืนยัน
                </button>
                <button
                  type="button"
                  onClick={() => setChangePasswordDialog(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <GeometricLoader />
    }>
      <ProfileContent />
    </Suspense>
  )
}