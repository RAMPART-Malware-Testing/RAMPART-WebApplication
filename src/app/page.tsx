"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Navbarservice from "@/components/Navbarservice";

export default function Home() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorOutlinePos, setCursorOutlinePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll reveal observer
  useEffect(() => {
    const reveals = revealRefs.current.filter((el) => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    reveals.forEach((el) => observer.observe(el!));
    return () => observer.disconnect();
  }, []);

  // Number counter observer
  useEffect(() => {
    const counters = counterRefs.current.filter((el) => el !== null);
    const startCounting = (counter: HTMLDivElement) => {
      const target = parseFloat(counter.getAttribute("data-target") || "0");
      const suffix = counter.getAttribute("data-suffix") || "";
      let current = 0;
      const increment = target / 45;
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.innerText = Math.floor(current) + suffix;
          requestAnimationFrame(updateCounter);
        } else {
          counter.innerText = target + suffix;
        }
      };
      updateCounter();
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const counter = entry.target as HTMLDivElement;
            if (!counter.classList.contains("counted")) {
              counter.classList.add("counted");
              startCounting(counter);
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterObserver.observe(el!));
    return () => counterObserver.disconnect();
  }, []);

  // Custom cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX - 4, y: e.clientY - 4 });
      setCursorOutlinePos({ x: e.clientX - 20, y: e.clientY - 20 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  // Helper to add refs
  const addToRevealRefs = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const addToCounterRefs = (el: HTMLDivElement | null) => {
    if (el && !counterRefs.current.includes(el)) {
      counterRefs.current.push(el);
    }
  };

  return (
    <>
      {/* Custom Cursor */}
      <div
        className="cursor-dot hidden md:block"
        style={{ transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)` }}
      />
      <div
        className="cursor-outline hidden md:block"
        style={{
          transform: `translate(${cursorOutlinePos.x}px, ${cursorOutlinePos.y}px) ${isHovering ? "scale(1.6)" : "scale(1)"
            }`,
          borderColor: isHovering ? "#c084fc" : "rgba(167, 139, 250, 0.7)",
        }}
      />

      {/* Animated gradient blobs background */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div
          className="blob-bg top-[-200px] left-[-150px] animate-pulse"
          style={{ animationDuration: "12s" }}
        />
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

      {/* Navbar */}
      <Navbarservice />

      {/* Hero section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 overflow-hidden">
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-full max-w-4xl pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur-[80px] opacity-40 rounded-full" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto z-10">
          <div className="inline-block mb-6 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-mono tracking-wider">
            ✦ immersive future-ready ✦
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent glitch-text">
              สัมผัสโลก
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent">
              ที่ไม่มีขีดจำกัด
            </span>
          </h1>
          <p className="text-gray-300 text-lg md:text-2xl max-w-2xl mx-auto mt-6 leading-relaxed">
            สร้างประสบการณ์ดิจิทัลที่เหนือจินตนาการ ด้วยเทคโนโลยีล้ำสมัยและการออกแบบที่เปี่ยมมนต์ขลัง
            เปลี่ยนไอเดียให้กลายเป็นความจริงที่ไม่เหมือนใคร
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center mt-10">
            <button
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full font-bold text-lg shadow-[0_8px_32px_rgba(128,90,213,0.4)] hover:shadow-[0_12px_40px_rgba(128,90,213,0.7)] transition-all duration-300 overflow-hidden"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span className="relative z-10 flex items-center gap-2">
                เริ่มต้นการเดินทาง{" "}
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
            <button
              className="px-8 py-4 rounded-full border border-white/30 backdrop-blur-sm font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <i className="fas fa-play-circle"></i> ดูภาพยนตร์สั้น
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/60 rounded-full mt-2 animate-ping" />
          </div>
        </div>
      </section>

      {/* Floating card showcase section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div
            className="text-center mb-16 reveal-on-scroll"
            ref={addToRevealRefs}
          >
            <span className="text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full">
              ทำไมต้อง Nexora
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-5 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              มากกว่าความสวยงาม
              <br />
              คือเวทมนตร์แห่งการเชื่อมต่อ
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className="floating-card backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10 hover-glow transition-all duration-500 reveal-on-scroll"
              style={{ animationDelay: "0s" }}
              ref={addToRevealRefs}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center mb-6 backdrop-blur-sm shadow-lg">
                <i className="fas fa-cube text-3xl text-purple-300"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">Immersive 3D</h3>
              <p className="text-gray-300 leading-relaxed">
                ผสานโลกแห่งความเป็นจริงและดิจิทัลด้วยเทคโนโลยี WebGL
                และอนิเมชั่นสุดล้ำ ที่ทำให้ผู้ใช้หลงใหลในทุกการปฏิสัมพันธ์
              </p>
            </div>
            <div
              className="floating-card backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10 hover-glow transition-all duration-500 reveal-on-scroll"
              style={{ animationDelay: "0.2s", animationDuration: "9s" }}
              ref={addToRevealRefs}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/40 to-pink-500/40 flex items-center justify-center mb-6">
                <i className="fas fa-meteor text-3xl text-fuchsia-300"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">Motion Alchemy</h3>
              <p className="text-gray-300 leading-relaxed">
                อนิเมชั่นที่ไม่เหมือนใคร สร้างการเล่าเรื่องที่มีชีวิตชีวา
                ทุกการเคลื่อนไหวคือศิลปะที่ปลุกแบรนด์ให้โดดเด่น
              </p>
            </div>
            <div
              className="floating-card backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10 hover-glow transition-all duration-500 reveal-on-scroll"
              style={{ animationDelay: "0.4s" }}
              ref={addToRevealRefs}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/40 to-blue-500/40 flex items-center justify-center mb-6">
                <i className="fas fa-brain text-3xl text-cyan-300"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Empathy</h3>
              <p className="text-gray-300 leading-relaxed">
                ผสานพลังของ AI เข้ากับดีไซน์ที่เข้าใจมนุษย์
                สร้างประสบการณ์เฉพาะบุคคลที่เหนือระดับและเข้าถึงอารมณ์
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Parallax creative showreel section */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 reveal-on-scroll" ref={addToRevealRefs}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition duration-1000" />
                <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 p-1">
                  <div className="rounded-xl w-full h-[300px] lg:h-[400px] bg-gradient-to-br from-purple-900/50 to-indigo-900/50 flex items-center justify-center">
                    <i className="fas fa-play-circle text-6xl text-purple-400/60"></i>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/30 rounded-full blur-2xl" />
              </div>
            </div>
            <div className="flex-1 space-y-6 reveal-on-scroll" ref={addToRevealRefs}>
              <div className="inline-block px-4 py-1 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-300 text-sm font-mono">
                ✦ ล่าสุด: โปรเจกต์แห่งปี
              </div>
              <h2 className="text-4xl font-bold leading-tight">
                เวทมนตร์ที่ซ่อนอยู่ใน
                <br />
                <span className="bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                  ทุกพิกเซล
                </span>
              </h2>
              <p className="text-gray-300 leading-loose">
                เราไม่ได้แค่ดีไซน์ แต่เราสร้างอารมณ์สะเทือนใจ
                ผ่านการเล่าเรื่องด้วยภาพเคลื่อนไหวแบบ ORGANIC ที่ไม่มีใครเหมือน
                กล้าที่จะแตกต่าง กล้าที่จะทดลอง
                เพื่อมอบประสบการณ์ที่ตราตรึงใจผู้ใช้ในทุกมิติ
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-purple-400"></i>
                  <span>Motion Design Award 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-purple-400"></i>
                  <span>CSS Art ระดับตำนาน</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-purple-400"></i>
                  <span>Interactive Experience</span>
                </div>
              </div>
              <button
                className="mt-6 px-8 py-3 rounded-full bg-white/5 border border-white/20 font-semibold hover:bg-purple-500/40 hover:border-purple-300 transition-all flex items-center gap-2 group"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                สำรวจผลงาน{" "}
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats + animated number */}
      <section className="py-20 px-6 border-y border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="reveal-on-scroll" ref={addToRevealRefs}>
            <div
              className="text-5xl font-black text-purple-300 countup"
              data-target="128"
              ref={addToCounterRefs}
            >
              0
            </div>
            <p className="text-gray-400 mt-2">โปรเจกต์สุดว้าว</p>
          </div>
          <div className="reveal-on-scroll" ref={addToRevealRefs}>
            <div
              className="text-5xl font-black text-purple-300 countup"
              data-target="42"
              ref={addToCounterRefs}
            >
              0
            </div>
            <p className="text-gray-400 mt-2">พาร์ทเนอร์ชั้นนำ</p>
          </div>
          <div className="reveal-on-scroll" ref={addToRevealRefs}>
            <div
              className="text-5xl font-black text-purple-300 countup"
              data-target="1.2"
              data-suffix="k"
              ref={addToCounterRefs}
            >
              0
            </div>
            <p className="text-gray-400 mt-2">ชั่วโมงแห่งแรงบันดาลใจ</p>
          </div>
          <div className="reveal-on-scroll" ref={addToRevealRefs}>
            <div
              className="text-5xl font-black text-purple-300 countup"
              data-target="98"
              data-suffix="%"
              ref={addToCounterRefs}
            >
              0
            </div>
            <p className="text-gray-400 mt-2">ความพึงพอใจ</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center reveal-on-scroll" ref={addToRevealRefs}>
          <h2 className="text-4xl font-bold mb-4">เสียงจากผู้ร่วมทาง</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-16">
            คนที่เคยสัมผัสเวทมนตร์ของ Nexora พูดเป็นเสียงเดียวกันว่า ... “เหนือความคาดหมาย”
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10 text-left hover:scale-[1.02] transition duration-500 group">
              <i className="fas fa-quote-left text-3xl text-purple-400 opacity-60 mb-4"></i>
              <p className="text-gray-200 leading-relaxed">
                “Animation ที่สร้างขึ้นมันราวกับมีชีวิต!
                ไม่เคยเห็นหน้า Landing page ที่ขยับได้อย่างมีจังหวะหัวใจขนาดนี้มาก่อน
                ทุกครั้งที่เลื่อนรู้สึกเหมือนกำลังดูหนังสั้น”
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center font-bold">
                  ม.
                </div>
                <div>
                  <p className="font-bold">มินตรา อัศว์เดชา</p>
                  <p className="text-xs text-purple-300">Creative Director @Lunar</p>
                </div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10 text-left hover:scale-[1.02] transition duration-500 group">
              <i className="fas fa-quote-left text-3xl text-purple-400 opacity-60 mb-4"></i>
              <p className="text-gray-200 leading-relaxed">
                “ไม่เชื่อว่าโค้ดจะสร้างมนต์สะกดได้ขนาดนี้!
                ทุกองค์ประกอบดูเป็น organic และไม่เหมือนใคร สุดยอดฝีมือมนุษย์อย่างแท้จริง”
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400 flex items-center justify-center font-bold">
                  ธ.
                </div>
                <div>
                  <p className="font-bold">ธนดล วิศวกรซอฟต์แวร์</p>
                  <p className="text-xs text-cyan-300">Lead Innovator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA creative */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-fuchsia-900/30 blur-3xl" />
        <div className="max-w-4xl mx-auto text-center relative z-10 reveal-on-scroll" ref={addToRevealRefs}>
          <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-5 py-2 mb-8 border border-white/10 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            <span className="text-sm font-mono">เปิดรับไอเดียไร้ขีดจำกัด</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
            พร้อมเปลี่ยนโลก digital ของคุณ
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            มาร่วมสร้างบางสิ่งที่ไม่เคยมีที่ไหนมาก่อน
            ด้วยพลังของดีไซน์และอนิเมชั่นที่จะทำให้ผู้คนจดจำคุณตลอดไป
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <button
              className="group px-10 py-4 bg-white text-black font-bold rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-3 text-lg"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              เริ่มโปรเจกต์ของคุณ{" "}
              <i className="fas fa-magic group-hover:rotate-12 transition"></i>
            </button>
            <button
              className="px-10 py-4 rounded-full border border-white/30 bg-transparent backdrop-blur-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <i className="fab fa-discord"></i> เข้าร่วมชุมชน
            </button>
          </div>
        </div>
        <div className="absolute -bottom-16 left-0 w-72 h-72 bg-purple-500 rounded-full opacity-20 blur-[80px] animate-pulse" />
        <div className="absolute -top-20 right-10 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-[100px] animate-pulse delay-700" />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2025 Nexora — สร้างด้วยจิตวิญญาณและอนิเมชั่นสุดพิเศษ</p>
          <div className="flex gap-6 text-lg">
            <i className="fab fa-twitter hover:text-purple-400 cursor-pointer transition"></i>
            <i className="fab fa-instagram hover:text-purple-400 cursor-pointer transition"></i>
            <i className="fab fa-github hover:text-purple-400 cursor-pointer transition"></i>
            <i className="fab fa-dribbble hover:text-purple-400 cursor-pointer transition"></i>
          </div>
        </div>
      </footer>
    </>
  );
}