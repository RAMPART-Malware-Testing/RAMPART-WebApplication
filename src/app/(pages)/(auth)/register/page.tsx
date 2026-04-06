'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import ReCAPTCHA from "react-google-recaptcha"
import Link from 'next/link'
import Hero from '@/components/HeroComponent'
import { useToast } from '@/components/ui/ToastProvider'
import Navbarservice from '@/components/Navbarservice'
import GeometricLoader from '@/components/GeometricLoader'



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
  const [isVerified, setIsVerified] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isshowCaptcha, setIsshowCaptcha] = useState(false)
  const [needCaptcha, setNeedCaptcha] = useState(false)

  const notify = useToast();

  const validateForm = () => {
    if (username.length < 3) {

      return 'Username ต้องมีอย่างน้อย 3 ตัวอักษร'
    }

    if (!email.includes('@')) {
      return 'รูปแบบ Email ไม่ถูกต้อง'
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

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      notify.warning('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร.')
      return 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
    }
    if (!/[A-Z]/.test(pass)) {
      notify.warning('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว.')
      return 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว'
    }
    if (!/[a-z]/.test(pass)) {
      notify.warning('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว.')
      return 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว'
    }
    if (!/[0-9]/.test(pass)) {
      notify.warning('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว.')
      return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      notify.warning('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว.')
      return 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว'
    }
    return ''
  }

  const resetCaptcha = () => {
    recaptchaRef.current?.reset()
    setIsVerified(false)
    setRecaptchaToken('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPasswordError('')

    const formError = validateForm()
    if (formError) {
      setError(formError)
      return
    }

    if (!needCaptcha) {
      setNeedCaptcha(true)
      setIsshowCaptcha(true)
      setError('กรุณายืนยัน reCAPTCHA เพื่อดำเนินการต่อ')
      notify.warning('กรุณายืนยัน reCAPTCHA เพื่อดำเนินการต่อ')
      return
    }

    if (!isVerified || !recaptchaToken) {
      setError('กรุณายืนยัน reCAPTCHA')
      notify.warning('กรุณายืนยัน reCAPTCHA')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          recaptchaToken,
        }),
      })

      const data = await response.json()

      // Handle success
      // Expected: { "success": true, "status": 200, ... }
      if (response.ok && data.success) {
        setIsSuccessful(true)
        setTimeout(() => {
          setIsSuccessful(false)
          window.location.href = '/verify-otp'
        }, 2000);
        return
      }

      // Handle known error cases
      // { "success": false, "status": 400, "message": "User already exists." }
      // { "success": false, "status": 404, "message": "Connect Server Error!!!" }
      if (!data.success) {
        switch (data.status) {
          case 400:
            notify.error(data.message || 'มีบัญชีผู้ใช้นี้อยู่แล้ว')
            setError(data.message || 'มีบัญชีผู้ใช้นี้อยู่แล้ว')
            break
          case 404:
            notify.error(data.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
            setError(data.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
            break
          default:
            notify.error(data.message || 'การลงทะเบียนไม่สำเร็จ')
            setError(data.message || 'การลงทะเบียนไม่สำเร็จ')
        }
      } else {
        notify.error(data.message || 'การลงทะเบียนไม่สำเร็จ')
        setError(data.message || 'การลงทะเบียนไม่สำเร็จ')
      }

      resetCaptcha()
    } catch (err) {
      notify.error('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
      resetCaptcha()
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaChange = (token: string | null) => {
    setRecaptchaToken(token || '')
    setIsVerified(!!token)
    // Clear captcha-related error when user completes it
    if (token) {
      setError('')
    }
  }

  const handleCaptchaExpired = () => {
    setIsVerified(false)
    setRecaptchaToken('')
    notify.warning('reCAPTCHA หมดอายุ กรุณายืนยันใหม่อีกครั้ง.')
    setError('reCAPTCHA หมดอายุ กรุณายืนยันใหม่อีกครั้ง')
  }

  return (
    <>
      {isLoading && <GeometricLoader loadingText='กำลังโหลด'/>}
      {isSuccessful && <GeometricLoader loadingText='กำลังสมัครสมาชิก'/>}
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

        {/* Animated Background Elements - คงไว้ */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Grid Pattern - คงไว้ */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-6xl mt-15">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
            {/* Logo Section */}
            <Hero />

            {/* Register Form */}
            <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10 hover-glow transition-all duration-500">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                    สมัครสมาชิก
                  </h2>
                  <p className="text-purple-200/60 text-sm">สร้างบัญชีเพื่อใช้บริการวิเคราะห์มัลแวร์</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm animate-shake">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-exclamation-circle text-red-400"></i>
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Username Field */}
                  <div className="space-y-3">
                    <label htmlFor="username" className="block text-sm font-semibold text-purple-100">
                      ชื่อผู้ใช้งาน
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-user text-purple-400 text-lg"></i>
                      </div>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 backdrop-blur-sm"
                        placeholder="ชาลาเปา"
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-3">
                    <label htmlFor="email" className="block text-sm font-semibold text-purple-100">
                      อีเมล
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-envelope text-purple-400 text-lg"></i>
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 backdrop-blur-sm"
                        placeholder="rampart@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-3">
                    <label htmlFor="password" className="block text-sm font-semibold text-purple-100">
                      รหัสผ่าน
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-lock text-purple-400 text-lg"></i>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 backdrop-blur-sm"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 hover:scale-110 z-10"
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

                  {/* Confirm Password Field */}
                  <div className="space-y-3">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-purple-100">
                      ยืนยันรหัสผ่านอีกครั้ง
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <i className="fas fa-lock text-purple-400 text-lg"></i>
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 backdrop-blur-sm"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 hover:scale-110 z-10"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-purple-400 hover:text-purple-300 text-lg`}></i>
                      </button>
                    </div>
                  </div>

                  {/* reCAPTCHA */}
                  {isshowCaptcha && (
                    <div className="flex justify-center py-2">
                      <ReCAPTCHA
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LcGkdsrAAAAAFW6CFipeSplG7nLqICIKPm-gSln"}
                        ref={recaptchaRef}
                        onChange={handleCaptchaChange}
                        onExpired={handleCaptchaExpired}
                      />
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={isLoading || (needCaptcha && !isVerified)}
                    className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-4 rounded-2xl font-bold text-white shadow-[0_8px_32px_rgba(128,90,213,0.4)] hover:shadow-[0_12px_40px_rgba(128,90,213,0.7)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 flex items-center justify-center space-x-3 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
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

                {/* Login Link */}
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

        {/* Floating Security Icons - คงไว้ */}
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

      .animate-float {
        animation: float 6s ease-in-out infinite;
      }

      @keyframes shake {
        0%,
        100% {
          transform: translateX(0);
        }
        25% {
          transform: translateX(-5px);
        }
        75% {
          transform: translateX(5px);
        }
      }

      .animate-shake {
        animation: shake 0.2s ease-in-out 0s 2;
      }
    `}</style>
      </div>
    </>

  );
}