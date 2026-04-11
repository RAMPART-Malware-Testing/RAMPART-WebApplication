"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import path from "path";

export default function Navbarservice() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 w-full z-49 backdrop-blur-xl bg-black/20 border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
          RAM<span className="text-white">PART</span>
        </div>
        <div className="hidden md:flex space-x-8 text-sm font-medium">
          <a href="#" className="hover:text-purple-300 transition-colors duration-300">
            แนวคิด
          </a>
          <a href="#" className="hover:text-purple-300 transition-colors duration-300">
            เอกสาร
          </a>
          <a href="#" className="hover:text-purple-300 transition-colors duration-300">
            นวัตกรรม
          </a>
          <a href="#" className="hover:text-purple-300 transition-colors duration-300">
            ชุมชน
          </a>
        </div>
        <div className="flex flex-row gap-4">

          <button
            className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-sm font-semibold hover:bg-purple-600/40 hover:border-purple-400 transition-all duration-300"
          >
            <i className="far fa-comment-dots mr-2"></i>ติดต่อเรา
          </button>


          {pathname !== "/login" && (
            <button
              onClick={() => router.push("/login")}
              className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-sm font-semibold hover:bg-purple-600/40 hover:border-purple-400 transition-all duration-300"
            >
              เข้าสู่ระบบ
            </button>
          )

          }

          {
            pathname !== "/register" && (
              <button
                onClick={() => router.push("/register")}
                className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-sm font-semibold hover:bg-purple-600/40 hover:border-purple-400 transition-all duration-300"
              >
                สมัครสมาชิก
              </button>
            )
          }



        </div>

      </div>
    </nav>
  )
}