"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Navbarservice from "@/components/Navbarservice";
import Hero from "@/components/HeroComponent_landing";
import CollisionCards from "@/components/CollisionCards";
import { useRouter } from "next/navigation";

export default function Home() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorOutlinePos, setCursorOutlinePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

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
          <div className="flex justify-center items-center ">
            <Hero subtitle="" title="" style={{ display: "flex", justifyContent: "center", alignItems: "center" }} />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight ">
            <span className="bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent glitch-text z-10">
              เช็คก่อนติดตั้ง
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent">
              ด้วย RAMPART
            </span>
          </h1>
          <p className="text-gray-300 text-lg md:text-2xl max-w-2xl mx-auto mt-6 leading-relaxed">
            แพลตฟอร์มตรวจสอบมัลแวร์จากระยะไกลด้วยการทดสอบการทำงานแบบอัตโนมัติ
          </p>
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
              ทำไมต้อง RAMPART
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-5 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              มากกว่า "1" เครื่องมือในการตรวจสอบ
              <br />
              เราคือเกราะป้องกันที่คุณวางใจได้
            </h2>
          </div>
          <CollisionCards />
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
                ✦ เครื่องมือชั้นนำ ✦
              </div>
              <h2 className="text-4xl font-bold leading-tight">
                รวมพลังเทคโนโลยีเพื่อ
                <br />
                <span className="bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                  ความปลอดภัยที่เหนือระดับ
                </span>
              </h2>
              <p className="text-gray-300 leading-loose">
                เรารวมเครื่องมือตรวจสอบระดับโลกไว้ในที่เดียว พร้อมด้วย AI ที่ทันสมัย
                เพื่อให้คุณมั่นใจในทุกการใช้งาน กล้าที่จะตรวจจับ กล้าที่จะป้องกัน
                เพื่อความปลอดภัยที่คุณวางใจได้ในทุกสถานการณ์
              </p>

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
          <h2 className="text-4xl font-bold mb-4">ความไว้วางใจจากผู้ใช้งานจริง</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-16">
            ผู้ใช้งานและองค์กรชั้นนำที่ไว้วางใจระบบตรวจสอบของเรา พูดเป็นเสียงเดียวกันว่า ... “มั่นใจ ปลอดภัย ไว้ใจได้”
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
            <span className="text-sm font-mono">ระบบพร้อมใช้งานตลอด 24 ชั่วโมง</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
            พร้อมปกป้องทุกการติดตั้งของคุณ
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            รวมพลังเครื่องมือและ AI ที่ทันสมัย เพื่อความปลอดภัยที่คุณวางใจได้
            ตรวจจับ วิเคราะห์ และป้องกันภัยคุกคามก่อนจะถึงมือคุณ
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <button
              className="group px-10 py-4 bg-white text-black font-bold rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-3 text-lg"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => router.push("/register")}
            >
              เริ่มต้นใช้งาน{" "}
              <i className="fas fa-shield-alt group-hover:rotate-12 transition"></i>
            </button>
            <button
              className="px-10 py-4 rounded-full border border-white/30 bg-transparent backdrop-blur-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <i className="fas fa-chart-line"></i> ดูรายงานตัวอย่าง
            </button>
          </div>
        </div>
        <div className="absolute -bottom-16 left-0 w-72 h-72 bg-purple-500 rounded-full opacity-20 blur-[80px] animate-pulse" />
        <div className="absolute -top-20 right-10 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-[100px] animate-pulse delay-700" />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-center text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2025 RAMPART — สร้างด้วยจิตวิญญาณ</p>
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