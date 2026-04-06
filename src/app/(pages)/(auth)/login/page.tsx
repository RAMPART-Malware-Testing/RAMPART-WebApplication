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

        setTimeout(() => {
          setIsSuccessful(false)
          window.location.href = "/verify-otp?content=login_confirm";
        }, 2000);
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