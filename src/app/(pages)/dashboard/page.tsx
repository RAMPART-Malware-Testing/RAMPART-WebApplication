'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'

interface DashboardStats {
  totalFiles: {
    total: number
    success: number
    pending: number
    failed: number
  }
  userFiles: {
    total: number
    success: number
    pending: number
    failed: number
  }
  totalUsers: number
  topMalwareTypes: {
    daily: Array<{ type: string; count: number }>
    monthly: Array<{ type: string; count: number }>
  }
  riskScores: Array<{ fileType: string; riskScore: number }>
  recentActivities: Array<{
    id: string
    fileName: string
    status: 'success' | 'pending' | 'failed'
    timestamp: string
    fileType: string
  }>
  systemStatus: {
    capev2: 'online' | 'offline'
    mobsf: 'online' | 'offline'
    api: 'online' | 'offline'
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly'>('daily')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      setIsLoading(true)
      // Mock data - ใน production จะดึงจาก API จริง
      const mockData: DashboardStats = {
        totalFiles: {
          total: 1247,
          success: 983,
          pending: 42,
          failed: 222
        },
        userFiles: {
          total: 156,
          success: 128,
          pending: 8,
          failed: 20
        },
        totalUsers: 89,
        topMalwareTypes: {
          daily: [
            { type: 'Trojan', count: 45 },
            { type: 'Ransomware', count: 32 },
            { type: 'Spyware', count: 28 },
            { type: 'Adware', count: 19 },
            { type: 'Worm', count: 15 }
          ],
          monthly: [
            { type: 'Trojan', count: 892 },
            { type: 'Ransomware', count: 567 },
            { type: 'Spyware', count: 421 },
            { type: 'Worm', count: 298 },
            { type: 'Adware', count: 234 }
          ]
        },
        riskScores: [
          { fileType: '.apk', riskScore: 7.8 },
          { fileType: '.exe', riskScore: 8.2 },
          { fileType: '.bat', riskScore: 6.5 },
          { fileType: '.dmg', riskScore: 5.2 },
          { fileType: '.msi', riskScore: 7.1 }
        ],
        recentActivities: [
          {
            id: '1',
            fileName: 'suspicious_file.exe',
            status: 'success',
            timestamp: '2024-01-20 14:30:25',
            fileType: '.exe'
          },
          {
            id: '2',
            fileName: 'document_scan.apk',
            status: 'pending',
            timestamp: '2024-01-20 14:25:10',
            fileType: '.apk'
          },
          {
            id: '3',
            fileName: 'system_update.bat',
            status: 'failed',
            timestamp: '2024-01-20 14:20:45',
            fileType: '.bat'
          },
          {
            id: '4',
            fileName: 'backup_tool.msi',
            status: 'success',
            timestamp: '2024-01-20 14:15:30',
            fileType: '.msi'
          }
        ],
        systemStatus: {
          capev2: 'online',
          mobsf: 'online',
          api: 'online'
        }
      }

      setTimeout(() => {
        setStats(mockData)
        setIsLoading(false)
      }, 1)
    }

