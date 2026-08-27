'use client'

import { useState } from 'react'
import axios from 'axios'
import { useToast } from '@/components/ui/ToastProvider'

export default function BroadcastPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [lastResult, setLastResult] = useState<{ sent: number; total_recipients: number } | null>(null)
  const notify = useToast()

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      notify.warning('กรุณากรอกหัวข้อและข้อความ')
      return
    }
    setIsSending(true)
    setLastResult(null)
    try {
      const { data } = await axios.post<BroadcastEmailResponse>('/api/admin/broadcast-email', {
        subject: subject.trim(),
        message: message.trim(),
        target_role: targetRole || undefined,
      })
      if (data.success && data.data) {
        notify.success(`ส่งอีเมลสำเร็จ ${data.data.sent}/${data.data.total_recipients} คน`)
        setLastResult(data.data)
        setSubject('')
        setMessage('')
      } else {
        notify.error('ไม่สามารถส่งอีเมลได้')
      }
    } catch {
      notify.error('ไม่สามารถส่งอีเมลได้')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">ส่งอีเมลประกาศ</h1>
        <p className="text-blue-200/50 text-sm mt-1">ส่งข้อความแจ้งเตือน/ประกาศไปยังผู้ใช้งานในระบบ</p>
      </div>

      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-5">
        <div>
          <label className="block text-sm text-blue-200/60 mb-2">ส่งถึง</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
          >
            <option value="" className="bg-slate-800">ผู้ใช้งานทั้งหมด</option>
            <option value="user" className="bg-slate-800">สมาชิกทั่วไปเท่านั้น</option>
            <option value="admin" className="bg-slate-800">แอดมินเท่านั้น</option>
            <option value="master" className="bg-slate-800">Master เท่านั้น</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-blue-200/60 mb-2">หัวข้อ</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="หัวข้ออีเมล"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
          />
        </div>

        <div>
          <label className="block text-sm text-blue-200/60 mb-2">ข้อความ</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="เนื้อหาข้อความที่ต้องการส่ง..."
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition resize-none"
          />
        </div>

        <button
          disabled={isSending}
          onClick={handleSend}
          className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <i className="fas fa-paper-plane" />
          )}
          ส่งอีเมล
        </button>

        {lastResult && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-300 text-sm">
            ส่งสำเร็จ {lastResult.sent} จาก {lastResult.total_recipients} คน
          </div>
        )}
      </div>
    </div>
  )
}
