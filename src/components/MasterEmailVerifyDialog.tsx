'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useToast } from '@/components/ui/ToastProvider'
import { validateEmailInput } from '@/lib/email'

interface MasterEmailVerifyDialogProps {
  open: boolean
  currentEmail: string
  onClose: () => void
  onVerified: () => Promise<void> | void
}

export default function MasterEmailVerifyDialog({
  open,
  currentEmail,
  onClose,
  onVerified,
}: MasterEmailVerifyDialogProps) {
  const notify = useToast()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState(currentEmail)
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')
  const [emailSent, setEmailSent] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('email')
    setEmail(currentEmail)
    setOtp('')
    setToken('')
    setEmailSent(true)
    setError('')
    setBusy(false)
  }, [open, currentEmail])

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = validateEmailInput(email)
    if ('error' in result) {
      setError(result.error)
      return
    }

    setBusy(true)
    try {
      const { data } = await axios.post('/api/profile/verify-email', { email: result.value })
      if (!data?.success) throw new Error(data?.message || 'ส่งรหัส OTP ไม่สำเร็จ')
      setEmail(result.value)
      setToken(data?.data?.token ?? '')
      setEmailSent(data?.data?.email_sent !== false)
      setStep('otp')
      notify.success(data?.message || `ส่งรหัส OTP ไปยัง ${result.value} แล้ว`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ส่งรหัส OTP ไม่สำเร็จ'
      setError(message)
      notify.error(message)
    } finally {
      setBusy(false)
    }
  }

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.trim().length !== 6) {
      setError('รหัส OTP ต้องเป็นตัวเลข 6 หลัก')
      return
    }

    setBusy(true)
    try {
      const { data } = await axios.post('/api/profile/confirm-email', {
        otp_token: token,
        otp: otp.trim(),
      })
      if (!data?.success) throw new Error(data?.message || 'ยืนยันอีเมลไม่สำเร็จ')
      notify.success('ยืนยันอีเมลสำเร็จ')
      await onVerified()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ยืนยันอีเมลไม่สำเร็จ'
      setError(message)
      notify.error(message)
    } finally {
      setBusy(false)
    }
  }

  const resendOtp = async () => {
    setError('')
    setBusy(true)
    try {
      const { data } = await axios.post('/api/profile/resend-email-otp')
      if (!data?.success) throw new Error(data?.message || 'ส่งรหัสใหม่ไม่สำเร็จ')
      setToken(data?.data?.token ?? token)
      setEmailSent(data?.data?.email_sent !== false)
      setOtp('')
      notify.success(data?.message || 'ส่งรหัส OTP ใหม่แล้ว')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ส่งรหัสใหม่ไม่สำเร็จ'
      setError(message)
      notify.error(message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <i className="fas fa-envelope-circle-check text-cyan-400"></i>
            ยืนยันอีเมล
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {step === 'email'
              ? 'อีเมลนี้ยังไม่ได้รับการยืนยัน ระบบจะส่งรหัส OTP ไปยังอีเมลที่ระบุเพื่อยืนยัน'
              : `กรอกรหัส OTP 6 หลักที่ส่งไปที่ ${email || '-'}`}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={sendOtp} noValidate className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">อีเมล</label>
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                placeholder="yourname@gmail.com"
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">อีเมลปัจจุบัน: {currentEmail || '-'}</p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
              <i className="fas fa-circle-info mt-0.5"></i>
              <span>
                แก้ไขเป็นอีเมลใหม่เพื่อเปลี่ยนอีเมลพร้อมยืนยัน หรือคงอีเมลเดิมไว้เพื่อยืนยันอีเมลปัจจุบัน
              </span>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                <i className="fas fa-exclamation-circle mt-0.5"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                {busy ? 'กำลังส่งรหัส...' : 'ส่งรหัส OTP'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={confirmOtp} noValidate className="p-6 space-y-4">
            {!emailSent && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                ⚠ ระบบส่งอีเมลล้มเหลว — ตรวจสอบ GMAIL_USERNAME / GMAIL_PASSWORD ใน .env ของ backend
              </div>
            )}

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              ส่งรหัสไปที่: {email}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">รหัส OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-center text-lg tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                <i className="fas fa-exclamation-circle mt-0.5"></i>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
            >
              {busy ? 'กำลังยืนยัน...' : 'ยืนยันอีเมล'}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={resendOtp}
                className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                ส่งรหัสใหม่
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
