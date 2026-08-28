import React, { useEffect, useRef } from 'react';

interface Card {
    id: number;
    title: string;
    image: string;
    color: string;
    desc: string;
}

const cardsData: Card[] = [
    {
        id: 0, title: 'Cape', image: '/cape_logo.png',
        color: 'bg-white',
        desc: 'ผสานโลกแห่งความเป็นจริงและดิจิทัลด้วยเทคโนโลยี WebGL และอนิเมชั่นสุดล้ำ ที่ทำให้ผู้ใช้หลงใหลในทุกการปฏิสัมพันธ์'
    },
    {
        id: 1, title: 'MobSF', image: '/mobsf_logo.png',
        color: 'bg-white',
        desc: 'เครื่องมือวิเคราะห์ความปลอดภัยของ Mobile Application แบบอัตโนมัติ รองรับทั้ง Android และ iOS'
    },
    {
        id: 2, title: 'VirusTotal', image: '/virustotal_logo.png',
        color: 'bg-white',
        desc: 'บริการตรวจสอบไฟล์และลิงก์ด้วย antivirus มากกว่า 70 ตัว พร้อมระบบวิเคราะห์พฤติกรรม'
    },
    {
        id: 3, title: 'Machine Learning', image: '/logo_none_white.png',
        color: 'bg-white',
        desc: 'ใช้โมเดล Machine Learning ในการตรวจจับ malware และวิเคราะห์พฤติกรรมที่น่าสงสัย'
    },
    {
        id: 4, title: 'Gemini LLM', image: '/logo_gemini.png',
        color: 'bg-white',
        desc: 'ใช้ AI จาก Google Gemini ในการวิเคราะห์และสรุปผลการตรวจสอบอย่างชาญฉลาด'
    },
];

const CollisionCards: React.FC = () => {
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('opacity-100', 'translate-y-0');
                        entry.target.classList.remove('opacity-0', 'translate-y-10');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        cardRefs.current.forEach((card) => {
            if (card) observer.observe(card);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cardsData.map((card, idx) => (
                        <div
                            key={card.id}
                            ref={el => { cardRefs.current[idx] = el }}
                            className="group opacity-0 translate-y-10 transition-all duration-700 hover:duration-300"
                            style={{ transitionDelay: `${idx * 100}ms` }}
                        >
                            <div className="bg-white rounded-2xl p-6 border border-gray-200
                          hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100
                          transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full">

                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color}
                            flex items-center justify-center mb-5 shadow-sm
                            group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="w-18 h-18 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = card.title.charAt(0);
                                        }}
                                    />
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-purple-600 transition-colors">
                                    {card.title}
                                </h3>

                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {card.desc}
                                </p>

                                <div className="mt-4 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-purple-400 to-transparent transition-all duration-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CollisionCards;