    fetchDashboardData()
  }, [])

  if (isLoading || !stats) {
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
      <NavbarComponent/>  

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200/60 text-sm">CAPEv2</p>
              <p className={`text-lg font-bold ${
                stats.systemStatus.capev2 === 'online' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.systemStatus.capev2 === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              stats.systemStatus.capev2 === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200/60 text-sm">MobSF</p>
              <p className={`text-lg font-bold ${
                stats.systemStatus.mobsf === 'online' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.systemStatus.mobsf === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              stats.systemStatus.mobsf === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200/60 text-sm">API Gateway</p>
              <p className={`text-lg font-bold ${
                stats.systemStatus.api === 'online' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.systemStatus.api === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              stats.systemStatus.api === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Total Files Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">ไฟล์ทั้งหมดในระบบ</h3>
            <i className="fas fa-folder text-cyan-400 text-xl"></i>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-200/60">ทั้งหมด</span>
              <span className="text-white font-bold text-xl">{stats.totalFiles.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-400">สำเร็จ</span>
              <span className="text-white font-semibold">{stats.totalFiles.success.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">รอวิเคราะห์</span>
              <span className="text-white font-semibold">{stats.totalFiles.pending.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400">ไม่สำเร็จ</span>
              <span className="text-white font-semibold">{stats.totalFiles.failed.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* User Files Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">ไฟล์ส่วนตัวของคุณ</h3>
            <i className="fas fa-user-shield text-blue-400 text-xl"></i>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-200/60">ทั้งหมด</span>
              <span className="text-white font-bold text-xl">{stats.userFiles.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-400">สำเร็จ</span>
              <span className="text-white font-semibold">{stats.userFiles.success.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">รอวิเคราะห์</span>
              <span className="text-white font-semibold">{stats.userFiles.pending.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400">ไม่สำเร็จ</span>
              <span className="text-white font-semibold">{stats.userFiles.failed.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">สมาชิกทั้งหมด</h3>
            <i className="fas fa-users text-purple-400 text-xl"></i>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-2">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-blue-200/60 text-sm">ผู้ใช้งานที่ลงทะเบียน</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">การดำเนินการด่วน</h3>
            <i className="fas fa-bolt text-green-400 text-xl"></i>
          </div>
          <div className="space-y-3">
            <Link href={"/scan"} className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2">
              <i className="fas fa-upload"></i>
              <span>อัพโหลดไฟล์ใหม่</span>
            </Link>
            <Link href={"/reports"} className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2">
              <i className="fas fa-chart-bar"></i>
              <span>ดูรายงานทั้งหมด</span>
            </Link>
            <Link href="/profile?m=report" className="w-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2">
              <i className="fas fa-cog"></i>
              <span>ผลการวิเคราะห์</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Top Malware Types */}
        <div className="xl:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-semibold">TOP 5 ประเภทมัลแวร์</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  timeRange === 'daily'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-blue-200/60 hover:text-white'
                }`}
              >
                รายวัน
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  timeRange === 'monthly'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-blue-200/60 hover:text-white'
                }`}
              >
                รายเดือน
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {(timeRange === 'daily' ? stats.topMalwareTypes.daily : stats.topMalwareTypes.monthly).map((malware, index) => (
              <div key={malware.type} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{malware.type}</p>
                    <p className="text-blue-200/60 text-sm">{malware.count} ครั้ง</p>
                  </div>
                </div>
                <div className="w-20 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${(malware.count / Math.max(...(timeRange === 'daily' ? stats.topMalwareTypes.daily : stats.topMalwareTypes.monthly).map(m => m.count))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Scores */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">คะแนนความเสี่ยงไฟล์</h3>
            <i className="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
          </div>
          
          <div className="space-y-4">
            {stats.riskScores.map((fileType, index) => (
              <div key={fileType.fileType} className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{fileType.fileType}</span>
                  <span className={`text-lg font-bold ${
                    fileType.riskScore >= 8 ? 'text-red-400' :
                    fileType.riskScore >= 6 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {fileType.riskScore}/10
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      fileType.riskScore >= 8 ? 'bg-red-500' :
                      fileType.riskScore >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${fileType.riskScore * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold">กิจกรรมล่าสุด</h3>
          <Link href="/profile?m=report" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200">
            ดูทั้งหมด
          </Link>
        </div>
        
        <div className="space-y-3">
          {stats.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.status === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                  activity.status === 'pending' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                  'bg-red-500/10 border border-red-500/20'
                }`}>
                  <i className={`fas ${
                    activity.status === 'success' ? 'fa-check text-green-400' :
                    activity.status === 'pending' ? 'fa-clock text-yellow-400' :
                    'fa-times text-red-400'
                  }`}></i>
                </div>
                <div>
                  <p className="text-white font-medium">{activity.fileName}</p>
                  <p className="text-blue-200/60 text-sm">{activity.fileType} • {activity.timestamp}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                activity.status === 'success' ? 'bg-green-500/20 text-green-400' :
                activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {activity.status === 'success' ? 'สำเร็จ' : 
                 activity.status === 'pending' ? 'รอวิเคราะห์' : 'ไม่สำเร็จ'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}