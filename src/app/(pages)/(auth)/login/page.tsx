'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import ReCAPTCHA from "react-google-recaptcha"
import axios from 'axios'
import Swal from 'sweetalert2'
import Hero from '@/components/HeroComponent'
import { useToast } from '@/components/ui/ToastProvider'
import Navbarservice from '@/components/Navbarservice'
import GeometricLoader from '@/components/GeometricLoader'
import CaptchaModal from '@/components/CaptchaModal'


const OAUTH_ERROR_TEXT: Record<string, string> = {
  OAUTH_PROVIDER_ERROR: 'เข้าสู่ระบบด้วยผู้ให้บริการภายนอกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  OAUTH_EMAIL_MISSING: 'บัญชีผู้ให้บริการนี้ไม่มีอีเมลที่ใช้งานได้ กรุณาใช้บัญชีอื่นหรือสมัครใหม่',
  OAUTH_ACCOUNT_LINKED: 'อีเมลนี้ถูกผูกกับบัญชีอื่นอยู่แล้ว',
  OAUTH_PROVIDER_UNSUPPORTED: 'ยังไม่รองรับผู้ให้บริการนี้',
  OAUTH_CALLBACK_FAILED: 'ยืนยันตัวตนกับผู้ให้บริการไม่สำเร็จ กรุณาลองใหม่',
  OAUTH_TOKEN_MISSING: 'ไม่ได้รับโทเค็นจากผู้ให้บริการ กรุณาลองใหม่',
  OAUTH_SESSION_FAILED: 'สร้างเซสชันไม่สำเร็จ กรุณาลองเข้าสู่ระบบใหม่',
  OAUTH_SERVER_UNREACHABLE: 'เชื่อมต่อเซิร์ฟเวอร์ยืนยันตัวตนไม่ได้ กรุณาตรวจสอบว่า backend รันอยู่ แล้วลองใหม่',
  OAUTH_NOT_CONFIGURED: 'ผู้ให้บริการนี้ยังไม่ได้ตั้งค่าในเซิร์ฟเวอร์ (ตรวจสอบ GOOGLE_/GITHUB_CLIENT_ID/SECRET ใน .env)',
  OAUTH_START_FAILED: 'เริ่มการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  OAUTH_STATE_MISMATCH: 'คำขอเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
  OAUTH_TOKEN_EXCHANGE_FAILED: 'แลกเปลี่ยนโทเค็นกับผู้ให้บริการไม่สำเร็จ กรุณาลองใหม่',
  OAUTH_API_OUTDATED: 'เซิร์ฟเวอร์ยังไม่รองรับการยืนยันตัวตนผ่าน OAuth (ต้องอัปเดต API server ให้มี POST /api/auth/{provider}/bridge)',
}

function oauthErrorText(error: string, message?: string | null) {
  const base = OAUTH_ERROR_TEXT[error] ?? 'เข้าสู่ระบบไม่สำเร็จ'
  return message ? `${base} (${message})` : base
}

export default function LoginPage() {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [captchaOpen, setCaptchaOpen] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const notify = useToast();
  const oauthErrorHandled = useRef(false)

  useEffect(() => {
    if (oauthErrorHandled.current) return
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (!error) return
    oauthErrorHandled.current = true
    notify.error(oauthErrorText(error, params.get('message')))
    window.history.replaceState({}, '', '/login')
  }, [notify])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit()
  }

  const submit = async (tokenOverride?: string) => {
    const token = tokenOverride ?? recaptchaToken

    if (!token) {
      setPendingSubmit(true)
      setCaptchaOpen(true)
      notify.warning('กรุณายืนยัน reCAPTCHA')
      return
    }

    setPendingSubmit(false)
    setIsLoading(true)

    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password,
        recaptchaToken: token,
      });

      if (res.data.require_captcha) {
        recaptchaRef.current?.reset()
        setRecaptchaToken('')
        setPendingSubmit(true)
        setCaptchaOpen(true)
        notify.warning('กรุณายืนยัน reCAPTCHA เพื่อดำเนินการต่อ')
        return
      }

      if (res.data.success) {
        setIsSuccessful(true)
        const otpToken = res.data.requireOtp ? `&token=${encodeURIComponent(res.data.token)}` : ''
        const target = res.data.requireOtp
          ? `/verify-otp?content=login_confirm${otpToken}`
          : '/dashboard'
        setTimeout(() => {
          setIsSuccessful(false)
          window.location.href = target
        }, 1500)
      } else {
        notify.error(res.data.message);
      }

    } catch (err: any) {
      notify.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง.')
      recaptchaRef.current?.reset()
      setRecaptchaToken('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaChange = (token: string | null) => {
    setRecaptchaToken(token || '')
    if (!token) return

    setCaptchaOpen(false)
    if (pendingSubmit) void submit(token)
  }

  const handleCaptchaExpired = () => {
    setRecaptchaToken('')
    setPendingSubmit(false)
  }

  const handleCaptchaClose = () => {
    setCaptchaOpen(false)
    setPendingSubmit(false)
  }

  return (
  <>
    {isLoading && <GeometricLoader loadingText='กำลังโหลด'/>}
    {isSuccessful && <GeometricLoader loadingText='กำลังเข้าสู่ระบบ'/>}
    <CaptchaModal
      open={captchaOpen}
      captchaRef={recaptchaRef}
      onVerify={handleCaptchaChange}
      onExpired={handleCaptchaExpired}
      onClose={handleCaptchaClose}
      description="กรุณายืนยัน reCAPTCHA เพื่อเข้าสู่ระบบ"
    />
    <Navbarservice />
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,119,198,0.18),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(59,130,246,0.12),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-6xl mt-20">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
          <Hero />

          <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
            <div className="bg-white/5 rounded-3xl shadow-[0_8px_32px_rgba(128,90,213,0.25)] border border-white/10 p-8 lg:p-10 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(128,90,213,0.4)]">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                  เข้าสู่ระบบ
                </h2>
                <p className="text-purple-200/60 text-sm">เข้าสู่ระบบเพื่อใช้บริการวิเคราะห์มัลแวร์</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-purple-100">อีเมล</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <i className="fas fa-envelope text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors duration-200"
                      placeholder="rampart@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-purple-100">รหัสผ่าน</label>
                    <a href="/reset-passwd" className="text-xs text-purple-400 hover:text-purple-300 transition-colors duration-200 font-medium">
                      ลืมรหัสผ่าน?
                    </a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <i className="fas fa-lock text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors duration-200"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-purple-400 hover:text-purple-300 text-lg transition-colors`}
                      ></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-4 rounded-2xl font-bold text-white shadow-[0_4px_16px_rgba(128,90,213,0.3)] hover:shadow-[0_4px_16px_rgba(128,90,213,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-shadow duration-300 flex items-center justify-center space-x-3"
                >
                  <span className="relative z-10 flex items-center space-x-3">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>กำลังตรวจสอบ...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-fingerprint text-lg"></i>
                        <span>เข้าสู่ระบบ</span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-purple-200/50">หรือ</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/api/auth/google/login"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold py-3 transition hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </a>
                <a
                  href="/api/auth/github/login"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-900 border border-white/10 text-white text-sm font-semibold py-3 transition hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.13-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"/></svg>
                  GitHub
                </a>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-white/10">
                <p className="text-sm text-purple-200/60">
                  ยังไม่มีบัญชี?{" "}
                  <a href="/register" className="font-bold text-purple-400 hover:text-purple-300 transition-colors duration-200">
                    สร้างบัญชี
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);
}