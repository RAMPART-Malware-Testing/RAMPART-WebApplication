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

export default function LoginPage() {
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [requireCaptcha, setRequireCaptcha] = useState(false)

  const notify = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (requireCaptcha && !isVerified) {
      notify.warning('กรุณายืนยัน reCAPTCHA ก่อนเข้าสู่ระบบ')
      setError('กรุณายืนยัน reCAPTCHA ก่อนเข้าสู่ระบบ')
      return
    }

    setIsLoading(true)

    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password,
        ...(recaptchaToken && { recaptchaToken }),
      });

      if (res.data.require_captcha) {
        setRequireCaptcha(true)
        setError('กรุณายืนยัน reCAPTCHA เพื่อดำเนินการต่อ')
        notify.warning('กรุณายืนยัน reCAPTCHA เพื่อดำเนินการต่อ')
        return
      }

      if (res.data.success) {
        setIsSuccessful(true)
        const token = res.data.requireOtp ? `&token=${encodeURIComponent(res.data.token)}` : ''
        const target = res.data.requireOtp
          ? `/verify-otp?content=login_confirm${token}`
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
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
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
    if (token) setError('')
  }

  const handleCaptchaExpired = () => {
    setIsVerified(false)
    setRecaptchaToken('')
  }

  return (
  <>
    {isLoading && <GeometricLoader loadingText='กำลังโหลด'/>}
    {isSuccessful && <GeometricLoader loadingText='กำลังเข้าสู่ระบบ'/>}
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

      {/* Background elements เดิม */}
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
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10 hover-glow transition-all duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                  เข้าสู่ระบบ
                </h2>
                <p className="text-purple-200/60 text-sm">เข้าสู่ระบบเพื่อใช้บริการวิเคราะห์มัลแวร์</p>
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
                  <label className="block text-sm font-semibold text-purple-100">อีเมล</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                      <i className="fas fa-envelope text-purple-400 text-lg"></i>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 backdrop-blur-sm"
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
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                      <i className="fas fa-lock text-purple-400 text-lg"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-300 hover:scale-110 z-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-purple-400 hover:text-purple-300 text-lg`}
                      ></i>
                    </button>
                  </div>
                </div>

                {requireCaptcha && (
                  <div className="flex flex-col items-center gap-2 py-2 animate-fade-in">
                    <p className="text-yellow-400 text-sm">กรุณายืนยันตัวตนเพื่อดำเนินการต่อ</p>
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
                  disabled={isLoading || (requireCaptcha && !isVerified)}
                  className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-4 rounded-2xl font-bold text-white shadow-[0_8px_32px_rgba(128,90,213,0.4)] hover:shadow-[0_12px_40px_rgba(128,90,213,0.7)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
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

              {/* หรือเข้าสู่ระบบด้วย OAuth */}
              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-purple-200/50">หรือ</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/api/auth/google/login"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-sm font-semibold py-3 transition hover:scale-[1.02]"
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

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
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