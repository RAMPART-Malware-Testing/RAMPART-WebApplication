'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import NavbarComponent from '@/components/NavbarComponent'

interface UserProfile {
  username: string
  email: string
  role: string
  joinDate: string
  lastLogin: string
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

  // ตั้งค่า tab เริ่มต้นตาม query parameter
  useEffect(() => {
    if (modeParam === 'report') {
      setActiveTab('upload')
    }
  }, [modeParam])

  useEffect(() => {
    // Mock data - ใน production จะดึงจาก API
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
      {
        id: '1',
        changedAt: '2024-01-15 09:30:00',
        changedBy: 'system'
      },
      {
        id: '2',
        changedAt: '2024-01-10 14:20:00',
        changedBy: 'user'
      },
      {
        id: '3',
        changedAt: '2024-01-01 11:15:00',
        changedBy: 'user'
      }
    ]

    const mockUploadHistory: UploadHistory[] = [
      {
        id: '1',
        fileName: 'suspicious_app.apk',
        fileType: 'apk',
        timestamp: '2024-01-20 14:30:25',
        status: 'completed',
        riskScore: 8.5
      },
      {
        id: '2',
        fileName: 'system_tool.exe',
        fileType: 'exe',
        timestamp: '2024-01-20 13:15:10',
        status: 'analyzing'
      },
      {
        id: '3',
        fileName: 'document_reader.msi',
        fileType: 'msi',
        timestamp: '2024-01-20 12:45:30',
        status: 'failed'
      },
      {
        id: '4',
        fileName: 'backup_script.bat',
        fileType: 'bat',
        timestamp: '2024-01-20 11:20:15',
        status: 'completed',
        riskScore: 3.2
      }
    ]

    const mockDownloadHistory: DownloadHistory[] = [
      {
        id: '1',
        fileName: 'suspicious_app_analysis.pdf',
        reportType: 'PDF Report',
        timestamp: '2024-01-20 14:35:00',
        fileSize: 2457600
      },
      {
        id: '2',
        fileName: 'system_tool_analysis.json',
        reportType: 'JSON Data',
        timestamp: '2024-01-20 13:20:00',
        fileSize: 1567800
      },
      {
        id: '3',
        fileName: 'monthly_report.pdf',
        reportType: 'PDF Report',
        timestamp: '2024-01-19 10:15:00',
        fileSize: 3891200
      }
    ]

    setTimeout(() => {
      setUser(mockUser)
      setLoginHistory(mockLoginHistory)
      setPasswordHistory(mockPasswordHistory)
      setUploadHistory(mockUploadHistory)
      setDownloadHistory(mockDownloadHistory)
      setIsLoading(false)
    }, 1)
  }, [])

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle password change logic
    console.log('Changing password:', passwordForm)
    setChangePasswordDialog(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'analyzing':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
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
    return new Date(dateString).toLocaleString('th-TH')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] p-6">
      {/* Header */}
      <NavbarComponent />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar - User Info */}
        <div className="xl:col-span-1 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                <i className="fas fa-user-shield text-white text-3xl"></i>
              </div>
              <h2 className="text-white font-semibold text-xl mb-1">
                {user?.username}
              </h2>
              <p className="text-blue-200/60 text-sm">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs font-medium border border-cyan-500/20">
                {user?.role}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-200/60">เข้าร่วมเมื่อ:</span>
                <span className="text-white font-medium text-sm">
                  {user ? formatDate(user.joinDate) : ''}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-blue-200/60">เข้าสู่ระบบล่าสุด:</span>
                <span className="text-white font-medium text-sm">
                  {user ? formatDate(user.lastLogin) : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4">สถิติการใช้งาน</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <i className="fas fa-upload text-green-400"></i>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{uploadHistory.length}</p>
                    <p className="text-blue-200/60 text-sm">ไฟล์ที่อัพโหลด</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <i className="fas fa-download text-blue-400"></i>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{downloadHistory.length}</p>
                    <p className="text-blue-200/60 text-sm">รายงานที่ดาวน์โหลด</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <i className="fas fa-sign-in-alt text-purple-400"></i>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {loginHistory.filter(log => log.status === 'success').length}
                    </p>
                    <p className="text-blue-200/60 text-sm">การเข้าสู่ระบบ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4">การดำเนินการ</h3>

            <div className="space-y-3">
              <button
                onClick={() => setChangePasswordDialog(true)}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-key"></i>
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>

              <Link
                href="/dashboard"
                className="block w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>ไปที่ Dashboard</span>
              </Link>

              <Link
                href="reports"
                className="block w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-folder"></i>
                <span>ไฟล์ทั้งหมด</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3">
          {/* Tab Navigation */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex overflow-x-auto space-x-1">
              {[
                { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: 'fa-user' },
                { id: 'login', label: 'ประวัติการเข้าสู่ระบบ', icon: 'fa-sign-in-alt' },
                { id: 'password', label: 'ประวัติรหัสผ่าน', icon: 'fa-history' },
                { id: 'upload', label: 'ประวัติอัพโหลด', icon: 'fa-upload' },
                { id: 'download', label: 'ประวัติดาวน์โหลด', icon: 'fa-download' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${activeTab === tab.id
                      ? 'bg-cyan-500 text-white'
                      : 'text-blue-200/60 hover:text-white'
                    }`}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                      <i className="fas fa-id-card text-cyan-400"></i>
                      <span>ข้อมูลบัญชีผู้ใช้</span>
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-blue-200/60 text-sm mb-2">Username</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="text"
                            value={user?.username || ''}
                            readOnly
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                          />
                          <button className="p-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all duration-300">
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-blue-200/60 text-sm mb-2">Email</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                          />
                          <button className="p-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all duration-300">
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-blue-200/60 text-sm mb-2">บทบาท</label>
                        <input
                          type="text"
                          value={user?.role || ''}
                          readOnly
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
                      <i className="fas fa-shield-alt text-green-400"></i>
                      <span>ความปลอดภัย</span>
                    </h4>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-key text-yellow-400"></i>
                          <span className="text-white">รหัสผ่าน</span>
                        </div>
                        <button
                          onClick={() => setChangePasswordDialog(true)}
                          className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-all duration-300"
                        >
                          เปลี่ยนรหัสผ่าน
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-clock text-purple-400"></i>
                          <span className="text-white">อัพเดตล่าสุด</span>
                        </div>
                        <span className="text-blue-200/60 text-sm">
                          {user ? formatDate(user.lastLogin) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Login History Tab */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">ประวัติการเข้าสู่ระบบ</h4>
                  <span className="text-blue-200/60 text-sm">
                    แสดง {loginHistory.length} รายการ
                  </span>
                </div>

                {loginHistory.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${log.status === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                        }`}>
                        <i className={`fas ${log.status === 'success' ? 'fa-check' : 'fa-times'} ${log.status === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}></i>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="text-white font-medium">{log.device}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {getStatusText(log.status)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-blue-200/60">
                          <span>{log.ipAddress}</span>
                          <span>•</span>
                          <span>{log.location}</span>
                          <span>•</span>
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Password History Tab */}
            {activeTab === 'password' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">ประวัติการเปลี่ยนรหัสผ่าน</h4>
                  <span className="text-blue-200/60 text-sm">
                    แสดง {passwordHistory.length} รายการ
                  </span>
                </div>

                {passwordHistory.map((history) => (
                  <div key={history.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <i className="fas fa-key text-purple-400"></i>
                      </div>

                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">
                          เปลี่ยนรหัสผ่านแล้ว
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-blue-200/60">
                          <span>โดย: {history.changedBy}</span>
                          <span>•</span>
                          <span>{formatDate(history.changedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload History Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">ประวัติการอัพโหลดไฟล์</h4>
                  <span className="text-blue-200/60 text-sm">
                    แสดง {uploadHistory.length} รายการ
                  </span>
                </div>

                {uploadHistory.map((upload) => (
                  <Link
                    key={upload.id}
                    href={`/reports/${upload.id}`}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <i className="fas fa-file text-cyan-400"></i>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="text-white font-medium">{upload.fileName}</p>
                          <span className="text-blue-200/60 text-sm bg-white/5 px-2 py-1 rounded">
                            .{upload.fileType}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                            {getStatusText(upload.status)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-blue-200/60">
                          <span>{formatDate(upload.timestamp)}</span>
                          {upload.riskScore && (
                            <>
                              <span>•</span>
                              <span className={`font-medium ${upload.riskScore >= 8 ? 'text-red-400' :
                                  upload.riskScore >= 6 ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                คะแนนความเสี่ยง: {upload.riskScore}/10
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-cyan-400">
                        <i className="fas fa-chevron-right"></i>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Download History Tab */}
            {activeTab === 'download' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">ประวัติการดาวน์โหลดรายงาน</h4>
                  <span className="text-blue-200/60 text-sm">
                    แสดง {downloadHistory.length} รายการ
                  </span>
                </div>

                {downloadHistory.map((download) => (
                  <div key={download.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <i className="fas fa-file-pdf text-green-400"></i>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="text-white font-medium">{download.fileName}</p>
                          <span className="text-blue-200/60 text-sm bg-white/5 px-2 py-1 rounded">
                            {download.reportType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-blue-200/60">
                          <span>{formatDate(download.timestamp)}</span>
                          <span>•</span>
                          <span>{formatFileSize(download.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    <button className="p-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all duration-300">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      {changePasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-4">เปลี่ยนรหัสผ่าน</h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  รหัสผ่านปัจจุบัน
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all duration-300"
                  placeholder="ป้อนรหัสผ่านปัจจุบัน"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all duration-300"
                  placeholder="ป้อนรหัสผ่านใหม่"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all duration-300"
                  placeholder="ป้อนรหัสผ่านใหม่อีกครั้ง"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  เปลี่ยนรหัสผ่าน
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}