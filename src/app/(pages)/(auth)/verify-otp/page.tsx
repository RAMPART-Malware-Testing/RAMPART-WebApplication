'use client'

export const dynamic = "force-dynamic"

import { useState, useRef, Suspense } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useSearchParams, useRouter } from 'next/navigation'
import Hero from '@/components/HeroComponent'
import Swal from 'sweetalert2'
import { useToast } from '@/components/ui/ToastProvider'
import Navbarservice from '@/components/Navbarservice'
import GeometricLoader from '@/components/GeometricLoader'



type OtpContent = 'login_confirm' | 'register_confirm' | 'reset_password_confirm'

const OTP_CONFIG: Record<OtpContent, { title: string; description: string; redirectOnSuccess: string; requirePassword: boolean }> = {
  login_confirm: {
    title: 'ยืนยันตัวตนของคุณ',
    description: 'ตรวจสอบความปลอดภัย: กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยังอีเมลของคุณ',
    redirectOnSuccess: '/dashboard',
    requirePassword: false,
  },

  register_confirm: {
    title: 'เปิดใช้งานบัญชี',
    description: 'เกือบเสร็จแล้ว! กรุณากรอกรหัส OTP เพื่อยืนยันการสมัครของคุณ',
    redirectOnSuccess: '/login',
    requirePassword: false,
  },

  reset_password_confirm: {
    title: 'รีเซ็ตรหัสผ่านอย่างปลอดภัย',
    description: 'กรอกรหัส OTP และตั้งรหัสผ่านใหม่ของคุณ',
    redirectOnSuccess: '/login',
    requirePassword: true,
  },
}

export default function VerifyOtpPage() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpPageContent />
    </Suspense>
  )
}

