'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import ReCAPTCHA from "react-google-recaptcha"
import axios from 'axios'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate reCAPTCHA
    // if (!isVerified || !recaptchaToken) {
    //   setError('กรุณายืนยัน reCAPTCHA')
    //   return
    // }

    setIsLoading(true)

    try {
      axios.post('/api/auth/login', {
        username:email,
        password,
        recaptchaToken,
      }).then((res) => {
        console.log('Login successful:', res.data)
        // Login สำเร็จ - redirect ไปหน้า dashboard
        window.location.href = '/auth/verify-otp'
      }).catch((err) => {
        // แสดง error message
        setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        // Reset reCAPTCHA
        recaptchaRef.current?.reset()
        setIsVerified(false)
        setRecaptchaToken('')
      });
    } catch (error) {
      console.error('Login error:', error)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
      // Reset reCAPTCHA
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
  }

  const handleCaptchaExpired = () => {
    setIsVerified(false)
    setRecaptchaToken('')
  }

  const handleOninputChange = () => {
    if (!isshowCaptcha) {
      if (email.length > 5 && password.length > 5){
        setIsshowCaptcha(true);
      }
    }
  }

  return (
    <>
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
        <div className="relative z-10 w-full max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

            {/* Logo Section */}
            <div className="text-center lg:text-left space-y-8 flex-1">
              <div className="flex lg:justify-start mb-6">
                <div className="relative">
                  {/* Glow Effect */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl blur-xl opacity-20 animate-pulse"></div>

                  {/* Logo Container */}
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                    <div className="w-32 h-32 lg:w-40 lg:h-40 relative">
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

              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent tracking-tight">
                  RAMPART
                </h1>
                <div className="space-y-3">
                  <p className="text-xl lg:text-2xl font-semibold text-white/90">
                    {/* Threat Analysis Malware Platform */}
                  </p>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    เข้าสู่ระบบ
                  </h2>
                  <p className="text-blue-200/60 text-sm">
                    เข้าสู่ระบบเพื่อใช้บริการวิเคราะห์มัลแวร์
                  </p>
                </div>

                <form onSubmit={handleSubmit} onInput={handleOninputChange} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-exclamation-circle text-red-400"></i>
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-3">
                    <label htmlFor="email" className="block text-sm font-semibold text-blue-100">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-envelope text-cyan-400 text-lg"></i>
                      </div>
                      <input
                        type="text"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm"
                        placeholder="analyst@rampart.security"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label htmlFor="password" className="block text-sm font-semibold text-blue-100">
                        Password
                      </label>
                      <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-medium">
                        Forgot Password?
                      </a>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-lock text-cyan-400 text-lg"></i>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 hover:scale-110 z-10"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-cyan-400 hover:text-cyan-300 text-lg`}></i>
                      </button>
                    </div>
                  </div>

                  {/* reCAPTCHA Placeholder */}
                  {isshowCaptcha && (
                    <div className="flex justify-center py-2 transform hover:scale-105 transition-transform duration-200">
                      <ReCAPTCHA
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                        ref={recaptchaRef}
                        onChange={handleCaptchaChange}
                        onExpired={handleCaptchaExpired}
                      />
                    </div>
                  )}

                  {/* Login Button */}
                  <button
                    type="submit"
                    // disabled={isLoading || !isVerified}
                    disabled={false}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 px-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden group"
                  >
                    {/* Animated background */}
                    <div className="w-full absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 group-hover:from-cyan-500 group-hover:to-blue-600 transition-all duration-300"></div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center space-x-3">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-fingerprint text-lg"></i>
                          <span>Secure Login</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {/* Register Link */}
                <div className="text-center mt-8 pt-6 border-t border-white/10">
                  <p className="text-sm text-blue-200/60">
                    New to RAMPART?{' '}
                    <a href="register" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                      Create Account
                    </a>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating Security Icons */}
        <div className="absolute top-1/4 left-1/6 opacity-10 animate-float">
          <i className="fas fa-virus text-cyan-400 text-2xl"></i>
        </div>
        <div className="absolute top-1/3 right-1/5 opacity-10 animate-float delay-1000">
          <i className="fas fa-code text-blue-400 text-2xl"></i>
        </div>
        <div className="absolute bottom-1/4 left-1/4 opacity-10 animate-float delay-1500">
          <i className="fas fa-lock text-cyan-400 text-2xl"></i>
        </div>
        <div className="absolute bottom-1/3 right-1/6 opacity-10 animate-float delay-500">
          <i className="fas fa-shield-alt text-blue-400 text-2xl"></i>
        </div>

        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          .delay-500 {
            animation-delay: 0.5s;
          }
          .delay-1000 {
            animation-delay: 1s;
          }
          .delay-1500 {
            animation-delay: 1.5s;
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(74, 222, 128, 0.3);
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(74, 222, 128, 0.5);
          }
        `}</style>
      </div>
    </>
  )
}
