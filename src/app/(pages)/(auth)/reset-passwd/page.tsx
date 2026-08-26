'use client'

import { useState, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import Hero from '@/components/HeroComponent'
import { useToast } from '@/components/ui/ToastProvider'
import Navbarservice from '@/components/Navbarservice'
import GeometricLoader from '@/components/GeometricLoader'


export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccessful, setIsSuccessful] = useState(false)

  const notify = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await axios.post('/api/auth/reset-passwd', { email })

      if (res.data.success) {
        setIsSuccessful(true)
        const token = res.data.token ? `&token=${encodeURIComponent(res.data.token)}` : ''
        setTimeout(() => {
          setIsSuccessful(false)
          window.location.href = `/verify-otp?content=reset_password_confirm${token}`
        }, 1500);
        return
      }

    } catch (err: any) {
      notify.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง.')
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
  <>
      {isLoading && <GeometricLoader loadingText='กำลังโหลด'/>}
      {isSuccessful && <GeometricLoader loadingText='กำลังส่งลิงก์รีเซ็ตรหัสผ่าน'/>}
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

      {/* Background Elements เดิม */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
          {/* Hero Section */}
          <Hero />

          {/* Reset Password Form */}
          <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-10 hover-glow transition-all duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                  รีเซ็ตรหัสผ่าน
                </h2>
                <p className="text-purple-200/60 text-sm">กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
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
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 backdrop-blur-sm"
                      placeholder="rampart@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-4 rounded-2xl font-bold text-white shadow-[0_8px_32px_rgba(128,90,213,0.4)] hover:shadow-[0_12px_40px_rgba(128,90,213,0.7)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 flex items-center justify-center space-x-3 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <div className="relative z-10 flex items-center space-x-3">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>กำลังดำเนินการ...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane text-lg"></i>
                        <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
                      </>
                    )}
                  </div>
                </button>
              </form>

              <div className="text-center mt-8 pt-6 border-t border-white/10">
                <p className="text-sm text-purple-200/60">
                  จำรหัสผ่านได้แล้ว?{' '}
                  <a href="/login" className="font-bold text-purple-400 hover:text-purple-300 transition-colors duration-200">
                    กลับไปเข้าสู่ระบบ
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