function VerifyOtpPageContent() {
  const notify = useToast();
  const router = useRouter()
  const searchParams = useSearchParams()
  const content = (searchParams.get('content') as OtpContent) ?? 'login_confirm'
  const config = OTP_CONFIG[content] ?? OTP_CONFIG.login_confirm

  const [isSuccessful, setIsSuccessful] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      if (value && index < 5) inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedNumbers = e.clipboardData.getData('text').replace(/\D/g, '').split('').slice(0, 6)
    if (pastedNumbers.length === 6) {
      setOtp(pastedNumbers)
      inputRefs.current[5]?.focus()
    }
  }

  const handleLogout = async () => {
    try {
      // เรียก logout api เพื่อล้าง cookie/session ฝั่ง server
      await axios.get('/logout')
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ", err)
    } finally {
      router.push('/login')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const otpString = otp.join('')
    if (otpString.length !== 6) {
      notify.warning('โปรดป้อนรหัส 6 หลักทั้งหมด.')
      setError('โปรดป้อนรหัส 6 หลักทั้งหมด.')
      return
    }

    if (config.requirePassword) {
      if (newPassword.length < 8) {
        notify.warning('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร.')
        setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร.')
        return
      }
      if (newPassword !== confirmPassword) {
        notify.warning('รหัสผ่านไม่ตรงกัน.')
        setError('รหัสผ่านไม่ตรงกัน.')
        return
      }
    }

    setIsLoading(true)
    try {
      const payload: Record<string, string> = { otp: otpString, type: content }
      if (config.requirePassword) payload.newPasswd = newPassword

      const res = await axios.post('/api/auth/verify-otp', payload)
      console.log(res.data)
      if (res.data.status === 1400) {
        notify.warning(res.data.message || 'ไม่พบโทเค็นการเข้าถึง กรุณาล็อกอินใหม่อีกครั้ง.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500);
        return
      }
      if (res.data.success) {
        setIsSuccessful(true)
        setTimeout(() => {
          setIsSuccessful(false)
          window.location.href = config.redirectOnSuccess
        }, 2000);

        return
      }
      setError(res.data.message || 'รหัส OTP ไม่ถูกต้อง.')
      notify.error(res.data.message || 'รหัส OTP ไม่ถูกต้อง.')
    } catch {
      notify.error('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง.')
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && <GeometricLoader loadingText='กำลังโหลด'/>}
      {isSuccessful && <GeometricLoader loadingText='ยืนยัน OTP สำเร็จ'/>}
      <Navbarservice />

      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated gradient blobs background - เหมือนกับหน้า Landing Page */}
        <div className="fixed inset-0 overflow-hidden -z-10">
          <div className="blob-bg top-[-200px] left-[-150px] animate-pulse" style={{ animationDuration: "12s" }} />
          <div
            className="blob-bg bottom-[-250px] right-[-200px]"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.1) 70%)",
              animationDelay: "-3s",
              animationDuration: "15s",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] top-1/3 left-1/4 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse"
            style={{ animationDuration: "18s" }}
          />
          <div className="absolute w-[600px] h-[600px] bottom-10 right-0 bg-indigo-600/10 blur-[120px] spin-slow" />
        </div>

        {/* Background Decor - คงไว้ */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Grid Pattern - คงไว้ */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        <div className="relative z-10 w-full max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            {/* Left Side: Brand Identity (Visible on Desktop) */}
            <Hero>
              <p className="text-xl font-semibold text-white/90">Multi-Factor Authentication</p>
              <p className="text-purple-200/50 max-w-sm">เราได้ส่งรหัสยืนยันไปยังอีเมลที่คุณลงทะเบียนไว้ เพื่อยืนยันตัวตนและรักษาความปลอดภัยของบัญชีของคุณ</p>
            </Hero>

            {/* Right Side: Form Card */}
            <div className="w-full max-w-md flex-1">
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10 hover-glow transition-all duration-500 relative">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                    {config.title}
                  </h2>
                  <p className="text-purple-200/60 text-sm leading-relaxed">{config.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-shake">
                      <div className="flex items-center gap-3 text-red-400">
                        <i className="fas fa-exclamation-triangle"></i>
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* OTP Inputs */}
                  <div className="space-y-3">
                    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-full h-14 sm:h-16 text-center bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold focus:ring-2 focus:ring-purple-500 focus:bg-white/10 transition-all outline-none"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Reset Password Fields */}
                  {config.requirePassword && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-purple-400 transition-colors">
                          <i className="fas fa-key text-purple-400/60"></i>
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New Secure Password"
                          className="w-full pl-11 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/30 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400/60 hover:text-purple-400"
                        >
                          <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-purple-400 transition-colors">
                          <i className="fas fa-check-circle text-purple-400/60"></i>
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm Password"
                          className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/30 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Buttons Container */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || otp.join("").length < 6}
                      className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 rounded-2xl font-bold text-white shadow-[0_8px_32px_rgba(128,90,213,0.4)] hover:shadow-[0_12px_40px_rgba(128,90,213,0.7)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                      <span className="relative z-10 flex items-center gap-3">
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <i className="fas fa-lock-open"></i>
                            <span>{config.requirePassword ? "ยืนยันการรีเซ็ตรหัสผ่าน" : "ยืนยัน OTP"}</span>
                          </>
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-4 rounded-2xl font-semibold text-gray-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all border border-gray-200 hover:border-red-500/20 flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      ยกเลิกการยืนยัน
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
      @keyframes floatOrb {
        0% {
          transform: translate(0px, 0px) scale(1);
          opacity: 0.6;
        }
        50% {
          transform: translate(30px, -40px) scale(1.2);
          opacity: 0.9;
        }
        100% {
          transform: translate(-20px, 30px) scale(1);
          opacity: 0.6;
        }
      }

      @keyframes slowSpin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .spin-slow {
        animation: slowSpin 20s linear infinite;
      }

      .blob-bg {
        position: absolute;
        width: 700px;
        height: 700px;
        background: radial-gradient(
          circle,
          rgba(79, 70, 229, 0.25) 0%,
          rgba(6, 182, 212, 0.1) 70%,
          transparent 100%
        );
        filter: blur(70px);
        border-radius: 50%;
        z-index: 0;
      }

      .hover-glow {
        transition: all 0.4s ease;
      }

      .hover-glow:hover {
        box-shadow: 0 0 28px rgba(99, 102, 241, 0.6);
        transform: translateY(-6px) scale(1.01);
      }

      @keyframes shake {
        0%,
        100% {
          transform: translateX(0);
        }
        20%,
        60% {
          transform: translateX(-5px);
        }
        40%,
        80% {
          transform: translateX(5px);
        }
      }
      .animate-shake {
        animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      }
    `}</style>
      </div>
    </>

  );
}