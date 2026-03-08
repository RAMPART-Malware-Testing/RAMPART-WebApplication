'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import ReCAPTCHA from "react-google-recaptcha"
import axios from 'axios'
import Swal from 'sweetalert2'
import Hero from '@/components/HeroComponent'
import { useToast } from '@/components/ui/ToastProvider'

export default function LoginPage() {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [isshowCaptcha, setIsshowCaptcha] = useState(false);

  // ตรวจสอบข้อมูลแบบ Real-time เพื่อแสดง Captcha
  useEffect(() => {
    if (email.length > 5 && password.length > 5) {
      setIsshowCaptcha(true);
    } else {
      setIsshowCaptcha(false);
      setIsVerified(false);
      setRecaptchaToken('');
    }
  }, [email, password]);

  const notify = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // ตรวจสอบ reCAPTCHA ก่อนส่ง API
    if (!isVerified || !recaptchaToken) {
      setError('กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ (reCAPTCHA)')
      return
    }

    setIsLoading(true)

    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password,
        recaptchaToken,
      });

      if (res.data.success) {
        notify.success(res.data.message);

        setTimeout(() => {
          window.location.href = "/verify-otp?content=login_confirm";
        }, 1500);
      } else {
        notify.error(res.data.message);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      // Reset reCAPTCHA เมื่อเกิด Error เพื่อความปลอดภัย
      recaptchaRef.current?.reset()
      setIsVerified(false)
      setRecaptchaToken('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaChange = (token: string | null) => {
    setRecaptchaToken(token || '')
    setIsVerified(!!token)
    if (token) setError('') // ล้าง error เมื่อติ๊กถูก
  }

  const handleCaptchaExpired = () => {
    setIsVerified(false)
    setRecaptchaToken('')
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e293b] flex items-center justify-center p-4 relative overflow-hidden">
        {/* ... (Background elements เหมือนเดิม) ... */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            {/* Logo Section */}
            <Hero />

            {/* Login Form */}
            <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">เข้าสู่ระบบ</h2>
                  <p className="text-blue-200/60 text-sm">เข้าสู่ระบบเพื่อใช้บริการวิเคราะห์มัลแวร์</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm animate-shake">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-exclamation-circle text-red-400"></i>
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-blue-100">อีเมล</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-envelope text-cyan-400 text-lg"></i>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 backdrop-blur-sm"
                        placeholder="rampart@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-blue-100">รหัสผ่าน</label>
                      <a href="/reset-passwd" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-medium">ลืมรหัสผ่าน?</a>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-lock text-cyan-400 text-lg"></i>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 backdrop-blur-sm"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 hover:scale-110 z-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-cyan-400 hover:text-cyan-300 text-lg`}></i>
                      </button>
                    </div>
                  </div>

                  {/* reCAPTCHA - จะปรากฏเมื่อ email และ password ยาวพอ */}
                  {isshowCaptcha && (
                    <div className="flex justify-center py-2 transition-all duration-500 ease-out transform scale-100 animate-fade-in">
                      <ReCAPTCHA
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                        ref={recaptchaRef}
                        onChange={handleCaptchaChange}
                        onExpired={handleCaptchaExpired}
                        theme="dark"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || (isshowCaptcha && !isVerified)}
                    className="w-full bg-gradient-to-r from-white to-gray-100 text-gray-700 py-4 px-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-gray-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden group border border-gray-200"
                  >
                    {/* Animated background */}
                    <div className="w-full absolute inset-0 bg-gradient-to-r from-gray-100 to-white group-hover:from-white group-hover:to-gray-100 transition-all duration-300"></div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center space-x-3">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin"></div>
                          <span>กำลังตรวจสอบ...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-fingerprint text-lg text-gray-600"></i>
                          <span>เข้าสู่ระบบ</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>

                <div className="text-center mt-8 pt-6 border-t border-white/10">
                  <p className="text-sm text-blue-200/60">
                    ยังไม่มีบัญชี?{' '}
                    <a href="/register" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors duration-200">สร้างบัญชี</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        `}</style>
      </div>
    </>
  )
}