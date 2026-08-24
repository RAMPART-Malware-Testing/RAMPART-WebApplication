// components/CollisionCards.tsx
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

interface Card {
    id: number;
    title: string;
    image: string;
    color: string;
    glow: string;
    desc: string;
}

const cardsData: Card[] = [
    {
        id: 0, title: 'Cape', image: '/cape_logo.png',
        color: 'from-purple-600 to-indigo-600',
        glow: 'shadow-purple-500/30',
        desc: 'ผสานโลกแห่งความเป็นจริงและดิจิทัลด้วยเทคโนโลยี WebGL และอนิเมชั่นสุดล้ำ ที่ทำให้ผู้ใช้หลงใหลในทุกการปฏิสัมพันธ์'
    },
    {
        id: 1, title: 'MobSF', image: '/mobsf_logo.png',
        color: 'from-indigo-500 to-violet-600',
        glow: 'shadow-indigo-500/30',
        desc: 'เครื่องมือวิเคราะห์ความปลอดภัยของ Mobile Application แบบอัตโนมัติ รองรับทั้ง Android และ iOS'
    },
    {
        id: 2, title: 'VirusTotal', image: '/virustotal_logo.png',
        color: 'from-purple-500 to-fuchsia-600',
        glow: 'shadow-purple-500/30',
        desc: 'บริการตรวจสอบไฟล์และลิงก์ด้วย antivirus มากกว่า 70 ตัว พร้อมระบบวิเคราะห์พฤติกรรม'
    },
    {
        id: 3, title: 'Machine Learning', image: '/logo_none_white.png',
        color: 'from-violet-500 to-purple-600',
        glow: 'shadow-violet-500/30',
        desc: 'ใช้โมเดล Machine Learning ในการตรวจจับ malware และวิเคราะห์พฤติกรรมที่น่าสงสัย'
    },
    {
        id: 4, title: 'Gemini LLM', image: '/logo_gemini.png',
        color: 'from-fuchsia-500 to-violet-600',
        glow: 'shadow-fuchsia-500/30',
        desc: 'ใช้ AI จาก Google Gemini ในการวิเคราะห์และสรุปผลการตรวจสอบอย่างชาญฉลาด'
    },
];

const CollisionCards: React.FC = () => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-active');
                    }
                });
            },
            { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
        );

        cardRefs.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="max-w-7xl mx-auto" ref={sectionRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cardsData.map((card, idx) => (
                    <div
                        key={card.id}
                        ref={el => { cardRefs.current[idx] = el; }}
                        className="card-reveal group cursor-pointer"
                        style={{ transitionDelay: `${idx * 100}ms` }}
                    >
                        {/* Outer glow on hover */}
                        <div className="relative p-[1px] rounded-[28px] bg-gradient-to-b from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10 transition-all duration-700">
                            {/* Animated border gradient */}
                            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/40 group-hover:via-fuchsia-500/30 group-hover:to-indigo-500/40 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm" />
                            
                            <div className="relative bg-black/60 backdrop-blur-2xl rounded-[27px] p-6 overflow-hidden transition-all duration-500 group-hover:bg-black/70 group-hover:-translate-y-2">
                                {/* Glow orb background */}
                                <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.color} rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-700 group-hover:scale-150`} />
                                <div className={`absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br ${card.color} rounded-full opacity-0 group-hover:opacity-15 blur-2xl transition-all duration-700 delay-100 group-hover:scale-125`} />

                                {/* Icon area */}
                                <div className="relative mb-6">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 group-hover:scale-110`} />
                                    <div className={`relative w-20 h-20 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ${card.glow} group-hover:shadow-xl`}>
                                        <Image
                                            src={card.image}
                                            alt={card.title}
                                            width={48}
                                            height={48}
                                            className="object-contain drop-shadow-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    {/* Small floating accent */}
                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 animate-ping`} style={{ animationDuration: '1.5s' }} />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text transition-all duration-500"
                                    style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                                    <span className={`bg-gradient-to-r ${card.color} bg-clip-text text-transparent group-hover:opacity-100 opacity-90 transition-opacity duration-500`}>
                                        {card.title}
                                    </span>
                                </h3>

                                {/* Description */}
                                <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors duration-500">
                                    {card.desc}
                                </p>

                                {/* Bottom accent line */}
                                <div className="mt-5 flex items-center gap-2">
                                    <div className={`h-0.5 w-8 rounded-full bg-gradient-to-r ${card.color} group-hover:w-16 transition-all duration-700`} />
                                    <div className="h-0.5 w-3 rounded-full bg-white/10 group-hover:w-6 transition-all duration-700 delay-75" />
                                    <div className="h-0.5 w-1.5 rounded-full bg-white/5 group-hover:w-3 transition-all duration-700 delay-150" />
                                </div>

                                {/* Corner accent */}
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-400/40">
                                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .card-reveal {
                    opacity: 0;
                    transform: translateY(40px) scale(0.95);
                    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .card-reveal.reveal-active {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            `}</style>
        </div>
    );
};

export default CollisionCards;