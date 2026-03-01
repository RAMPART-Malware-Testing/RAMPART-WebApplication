'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !canResend) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedNumbers = pastedData.replace(/\D/g, '').split('').slice(0, 6)

    if (pastedNumbers.length === 6) {
      const newOtp = [...otp]
      pastedNumbers.forEach((num, index) => {
        newOtp[index] = num
      })
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const resetOtpInputs = () => {
    setOtp(['', '', '', '', '', ''])
    setTimeout(() => inputRefs.current[0]?.focus(), 50)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก')
      return
    }

    setIsLoading(true)

    try {
      const res = await axios.post('/api/auth/verify-otp', { otp: otpString })
      const data = res.data

      // ── Success ──────────────────────────────────────────────────────────
      // Expected: { success: true, type: "...", message: "...", redirect: "/some/path" }
      if (data.success) {
        if (data.redirect) {
          window.location.href = data.redirect
        } else {
          // Fallback ในกรณีที่ API ไม่ส่ง redirect มา
          window.location.href = '/dashboard'
        }
        return
      }

      // ── Error ─────────────────────────────────────────────────────────────
      // Expected: { success: false, type: "...", message: "..." }
      // Expected (token invalid): { success: false, message: "Access token type is not valid..." }
      const message = data.message || 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'

      if (message.toLowerCase().includes('expired')) {
        setError('รหัส OTP หมดอายุแล้ว กำลังนำคุณกลับไปหน้าก่อนหน้า...')
        setTimeout(() => window.location.reload(), 3000)
        return
      }

      if (
        message.toLowerCase().includes('access token') ||
        message.toLowerCase().includes('no access token') ||
        message.toLowerCase().includes('invalid or expired')
      ) {
        setError('Session หมดอายุ กำลังนำคุณกลับไปหน้าก่อนหน้า...')
        setTimeout(() => window.location.reload(), 3000)
        return
      }

      setError(message)
      resetOtpInputs()

    } catch (err) {
      console.error('OTP verification error:', err)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
      resetOtpInputs()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        setCountdown(30)
        setCanResend(false)
        resetOtpInputs()
      } else {
        setError(data.message || 'ไม่สามารถส่ง OTP ใหม่ได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
                  <div className="w-16 h-16 relative">
                    <Image
                      src="/RAMPART-LOGO.png"
                      alt="RAMPART Security"
                      fill
                      className="object-contain filter drop-shadow-lg"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent tracking-tight">
                RAMPART
              </h1>
              <p className="text-blue-200/70 text-sm font-medium">
                Threat Analysis Platform
              </p>
            </div>
          </div>

          {/* OTP Form Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Verify OTP Code
              </h2>
              <p className="text-blue-200/60 text-sm mb-4">
                We've sent a 6-digit code to your email
              </p>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <i className="fas fa-envelope text-lg"></i>
                <span className="text-sm font-medium">admin@admin.com</span>
                <Link
                  href="/login"
                  className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors underline"
                >
                  (Change)
                </Link>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm animate-shake">
                <div className="flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* OTP Inputs */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-blue-100 text-center">
                Enter 6-Digit OTP Code
              </label>

              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center bg-white/5 border-2 border-white/10 rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 backdrop-blur-sm hover:border-cyan-500/30"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p className="text-xs text-blue-200/50 text-center">
                <i className="fas fa-info-circle mr-1"></i>
                Paste your OTP code or type each digit
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="text-center bg-white/5 rounded-xl p-4 border border-white/10">
              {!canResend ? (
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-clock text-blue-400"></i>
                  <p className="text-blue-200/80 text-sm">
                    Resend code in{' '}
                    <span className="text-cyan-400 font-mono font-bold text-lg">
                      {String(countdown).padStart(2, '0')}
                    </span>{' '}
                    seconds
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <i className="fas fa-redo-alt"></i>
                  Resend OTP Code
                </button>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 px-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden group"
            >
              <div className="w-full absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:from-cyan-500 group-hover:to-blue-600 transition-all duration-300"></div>
              <div className="relative z-10 flex items-center space-x-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle text-lg"></i>
                    <span>Verify OTP</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-blue-200/60">
              Having trouble?{' '}
              <Link
                href="/login"
                className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 text-xs text-blue-200/40 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
            <div className="flex items-center space-x-2">
              <i className="fas fa-shield-alt text-cyan-400"></i>
              <span>Enterprise Grade Security</span>
            </div>
            <div className="w-1 h-1 bg-blue-200/20 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-bolt text-cyan-400"></i>
              <span>CAPEv2 & MobSF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Security Icons */}
      <div className="absolute top-1/4 left-1/6 opacity-10 animate-float">
        <i className="fas fa-shield-check text-cyan-400 text-2xl"></i>
      </div>
      <div className="absolute top-1/3 right-1/5 opacity-10 animate-float delay-1000">
        <i className="fas fa-key text-blue-400 text-2xl"></i>
      </div>
      <div className="absolute bottom-1/4 left-1/4 opacity-10 animate-float delay-1500">
        <i className="fas fa-mobile-alt text-cyan-400 text-2xl"></i>
      </div>
      <div className="absolute bottom-1/3 right-1/6 opacity-10 animate-float delay-500">
        <i className="fas fa-lock text-blue-400 text-2xl"></i>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .delay-500 { animation-delay: 0.5s; }
        .delay-1000 { animation-delay: 1s; }
        .delay-1500 { animation-delay: 1.5s; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(74, 222, 128, 0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(74, 222, 128, 0.5); }
      `}</style>
    </div>
  )
}