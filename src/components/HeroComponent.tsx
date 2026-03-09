import Image from "next/image";
import { ReactNode } from "react";

type HeroProps = {
    title?: string;
    subtitle?: string;
    logo?: string;
    children?: ReactNode;
};

export default function Hero({
    title = "RAMPART",
    subtitle = "แพลตฟอร์มตรวจสอบมัลแวร์จากระยะไกลด้วยการทดสอบการทำงานแบบอัตโนมัติ",
    logo = "/logo_none_white.png",
    children,
}: HeroProps) {
    return (
        <div className="text-center lg:text-left space-y-8 flex-1">
            <div className="flex justify-center lg:justify-start mb-6">
                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-white to-white rounded-[50%] blur-3xl opacity-80"></div>

                    <div className="w-44 h-44 lg:w-64 lg:h-64">
                        <Image
                            src={logo}
                            alt="RAMPART Security"
                            fill
                            className="object-contain filter"
                            priority
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-w-sm">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent tracking-tight">
                    {title}
                </h1>

                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl text-white px-4 sm:px-6 md:px-8 lg:px-0">
                    {subtitle}
                </h2>

                {children}
            </div>
        </div>
    );
}