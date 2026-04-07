'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NavbarComponent() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        router.push('/');
    };

    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: '' },
        { name: 'Scan Files', href: '/scan', icon: '' },
        { name: 'All Reports', href: '/reports', icon: '' },
        { name: 'My Reports', href: '/profile?m=report', icon: '' },
    ];

    return (
        <nav className="bg-gradient-to-r from-slate-900/80 via-blue-900/50 to-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl mb-4 sticky top-0 z-50 text-xs">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-2 py-4">
                {/* Logo & Title */}
                <div className="flex items-center justify-between w-full lg:w-auto mb-4 lg:mb-0">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 relative group">
                            <Image
                                src="/logo_bg_white.png"
                                alt="RAMPART"
                                fill
                                className="object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                        <div>
                            <h1 className="font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                                RAMPART
                            </h1>
                            <p className="text-blue-200/60 text-sm">
                                แพลตฟอร์มตรวจสอบมัลแวร์จากระยะไกลด้วยการทดสอบการทำงานแบบอัตโนมัติ
                            </p>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Desktop Menu & User Section */}
                <div className={`${isMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6 w-full lg:w-auto`}>
                    {/* Navigation Menu */}
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-2 w-full lg:w-auto">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="px-4 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center space-x-2 group"
                            >
                                <span className="group-hover:scale-125 transition-transform duration-200">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Status & User Profile */}
                    <div className="flex items-center space-x-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
                        {/* System Status */}
                        <div className="flex items-center space-x-2 bg-white/5 rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                            <span className="text-white font-medium">ระบบพร้อมใช้งาน</span>
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-3 bg-white/5 rounded-xl px-4 py-2 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    SA
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-white font-medium text-sm">Security Analyst</p>
                                    <p className="text-blue-200/60 text-xs">admin@rampart.security</p>
                                </div>
                                <svg
                                    className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-white font-medium">Security Analyst</p>
                                        <p className="text-blue-200/60 text-sm">admin@rampart.security</p>
                                    </div>
                                    <div className="py-2">
                                        <Link
                                            href="/profile"
                                            className="flex items-center space-x-3 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            <span>👤</span>
                                            <span>โปรไฟล์</span>
                                        </Link>
                                        <div className="border-t border-white/10 my-2"></div>
                                        <Link href="/logout"
                                            onClick={handleLogout}
                                            className="flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                                        >
                                            <span>🚪</span>
                                            <span className="font-medium">ออกจากระบบ</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}