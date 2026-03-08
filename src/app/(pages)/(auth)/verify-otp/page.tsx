'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useSearchParams, useRouter } from 'next/navigation'
import Hero from '@/components/HeroComponent'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const content = (searchParams.get('content') as OtpContent) ?? 'login_confirm'
  const config = OTP_CONFIG[content] ?? OTP_CONFIG.login_confirm

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
      setError('โปรดป้อนรหัส 6 หลักทั้งหมด.')
      return
    }

    if (config.requirePassword) {
      if (newPassword.length < 8) {
        setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน.')
        return
      }
    }

    setIsLoading(true)
    try {
      const payload: Record<string, string> = { otp: otpString, type: content }
      if (config.requirePassword) payload.newPasswd = newPassword

      const res = await axios.post('/api/auth/verify-otp', payload)
      if (res.data.success) {
        router.push(config.redirectOnSuccess)
        return
      }
      setError(res.data.message || 'รหัส OTP ไม่ถูกต้อง.')
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

          {/* Left Side: Brand Identity (Visible on Desktop) */}

          <Hero >
            <p className="text-xl font-semibold text-white/90">Multi-Factor Authentication</p>
            <p className="text-blue-200/50 max-w-sm ">เราได้ส่งรหัสยืนยันไปยังอีเมลที่คุณลงทะเบียนไว้ เพื่อยืนยันตัวตนและรักษาความปลอดภัยของบัญชีของคุณ</p>
          </Hero>


          {/* Right Side: Form Card */}
          <div className="w-full max-w-md flex-1">
            <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10 relative">

              <div className="text-center mb-8">
    
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{config.title}</h2>
                <p className="text-blue-200/60 text-sm leading-relaxed">{config.description}</p>
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
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-full h-14 sm:h-16 text-center bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold focus:ring-2 focus:ring-cyan-500 focus:bg-white/10 transition-all outline-none"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Reset Password Fields */}
                {config.requirePassword && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-cyan-400 transition-colors">
                        <i className="fas fa-key text-blue-400/60"></i>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Secure Password"
                        className="w-full pl-11 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/30 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-400/60 hover:text-cyan-400"
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-cyan-400 transition-colors">
                        <i className="fas fa-check-circle text-blue-400/60"></i>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/30 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Buttons Container */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full bg-gradient-to-r from-white to-gray-100 text-gray-700 py-4 rounded-2xl font-bold shadow-lg shadow-gray-500/20 hover:shadow-gray-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 border border-gray-200"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <i className="fas fa-lock-open text-gray-600"></i>
                        <span>{config.requirePassword ? 'ยืนยันการรีเซ็ตรหัสผ่าน' : 'ยืนยัน OTP'}</span>
                      </>
                    )}
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  )
}