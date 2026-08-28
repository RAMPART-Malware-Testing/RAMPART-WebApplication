"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import axios from "axios"
import { useProfile } from "@/hooks/queries/useProfile"
import {
  LayoutDashboard,
  Scan,
  FileText,
  User,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

const baseMenuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Scan Files", href: "/scan", icon: Scan },
  { name: "My Reports", href: "/reports", icon: FileText },
  { name: "My Profile", href: "/profile?m=report", icon: User },
]

const adminMenuItem = { name: "Admin", href: "/admin", icon: ShieldCheck }

export default function NavbarComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const { data: profile } = useProfile()

  const displayName = profile?.username || "Security Analyst"
  const displayEmail = profile?.email || "admin@rampart.security"
  const initials = (displayName.trim().charAt(0) || "U").toUpperCase()
  const avatarSrc = profile?.avatar_url && !avatarLoadFailed ? `${SERVER_URL}${profile.avatar_url}` : null
  const isAdmin = profile?.role === "admin" || profile?.role === "master"
  const menuItems = isAdmin ? [...baseMenuItems, adminMenuItem] : baseMenuItems

  const handleLogout = () => {
    router.push("/logout")
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050510]/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#050510]/60">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 group-hover:ring-blue-500/40 transition-all duration-300">
              <Image
                src="/logo_bg_white.png"
                alt="RAMPART"
                fill
                className="object-contain p-1 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                RAM<span className="text-blue-400">PART</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-400">Online</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/[0.08] hover:bg-white/10 hover:border-white/15 transition-all duration-200"
              >
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/20 overflow-hidden">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-medium text-white">{displayName}</p>
                  <p className="text-[10px] text-slate-500">{displayEmail}</p>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-white/[0.08] bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-sm font-medium text-white">{displayName}</p>
                      <p className="text-xs text-slate-500">{displayEmail}</p>
                    </div>
                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>
                    </div>
                    <div className="border-t border-white/[0.06] py-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#050510]/95 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-7xl px-4 py-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-blue-500/10 border border-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
