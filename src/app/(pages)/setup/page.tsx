'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent'
import GeometricLoader from '@/components/GeometricLoader'
import { useToast } from '@/components/ui/ToastProvider'
import { PASSWORD_RULES, validatePassword } from '@/lib/password'
import { useProfile, type ProfileData } from '@/hooks/queries/useProfile'
import { queryKeys } from '@/hooks/queries/queryKeys'

type Step = 'email' | 'otp' | 'done'

const GMAIL_RE = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@gmail\.com$/

const STEPS = [
  { id: 'email', label: '1. ระบุ Gmail' },
  { id: 'otp', label: '2. ยืนยัน OTP' },
  { id: 'password', label: '3. ตั้งรหัสผ่านใหม่' },
] as const

export default function MasterSetupPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const notify = useToast()
  const { data: profile } = useProfile()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [otp, setOtp] = useState('')
  const [emailSent, setEmailSent] = useState(true)
  const [skipEmail, setSkipEmail] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (step === 'done') return
    if (profile && profile.must_setup !== true) {
      router.replace('/dashboard')
    }
  }, [profile, step, router])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const candidate = email.trim().toLowerCase()
    if (!GMAIL_RE.test(candidate)) {
      setError('กรุณาระบุอีเมล Gmail ที่ลงท้ายด้วย @gmail.com')
      return
    }
    setBusy(true)
    try {
      const { data } = await axios.post('/api/admin/setup/email', { email: candidate })
      if (!data?.success) throw new Error(data?.message || 'ส่งรหัส OTP ไม่สำเร็จ')
      setEmail(candidate)
      setOtpToken(data?.data?.token ?? '')
      setEmailSent(data?.data?.email_sent !== false)
      setSkipEmail(false)
      setStep('otp')
      notify.success(data?.message || `ส่งรหัส OTP ไปยัง ${candidate} แล้ว`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ส่งรหัส OTP ไม่สำเร็จ'
      setError(message)
      notify.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const policyError = validatePassword(password)
    if (policyError) {
      setError(policyError)
      return
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }
    if (!skipEmail && otp.trim().length !== 6) {
      setError('รหัส OTP ต้องเป็นตัวเลข 6 หลัก')
      return
    }

    setBusy(true)
    try {
      const { data } = await axios.post('/api/admin/setup/confirm', {
        otp_token: skipEmail ? null : otpToken,
        otp: skipEmail ? null : otp.trim(),
        skip_otp: skipEmail,
        newPasswd: password,
        confirmPasswd: confirmPassword,
      })
      if (!data?.success) throw new Error(data?.message || 'ยืนยันไม่สำเร็จ')
      queryClient.setQueryData<ProfileData | null>(queryKeys.profile, (prev) =>
        prev ? { ...prev, must_setup: false } : prev,
      )
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      setStep('done')
      notify.success('ตั้งค่าบัญชี master สำเร็จ')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ยืนยันไม่สำเร็จ'
      setError(message)
      notify.error(message)
    } finally {
      setBusy(false)
    }
  }

  const stepState = (id: (typeof STEPS)[number]['id']): 'active' | 'done' | 'skipped' | 'todo' => {
    if (id === 'email') {
      if (step === 'email') return 'active'
      return skipEmail ? 'skipped' : 'done'
    }
    if (id === 'otp') {
      if (skipEmail) return 'skipped'
      return step === 'email' ? 'todo' : 'done'
    }
    if (step === 'email') return 'todo'
    return step === 'done' ? 'done' : 'active'
  }

  return (
    <div className="min-h-screen bg-[#050510] px-4 pb-6 sm:px-6">
      <NavbarComponent />

      <div className="max-w-2xl mx-auto py-6">
        {step === 'done' && <GeometricLoader loadingText="ตั้งค่าเสร็จแล้ว กำลังพาไปแดชบอร์ด" />}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex items-center gap-3">
            <i className="fas fa-user-shield text-amber-400"></i>
            <div>
              <h1 className="text-white font-semibold text-lg">ตั้งค่าบัญชี master ครั้งแรก</h1>
              <p className="text-slate-400 text-sm">
                บัญชีนี้ยังใช้รหัสผ่านเริ่มต้น — กรุณายืนยัน Gmail และตั้งรหัสผ่านใหม่ก่อนใช้งาน
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            {STEPS.map((s) => {
              const state = stepState(s.id)
              const cls =
                state === 'active'
                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                  : state === 'done'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : state === 'skipped'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-white/10 bg-white/5 text-slate-500'
              return (
                <span key={s.id} className={`rounded-full border px-3 py-1 font-medium ${cls}`}>
                  {state === 'done' ? '✓ ' : state === 'skipped' ? 'ข้าม · ' : ''}
                  {s.label}
                </span>
              )
            })}
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} noValidate className="space-y-4">
              {profile?.email && (
                <p className="text-xs text-slate-500">
                  อีเมลปัจจุบันในระบบ: <span className="text-slate-300">{profile.email}</span>
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">อีเมล Gmail</label>
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/[^\x20-\x7E]/g, ''))}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <p className="mt-2 text-xs text-slate-500">
                  ระบบจะส่งรหัส OTP 6 หลักไปที่อีเมลนี้เพื่อยืนยันว่าเป็นของคุณจริง
                </p>
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
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
              >
                {busy ? 'กำลังส่งรหัส OTP...' : 'ส่งรหัส OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSkipEmail(true)
                  setError('')
                  setStep('otp')
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-slate-300 transition hover:bg-white/10"
              >
                ข้ามการยืนยันอีเมล (ตั้งรหัสผ่านอย่างเดียว)
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {skipEmail ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                  ข้ามการยืนยันอีเมล — ระบบจะเก็บอีเมลเดิมไว้ และ<b>ต้องตั้งรหัสผ่านใหม่</b>เพื่อจบการตั้งค่า
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  ส่งรหัสไปที่ <span className="text-cyan-300">{email}</span> แล้ว
                  {!emailSent && (
                    <span className="mt-1 block text-amber-400">
                      ⚠ ระบบส่งอีเมลล้มเหลว — ตรวจสอบ GMAIL_USERNAME / GMAIL_PASSWORD ใน .env ของ backend
                    </span>
                  )}
                </div>
              )}

              {!skipEmail && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">รหัส OTP 6 หลัก</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-center text-lg tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  รหัสผ่านใหม่ <span className="text-rose-400">*</span>
                  <span className="ml-2 text-xs font-normal text-slate-500">(ขั้นนี้ข้ามไม่ได้)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password)
                    return (
                      <li
                        key={rule.message}
                        className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-400' : 'text-slate-500'}`}
                      >
                        <i className={`fas ${passed ? 'fa-check-circle' : 'fa-circle'} text-[8px]`}></i>
                        {rule.message}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
              >
                {busy ? 'กำลังบันทึก...' : 'ยืนยันและตั้งรหัสผ่านใหม่'}
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setSkipEmail(false)
                    setError('')
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-slate-300 transition hover:bg-white/10"
                >
                  เปลี่ยนอีเมล / ส่งรหัสใหม่
                </button>
                {!skipEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setSkipEmail(true)
                      setOtp('')
                      setError('')
                    }}
                    className="flex-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 font-medium text-amber-300 transition hover:bg-amber-500/20"
                  >
                    ข้ามขั้นตอนยืนยัน OTP
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
