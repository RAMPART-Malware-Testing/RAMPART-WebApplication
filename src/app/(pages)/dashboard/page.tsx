'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavbarComponent from '@/components/NavbarComponent'
import axios from 'axios'
import GeometricLoader from '@/components/GeometricLoader'

interface FileStats {
  total: number
  success: number
  pending: number
  failed: number
}

interface MalwareTypeEntry {
  type: string
  count: number
}

interface RiskScoreEntry {
  fileType: string
  riskScore: number
}

interface RecentActivity {
  id: string
  fileName: string
  status: 'success' | 'pending' | 'failed'
  timestamp: string
  fileType: string
}

interface DashboardStats {
  totalFiles: FileStats
  userFiles: FileStats
  totalUsers: number
  topMalwareTypes: {
    daily: MalwareTypeEntry[]
    monthly: MalwareTypeEntry[]
  }
  riskScores: RiskScoreEntry[]
  recentActivities: RecentActivity[]
}


function safeNumber(value?: number) {
  if (typeof value !== 'number' || isNaN(value)) return 0
  return value
}

function truncate(text?: string, max = 30) {
  if (!text) return '-'
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

function safeArray<T>(arr?: T[]): T[] {
  if (!Array.isArray(arr)) return []
  return arr
}

type TimeRange = 'daily' | 'monthly'

const STATUS_STYLES: Record<RecentActivity['status'], { wrapper: string; icon: string; badge: string; label: string }> = {
  success: {
    wrapper: 'bg-green-500/10 border border-green-500/20',
    icon: 'fas fa-check text-green-400',
    badge: 'bg-green-500/20 text-green-400',
    label: 'สำเร็จ',
  },
  pending: {
    wrapper: 'bg-yellow-500/10 border border-yellow-500/20',
    icon: 'fas fa-clock text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400',
    label: 'รอวิเคราะห์',
  },
  failed: {
    wrapper: 'bg-red-500/10 border border-red-500/20',
    icon: 'fas fa-times text-red-400',
    badge: 'bg-red-500/20 text-red-400',
    label: 'ไม่สำเร็จ',
  },
}

function getRiskScoreColor(score: number) {
  if (score >= 70) return { text: 'text-red-400', bar: 'bg-red-500' }
  if (score >= 40) return { text: 'text-yellow-400', bar: 'bg-yellow-500' }
  return { text: 'text-green-400', bar: 'bg-green-500' }
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-white text-lg">กำลังโหลดข้อมูล...</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('daily')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)

        const [statsResponse, activitiesResponse] = await Promise.all([
          axios.post<Omit<DashboardStats, 'recentActivities'>>('/api/dashboard'),
          axios.post<RecentActivity[]>('/api/dashboard/recent-activities'),
        ])

        const stats = statsResponse?.data
        const activities = activitiesResponse?.data

        setDashboardStats({
          totalFiles: stats?.totalFiles ?? { total: 0, success: 0, pending: 0, failed: 0 },
          userFiles: stats?.userFiles ?? { total: 0, success: 0, pending: 0, failed: 0 },
          totalUsers: safeNumber(stats?.totalUsers),
          topMalwareTypes: {
            daily: safeArray(stats?.topMalwareTypes?.daily),
            monthly: safeArray(stats?.topMalwareTypes?.monthly),
          },
          riskScores: safeArray(stats?.riskScores),
          recentActivities: safeArray(activities),
        })
      } catch (error) {
        console.error('Dashboard Load Error:', error)

        setDashboardStats({
          totalFiles: { total: 0, success: 0, pending: 0, failed: 0 },
          userFiles: { total: 0, success: 0, pending: 0, failed: 0 },
          totalUsers: 0,
          topMalwareTypes: { daily: [], monthly: [] },
          riskScores: [],
          recentActivities: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading || !dashboardStats) return <GeometricLoader loadingText='กำลังโหลด'/>

  const activeMalwareList =
    selectedTimeRange === 'daily'
      ? dashboardStats.topMalwareTypes.daily
      : dashboardStats.topMalwareTypes.monthly
  
  const maxMalwareCount =
    activeMalwareList.length > 0
      ? Math.max(...activeMalwareList.map((m) => safeNumber(m.count)))
      : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] p-6">
      <NavbarComponent />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <FileStatsCard title="ไฟล์ทั้งหมดในระบบ" icon="fa-folder" iconColor="text-cyan-400" borderHover="hover:border-cyan-500/30" stats={dashboardStats.totalFiles} />
        <FileStatsCard title="ไฟล์ส่วนตัวของคุณ" icon="fa-user-shield" iconColor="text-blue-400" borderHover="hover:border-blue-500/30" stats={dashboardStats.userFiles} />

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">สมาชิกทั้งหมด</h3>
            <i className="fas fa-users text-purple-400 text-xl" />
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-2">
              {dashboardStats.totalUsers.toLocaleString()}
            </div>
            <p className="text-blue-200/60 text-sm">ผู้ใช้งานที่ลงทะเบียน</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">การดำเนินการด่วน</h3>
            <i className="fas fa-bolt text-green-400 text-xl" />
          </div>
          <div className="space-y-3">
            <QuickActionLink href="/scan" colorScheme="cyan" icon="fa-upload" label="อัพโหลดไฟล์ใหม่" />
            <QuickActionLink href="/reports" colorScheme="blue" icon="fa-chart-bar" label="ดูรายงานทั้งหมด" />
            <QuickActionLink href="/profile?m=report" colorScheme="purple" icon="fa-cog" label="ผลการวิเคราะห์" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-semibold">TOP 5 ประเภทมัลแวร์</h3>
            <div className="flex space-x-2">
              {(['daily', 'monthly'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedTimeRange === range
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-blue-200/60 hover:text-white'
                    }`}
                >
                  {range === 'daily' ? 'รายวัน' : 'รายเดือน'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {activeMalwareList.map((malware, index) => (
              <div key={truncate(malware.type, 25)} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
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
                    style={{ width: `${(malware.count / maxMalwareCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">คะแนนความเสี่ยงไฟล์</h3>
            <i className="fas fa-exclamation-triangle text-yellow-400 text-xl" />
          </div>

          <div className="space-y-4">
            {safeArray(dashboardStats.riskScores).map((entry) => {
              const score = safeNumber(entry.riskScore)
              const normalizedScore = Math.min(score, 100)
              const colors = getRiskScoreColor(normalizedScore)
              return (
                <div key={truncate(entry.fileType, 15)} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{entry.fileType}</span>
                    <span className={`text-lg font-bold ${colors.text}`}>
                      {entry.riskScore.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${colors.bar}`}
                      style={{ width: `${normalizedScore}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold">กิจกรรมล่าสุด</h3>
          <Link href="/profile?m=report" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200">
            ดูทั้งหมด
          </Link>
        </div>

        <div className="space-y-3">
          {safeArray(dashboardStats.recentActivities).map((activity) => {
            const style =
              STATUS_STYLES[activity.status] ??
              STATUS_STYLES['failed']
            return (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-white font-medium">{truncate(activity.fileName, 35)}</p>
                    <p className="text-blue-200/60 text-sm">{truncate(activity.fileType, 10)} • {truncate(activity.timestamp, 20)}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                  {style.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FileStatsCard({
  title,
  icon,
  iconColor,
  borderHover,
  stats,
}: {
  title: string
  icon: string
  iconColor: string
  borderHover: string
  stats: FileStats
}) {
  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${borderHover} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        <i className={`fas ${icon} ${iconColor} text-xl`} />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-blue-200/60">ทั้งหมด</span>
          <span className="text-white font-bold text-xl">{safeNumber(stats?.total).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-400">สำเร็จ</span>
          <span className="text-white font-semibold">{safeNumber(stats?.success).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-yellow-400">รอวิเคราะห์</span>
          <span className="text-white font-semibold">{safeNumber(stats?.pending).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-red-400">ไม่สำเร็จ</span>
          <span className="text-white font-semibold">{safeNumber(stats?.failed).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function QuickActionLink({
  href,
  colorScheme,
  icon,
  label,
}: {
  href: string
  colorScheme: 'cyan' | 'blue' | 'purple'
  icon: string
  label: string
}) {
  const colors = {
    cyan: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
    blue: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400',
  }

  return (
    <Link
      href={href}
      className={`w-full border rounded-xl py-3 px-4 transition-all duration-300 flex items-center justify-center space-x-2 ${colors[colorScheme]}`}
    >
      <i className={`fas ${icon}`} />
      <span>{label}</span>
    </Link>
  )
}