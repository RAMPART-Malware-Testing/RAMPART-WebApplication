'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import ReCAPTCHA from "react-google-recaptcha"
import Link from 'next/link'
import axios from 'axios'
import Hero from '@/components/HeroComponent'
import { useToast } from '@/components/ui/ToastProvider'
import Navbarservice from '@/components/Navbarservice'
import GeometricLoader from '@/components/GeometricLoader'
import CaptchaModal from '@/components/CaptchaModal'
import { validatePassword } from '@/lib/password'

export default function RegisterPage() {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
   const [isSuccessful, setIsSuccessful] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [captchaOpen, setCaptchaOpen] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const notify = useToast();

  const EMAIL_PATTERN = /^[^\s@+]+@[^\s@]+\.[^\s@]+$/

  const validateForm = () => {
    if (username.length < 3) {

      return 'Username ต้องมีอย่างน้อย 3 ตัวอักษร'
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'รูปแบบ Email ไม่ถูกต้อง หรือไม่รองรับ Email ที่มีเครื่องหมาย +'
    }

    const passError = validatePassword(password)
    if (passError) {
      return passError
    }

    if (password !== confirmPassword) {
      return 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'
    }

    return ''
  }

  const resetCaptcha = () => {
    recaptchaRef.current?.reset()
    setRecaptchaToken('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit()
  }

  const submit = async (tokenOverride?: string) => {
    setPasswordError('')

    const formError = validateForm()
    if (formError) {
      notify.warning(formError)
      return
    }
    const token = tokenOverride ?? recaptchaToken
    if (!token) {
      setPendingSubmit(true)
      setCaptchaOpen(true)
      notify.warning('กรุณายืนยัน reCAPTCHA เพื่อดำเนินการต่อ')
      return
    }

    setPendingSubmit(false)
    setIsLoading(true)

    try {
      const { data } = await axios.post('/api/auth/register', {
        username,
        email,
        password,
        recaptchaToken: token,
      }, { validateStatus: () => true })

      if (data.success) {
        setIsSuccessful(true)
        const token = data.token ? `?content=register_confirm&token=${encodeURIComponent(data.token)}` : ''
        setTimeout(() => {
          setIsSuccessful(false)
          window.location.href = `/verify-otp${token}`
        }, 1500);
        return
      }

      if (!data.success) {
        switch (data.status) {
          case 400:
            notify.error(data.message || 'มีบัญชีผู้ใช้นี้อยู่แล้ว')
            break
          case 404:
            notify.error(data.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
            break
          default:
            notify.error(data.message || 'การลงทะเบียนไม่สำเร็จ')
        }
      } else {
        notify.error(data.message || 'การลงทะเบียนไม่สำเร็จ')
      }

      resetCaptcha()
    } catch (err) {
      notify.error('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
      resetCaptcha()
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
    notify.warning('reCAPTCHA หมดอายุ กรุณายืนยันใหม่อีกครั้ง.')
  }

  const handleCaptchaClose = () => {
    setCaptchaOpen(false)
    setPendingSubmit(false)
  }

  return (
    <>
      {isLoading && <GeometricLoader loadingText='กำลังโหลด'/>}
      {isSuccessful && <GeometricLoader loadingText='กำลังสมัครสมาชิก'/>}
      <CaptchaModal
        open={captchaOpen}
        captchaRef={recaptchaRef}
        onVerify={handleCaptchaChange}
        onExpired={handleCaptchaExpired}
        onClose={handleCaptchaClose}
        description="กรุณายืนยัน reCAPTCHA เพื่อสมัครสมาชิก"
      />
      <Navbarservice />
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,119,198,0.18),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(59,130,246,0.12),transparent_55%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        <div className="relative z-10 w-full max-w-6xl mt-15">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            <Hero />

            <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
              <div className="bg-white/5 rounded-3xl shadow-[0_8px_32px_rgba(128,90,213,0.25)] border border-white/10 p-8 lg:p-10 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(128,90,213,0.4)]">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                    สมัครสมาชิก
                  </h2>
                  <p className="text-purple-200/60 text-sm">สร้างบัญชีเพื่อใช้บริการวิเคราะห์มัลแวร์</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-3">
                    <label htmlFor="username" className="block text-sm font-semibold text-purple-100">
                      ชื่อผู้ใช้งาน
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <i className="fas fa-user text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                      </div>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-colors duration-200"
                        placeholder="ชาลาเปา"
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="email" className="block text-sm font-semibold text-purple-100">
                      อีเมล
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <i className="fas fa-envelope text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-colors duration-200"
                        placeholder="rampart@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="password" className="block text-sm font-semibold text-purple-100">
                      รหัสผ่าน
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <i className="fas fa-lock text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-colors duration-200"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-purple-400 hover:text-purple-300 text-lg`}></i>
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-2">
                        <i className="fas fa-info-circle"></i>
                        {passwordError}
                      </p>
                    )}
                    <p className="text-xs text-purple-200/60 mt-1">
                      รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-purple-100">
                      ยืนยันรหัสผ่านอีกครั้ง
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                        <i className="fas fa-lock text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-colors duration-200"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-purple-400 hover:text-purple-300 text-lg`}></i>
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
                          <span>กำลังสร้างบัญชี...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus text-lg"></i>
                          <span>สร้างบัญชีผู้ใช้</span>
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="text-center mt-8 pt-6 border-t border-white/10">
                  <p className="text-sm text-purple-200/60">
                    มีบัญชีแล้ว?{' '}
                    <Link href="/login" className="font-bold text-purple-400 hover:text-purple-300 transition-colors duration-200">
                      เข้าสู่ระบบ
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-1/4 left-1/6 opacity-10 animate-float">
          <i className="fas fa-virus text-purple-400 text-2xl"></i>
        </div>
        <div className="absolute top-1/3 right-1/5 opacity-10 animate-float delay-1000">
          <i className="fas fa-code text-indigo-400 text-2xl"></i>
        </div>
        <div className="absolute bottom-1/4 left-1/4 opacity-10 animate-float delay-1500">
          <i className="fas fa-lock text-purple-400 text-2xl"></i>
        </div>
        <div className="absolute bottom-1/3 right-1/6 opacity-10 animate-float delay-500">
          <i className="fas fa-shield-alt text-indigo-400 text-2xl"></i>
        </div>

        <style jsx global>{`
      @keyframes float {
        0% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-20px);
        }
        100% {
          transform: translateY(0px);
        }
      }

      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
    `}</style>
      </div>
    </>

  );
}