'use client'

import { useState } from 'react'
import axios from 'axios'
import GeometricLoader from '@/components/GeometricLoader'
import { useToast } from '@/components/ui/ToastProvider'
import { PASSWORD_RULES, validatePassword } from '@/lib/password'

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,50}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function FirstRunSetupPage() {
  const notify = useToast()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccessful, setIsSuccessful] = useState(false)
  const [error, setError] = useState('')

  const validate = (): string => {
    const trimmedUsername = username.trim()
    if (!trimmedUsername) return 'กรุณากรอกชื่อผู้ใช้'
    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      return 'ชื่อผู้ใช้ต้องมี 3-50 ตัวอักษร และใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง และขีดล่าง'
    }
    const trimmedEmail = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(trimmedEmail)) return 'รูปแบบอีเมลไม่ถูกต้อง'
    const policyError = validatePassword(password)
    if (policyError) return policyError
    if (password !== confirmPassword) return 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const message = validate()
    if (message) {
      setError(message)
      return
    }

    setIsLoading(true)
    try {
      const { data } = await axios.post('/api/setup/complete', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      })

      if (!data?.success) {
        setError(data?.message || 'ตั้งค่าไม่สำเร็จ')
        notify.error(data?.message || 'ตั้งค่าไม่สำเร็จ')
        return
      }

      setIsSuccessful(true)
      notify.success(data.message || 'ตั้งค่าบัญชีผู้ดูแลระบบสำเร็จ')
      // Full navigation, not a client-side push: the middleware has to re-run
      // so it picks up the now-completed setup state.
      setTimeout(() => {
        window.location.href = '/login'
      }, 1800)
    } catch (err: any) {
      const message = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
      setError(message)
      notify.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const fieldClass =
    'w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-colors duration-200'

  return (
    <>
      {isLoading && <GeometricLoader loadingText="กำลังตั้งค่าระบบ" />}
      {isSuccessful && <GeometricLoader loadingText="ตั้งค่าสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ" />}

      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,119,198,0.18),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(59,130,246,0.12),transparent_55%)]" />

        <div className="relative z-10 w-full max-w-2xl">
          <div className="bg-white/5 rounded-3xl shadow-[0_8px_32px_rgba(128,90,213,0.25)] border border-white/10 p-8 lg:p-12">
            <div className="text-center mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                ตั้งค่าระบบครั้งแรก
              </h1>
              <p className="text-purple-200/60 text-sm">
                ยังไม่มีผู้ใช้งานในระบบ — สร้างบัญชีผู้ดูแล (master) บัญชีแรก
              </p>
            </div>

            <div className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              <i className="fas fa-triangle-exclamation mt-0.5"></i>
              <span>
                ทำได้ <b>ครั้งเดียวเท่านั้น</b> เมื่อมีผู้ใช้งานแล้วหน้านี้จะปิดถาวร
                (รวมถึงกรณีที่มีคนสมัครบัญชีผ่านหน้า /register ก่อน) — กรุณาตรวจสอบว่าตั้งค่าถูกต้องก่อนส่ง
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-purple-100">
                  ชื่อผู้ใช้ <span className="text-rose-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <i className="fas fa-user-shield text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={fieldClass}
                    placeholder="rampart-admin"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-purple-100">
                  อีเมล <span className="text-rose-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <i className="fas fa-envelope text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-purple-100">
                  รหัสผ่าน <span className="text-rose-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <i className="fas fa-lock text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${fieldClass} pr-12`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-purple-400 group-focus-within:text-purple-200 transition-colors`}></i>
                  </button>
                </div>
                <ul className="space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password)
                    return (
                      <li
                        key={rule.message}
                        className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-400' : 'text-purple-200/40'}`}
                      >
                        <i className={`fas ${passed ? 'fa-check-circle' : 'fa-circle'} text-[8px]`}></i>
                        {rule.message}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-purple-100">
                  ยืนยันรหัสผ่าน <span className="text-rose-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <i className="fas fa-lock text-purple-400 text-lg group-focus-within:text-purple-200 transition-colors"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={fieldClass}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  <i className="fas fa-exclamation-circle mt-0.5"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isSuccessful}
                className="group relative w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-4 rounded-2xl font-bold text-white shadow-[0_4px_16px_rgba(128,90,213,0.3)] hover:shadow-[0_4px_16px_rgba(128,90,213,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-shadow duration-300 flex items-center justify-center space-x-3"
              >
                <span className="relative z-10 flex items-center justify-center space-x-3">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>กำลังตั้งค่า...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-shield-halved text-lg"></i>
                      <span>สร้างบัญชีผู้ดูแลระบบ</span>
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}