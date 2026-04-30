'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from "@/components/GeometricLoader";

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

interface PasswordHistory {
  id: string
  changedAt: string
  changedBy: string
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
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistory[]>([])
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [changePasswordDialog, setChangePasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (modeParam === 'report') {
      setActiveTab('upload')
    }
  }, [modeParam])

  useEffect(() => {
    const mockUser: UserProfile = {
      username: 'security_analyst',
      email: 'analyst@rampart.security',
      role: 'user',
      joinDate: '2024-01-15 09:30:00',
      lastLogin: '2024-01-20 14:25:00'
    }

    const mockLoginHistory: LoginHistory[] = [
      {
        id: '1',
        timestamp: '2024-01-20 14:25:00',
        ipAddress: '192.168.1.100',
        location: 'Bangkok, Thailand',
        device: 'Chrome on Windows',
        status: 'success'
      },
      {
        id: '2',
        timestamp: '2024-01-20 08:15:00',
        ipAddress: '192.168.1.100',
        location: 'Bangkok, Thailand',
        device: 'Chrome on Windows',
        status: 'success'
      },
      {
        id: '3',
        timestamp: '2024-01-19 22:30:00',
        ipAddress: '10.0.0.50',
        location: 'Bangkok, Thailand',
        device: 'Safari on iPhone',
        status: 'success'
      },
      {
        id: '4',
        timestamp: '2024-01-19 15:45:00',
        ipAddress: '203.45.67.89',
        location: 'Unknown',
        device: 'Firefox on Linux',
        status: 'failed'
      }
    ]

    const mockPasswordHistory: PasswordHistory[] = [
      { id: '1', changedAt: '2024-01-15 09:30:00', changedBy: 'system' },
      { id: '2', changedAt: '2024-01-10 14:20:00', changedBy: 'user' },
      { id: '3', changedAt: '2024-01-01 11:15:00', changedBy: 'user' }
    ]

    const mockUploadHistory: UploadHistory[] = [
      { id: '1', fileName: 'suspicious_app.apk', fileType: 'apk', timestamp: '2024-01-20 14:30:25', status: 'completed', riskScore: 8.5 },
      { id: '2', fileName: 'system_tool.exe', fileType: 'exe', timestamp: '2024-01-20 13:15:10', status: 'analyzing' },
      { id: '3', fileName: 'document_reader.msi', fileType: 'msi', timestamp: '2024-01-20 12:45:30', status: 'failed' },
      { id: '4', fileName: 'backup_script.bat', fileType: 'bat', timestamp: '2024-01-20 11:20:15', status: 'completed', riskScore: 3.2 }
    ]

    const mockDownloadHistory: DownloadHistory[] = [
      { id: '1', fileName: 'suspicious_app_analysis.pdf', reportType: 'PDF Report', timestamp: '2024-01-20 14:35:00', fileSize: 2457600 },
      { id: '2', fileName: 'system_tool_analysis.json', reportType: 'JSON Data', timestamp: '2024-01-20 13:20:00', fileSize: 1567800 },
      { id: '3', fileName: 'monthly_report.pdf', reportType: 'PDF Report', timestamp: '2024-01-19 10:15:00', fileSize: 3891200 }
    ]

    setTimeout(() => {
      setUser(mockUser)
      setLoginHistory(mockLoginHistory)
      setPasswordHistory(mockPasswordHistory)
      setUploadHistory(mockUploadHistory)
      setDownloadHistory(mockDownloadHistory)
      setIsLoading(false)
    }, 1000)
  }, [])

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
  }

  const handleSaveEdit = () => {
    if (user && editingField) {
      setUser({ ...user, [editingField]: editValue })
    }
    setEditingField(null)
    setEditValue('')
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
    { id: 'password', label: 'ประวัติรหัสผ่าน', icon: 'fas fa-history', color: 'purple' },
    { id: 'upload', label: 'ประวัติอัพโหลด', icon: 'fas fa-upload', color: 'green' },
    { id: 'download', label: 'ประวัติดาวน์โหลด', icon: 'fas fa-download', color: 'orange' }
  ]

  if (isLoading) {
    return (
      <GeometricLoader />
    )
  }

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
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                    <i className="fas fa-user-shield text-white text-3xl"></i>
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

            {/* Stats Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-chart-simple text-cyan-400" />
                สถิติการใช้งาน
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{uploadHistory.length}</div>
                  <div className="text-slate-400 text-xs mt-1">ไฟล์ที่อัพโหลด</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{downloadHistory.length}</div>
                  <div className="text-slate-400 text-xs mt-1">รายงานที่ดาวน์โหลด</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {loginHistory.filter(log => log.status === 'success').length}
                  </div>
                  <div className="text-slate-400 text-xs mt-1">การเข้าสู่ระบบ</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{passwordHistory.length}</div>
                  <div className="text-slate-400 text-xs mt-1">เปลี่ยนรหัสผ่าน</div>
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
                <button
                  onClick={() => setChangePasswordDialog(true)}
                  className="w-full group flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300"
                >
                  <i className="fas fa-key text-cyan-400"></i>
                  <span className="text-white flex-1 text-left">เปลี่ยนรหัสผ่าน</span>
                  <i className="fas fa-chevron-right text-slate-400 text-sm group-hover:translate-x-1 transition-transform"></i>
                </button>
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg`
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
                            {editingField === 'username' ? (
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                  autoFocus
                                />
                                <button onClick={handleSaveEdit} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition">
                                  <i className="fas fa-check"></i>
                                </button>
                                <button onClick={() => setEditingField(null)} className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition">
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
                            {editingField === 'email' ? (
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="email"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                  autoFocus
                                />
                                <button onClick={handleSaveEdit} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition">
                                  <i className="fas fa-check"></i>
                                </button>
                                <button onClick={() => setEditingField(null)} className="px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition">
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="email"
                                  value={user?.email || ''}
                                  readOnly
                                  className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white cursor-default"
                                />
                                <button onClick={() => handleEdit('email', user?.email || '')} className="p-2.5 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition">
                                  <i className="fas fa-pen"></i>
                                </button>
                              </>
                            )}
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

                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <i className="fas fa-shield-alt text-emerald-400"></i>
                        <span>ความปลอดภัย</span>
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <i className="fas fa-key text-amber-400"></i>
                            <span className="text-white">รหัสผ่าน</span>
                          </div>
                          <button
                            onClick={() => setChangePasswordDialog(true)}
                            className="px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition"
                          >
                            เปลี่ยนรหัสผ่าน
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <i className="fas fa-clock text-purple-400"></i>
                            <span className="text-white">2FA</span>
                          </div>
                          <button className="px-4 py-2 text-sm text-slate-400 hover:text-white transition">
                            กำลังจะมาเร็วๆ นี้
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Login History Tab */}
              {activeTab === 'login' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold">ประวัติการเข้าสู่ระบบ</h4>
                    <span className="text-slate-400 text-sm">ทั้งหมด {loginHistory.length} รายการ</span>
                  </div>
                  {loginHistory.map((log) => (
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
                  ))}
                </div>
              )}

              {/* Password History Tab */}
              {activeTab === 'password' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold">ประวัติการเปลี่ยนรหัสผ่าน</h4>
                    <span className="text-slate-400 text-sm">ทั้งหมด {passwordHistory.length} รายการ</span>
                  </div>
                  {passwordHistory.map((history) => (
                    <div key={history.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <i className="fas fa-key text-purple-400"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">เปลี่ยนรหัสผ่านแล้ว</p>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span><i className="fas fa-user mr-1"></i>โดย: {history.changedBy === 'user' ? 'คุณ' : 'ระบบ'}</span>
                          <span><i className="fas fa-calendar mr-1"></i>{formatDate(history.changedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload History Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold">ประวัติการอัพโหลดไฟล์</h4>
                    <span className="text-slate-400 text-sm">ทั้งหมด {uploadHistory.length} รายการ</span>
                  </div>
                  {uploadHistory.map((upload) => (
                    <Link
                      key={upload.id}
                      href={`/reports/${upload.id}`}
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
                          {upload.riskScore && (
                            <span className={`font-medium ${upload.riskScore >= 8 ? 'text-rose-400' : upload.riskScore >= 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              <i className="fas fa-chart-line mr-1"></i>คะแนนความเสี่ยง: {upload.riskScore}/10
                            </span>
                          )}
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all"></i>
                    </Link>
                  ))}
                </div>
              )}

              {/* Download History Tab */}
              {activeTab === 'download' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold">ประวัติการดาวน์โหลดรายงาน</h4>
                    <span className="text-slate-400 text-sm">ทั้งหมด {downloadHistory.length} รายการ</span>
                  </div>
                  {downloadHistory.map((download) => (
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
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