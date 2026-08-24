"use client";

import Image from "next/image";
import React, { ReactNode } from "react";
import dynamic from "next/dynamic";

const SplineScene = dynamic(() => import("@/components/SplineScene"), { ssr: false });

type HeroProps = {
    title?: string;
    subtitle?: string;
    logo?: string;
    modelSrc?: string;
    children?: ReactNode;
    style?: React.CSSProperties;
};

export default function Hero({
    title = "RAMPART",
    subtitle = "แพลตฟอร์มตรวจสอบมัลแวร์จากระยะไกลด้วยการทดสอบการทำงานแบบอัตโนมัติ",
    logo = "/aniamtion_dragonv2.gif",
    modelSrc,
    children,
    style,
}: HeroProps) {
    return (
        <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-8 lg:gap-12" style={style}>
            {/* Left: Logo/3D */}
            <div className="flex-1 flex justify-center lg:justify-end">
                <div className="relative">
                    {!modelSrc && (
                        <div className="absolute -inset-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur-4xl opacity-60 animate-pulse" />
                    )}
                    <div className="relative w-72 h-72 lg:w-[420px] lg:h-[420px]">
                        {modelSrc ? (
                            <SplineScene />
                        ) : (
                            <Image src={logo} alt="Logo" fill className="object-contain" priority />
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Text */}
            <div className="flex-1 text-center lg:text-left space-y-5 max-w-lg">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                    <span className="bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                        เช็คก่อนติดตั้ง
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent">
                        ด้วย RAMPART
                    </span>
                </h1>

                {subtitle && (
                    <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-md">
                        {subtitle}
                    </p>
                )}

                {children}
            </div>
        </div>
    );
}
