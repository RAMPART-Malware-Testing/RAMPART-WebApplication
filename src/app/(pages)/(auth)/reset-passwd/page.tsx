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
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,119,198,0.18),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(59,130,246,0.12),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
          <Hero />

          <div className="w-full lg:w-auto lg:min-w-[450px] flex-1 max-w-md">
            <div className="bg-white/5 rounded-3xl shadow-[0_8px_32px_rgba(128,90,213,0.25)] border border-white/10 p-8 lg:p-10 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(128,90,213,0.4)]">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                  รีเซ็ตรหัสผ่าน
                </h2>
                <p className="text-purple-200/60 text-sm">กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-shake">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-exclamation-circle text-red-400"></i>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-purple-100">อีเมล</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <i className="fas fa-envelope text-purple-400 text-lg"></i>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-colors duration-200"
                      placeholder="rampart@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-4 rounded-2xl font-bold text-white shadow-[0_4px_16px_rgba(128,90,213,0.3)] hover:shadow-[0_4px_16px_rgba(128,90,213,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-shadow duration-300 flex items-center justify-center space-x-3"
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