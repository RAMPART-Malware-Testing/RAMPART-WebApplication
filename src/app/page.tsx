"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Navbarservice from "@/components/Navbarservice";
import CollisionCards from "@/components/CollisionCards";
import { useRouter } from "next/navigation";
import GeometricLoader from "@/components/GeometricLoader";

const CircuitBoard3D = dynamic(() => import("@/components/CircuitBoard3D"), { ssr: false });
const SplineScene = dynamic(() => import("@/components/SplineScene"), { ssr: false });

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.6 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,139,250,${p.a})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168,139,250,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

const FloatingBadge = ({ icon, img, text, x, y, delay }: { icon?: string; img?: string; text: string; x: string; y: string; delay: string }) => (
  <div
    className="absolute z-20 animate-float opacity-0"
    style={{
      left: x,
      top: y,
      animationDelay: delay,
      animation: `float 7s ease-in-out infinite, fadeInUp 1s ease-out ${delay} forwards`,
    }}
  >
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20 shadow-lg">
      {img ? (
        <Image src={img} alt={text} width={18} height={18} className="rounded-sm" />
      ) : (
        <i className={`${icon} text-purple-300 text-sm`}></i>
      )}
      <span className="text-xs text-white/80 whitespace-nowrap">{text}</span>
    </div>
  </div>
);

function AnimatedBorderCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-600 via-indigo-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-700" />
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-indigo-400 to-fuchsia-400 rounded-2xl opacity-0 group-hover:opacity-100 animate-gradient-x" />
      <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();

  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      {!pageLoaded && <GeometricLoader loadingText="กำลังโหลด..." />}

      <div className="fixed inset-0 overflow-hidden -z-10">
        <div
          className="blob-bg top-[-200px] left-[-150px] animate-pulse"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="blob-bg bottom-[-250px] right-[-200px]"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.1) 70%)",
            animationDelay: "-3s",
            animationDuration: "15s",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] top-1/3 left-1/4 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse"
          style={{ animationDuration: "18s" }}
        />
        <div className="absolute w-[600px] h-[600px] bottom-10 right-0 bg-indigo-600/10 blur-[120px] spin-slow" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(168,139,250,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,139,250,0.1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <Navbarservice />

      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <SplineScene onLoad={() => setPageLoaded(true)} />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#050510] z-[1] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center min-h-screen px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full px-5 py-2 mb-8 border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
              <span className="text-sm font-mono text-purple-300 tracking-wide">PLATFORM</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-lg">
                เช็คก่อนติดตั้ง
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
                ด้วย RAMPART
              </span>
            </h1>

            <p className="text-gray-300/80 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
              แพลตฟอร์มตรวจสอบมัลแวร์จากระยะไกล
              <br />
              ด้วยการทดสอบการทำงานแบบอัตโนมัติ
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => router.push("/login")}
                className="group relative px-8 py-4 bg-white text-black font-bold rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-2">
                  <i className="fas fa-rocket"></i> เริ่มต้นใช้งานฟรี
                </span>
              </button>
              <button
                className="group px-8 py-4 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm font-semibold hover:bg-white/10 hover:border-purple-400/50 hover:scale-105 transition-all duration-300 flex items-center gap-2 text-white"
              >
                <i className="fas fa-play-circle group-hover:text-purple-400 transition-colors"></i>
                ดูวิธีการทำงาน
              </button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/20 text-xs">
              <span className="flex items-center gap-1.5"><i className="fas fa-lock text-green-400/40"></i> SSL Encrypted</span>
              <span className="flex items-center gap-1.5"><i className="fas fa-shield-haltered text-purple-400/40"></i> GDPR Compliant</span>
              <span className="flex items-center gap-1.5"><i className="fas fa-cloud text-indigo-400/40"></i> Cloud Protected</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative bg-[#050510]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal-on-scroll" ref={addToRevealRefs}>
            <span className="text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full border border-purple-500/20">
              ทำไมต้อง RAMPART
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-5 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              มากกว่า &quot;1&quot; เครื่องมือในการตรวจสอบ
              <br />
              เราคือเกราะป้องกันที่คุณวางใจได้
            </h2>
          </div>
          <CollisionCards />
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute -right-40 top-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] spin-slow" />
        <div className="absolute -left-40 bottom-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "10s" }} />

        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 reveal-on-scroll h-[400px] lg:h-[600px]" ref={addToRevealRefs}>
              <CircuitBoard3D src="/circuit_board.glb" orbit="45deg 35deg" distance="1.2m" />
            </div>

            <div className="flex-1 space-y-6 reveal-on-scroll" ref={addToRevealRefs}>
              <div className="inline-block px-4 py-1 bg-purple-500/10 rounded-full border border-purple-500/30 text-purple-300 text-sm font-mono animate-pulse">
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
              <div className="flex flex-wrap gap-3 mt-4">
                {["Cape Sandbox", "MobSF", "VirusTotal", "Gemini AI"].map((t) => (
                  <span key={t} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300 cursor-default">
                    {t}
                  </span>
                ))}
              </div>
              <button
                className="mt-6 px-8 py-3 rounded-full bg-white/5 border border-white/20 font-semibold hover:bg-purple-500/40 hover:border-purple-300 transition-all flex items-center gap-2 group"
              >
                สำรวจผลงาน{" "}
                <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform duration-300"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-[120px]" />
        <div className="max-w-6xl mx-auto text-center reveal-on-scroll" ref={addToRevealRefs}>
          <span className="text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full border border-purple-500/20">
            เสียงจากผู้ใช้จริง
          </span>
          <h2 className="text-4xl font-bold mb-4 mt-5">ความไว้วางใจจากผู้ใช้งานจริง</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-16">
            ผู้ใช้งานและองค์กรชั้นนำที่ไว้วางใจระบบตรวจสอบของเรา พูดเป็นเสียงเดียวกันว่า ... &ldquo;มั่นใจ ปลอดภัย ไว้ใจได้&rdquo;
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { initial: "ม.", name: "มินตรา อัศว์เดชา", role: "Creative Director @Lunar", from: "from-purple-400 to-pink-400", tint: "text-purple-300", quote: "Animation ที่สร้างขึ้นมันราวกับมีชีวิต! ไม่เคยเห็นหน้า Landing page ที่ขยับได้อย่างมีจังหวะหัวใจขนาดนี้มาก่อน ทุกครั้งที่เลื่อนรู้สึกเหมือนกำลังดูหนังสั้น" },
              { initial: "ธ.", name: "ธนดล วิศวกรซอฟต์แวร์", role: "Lead Innovator", from: "from-indigo-400 to-cyan-400", tint: "text-cyan-300", quote: "ไม่เชื่อว่าโค้ดจะสร้างมนต์สะกดได้ขนาดนี้! ทุกองค์ประกอบดูเป็น organic และไม่เหมือนใคร สุดยอดฝีมือมนุษย์อย่างแท้จริง" },
              { initial: "ส.", name: "สมชาย นักวิเคราะห์", role: "Security Analyst @Defender", from: "from-purple-400 to-indigo-400", tint: "text-purple-300", quote: "RAMPART คือคำตอบขององค์กรเรา ระบบตรวจจับแม่นยำ ใช้งานง่าย และรายงานผลละเอียดยิบ" },
            ].map((t, i) => (
              <div
                key={t.name}
                className="backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10 text-left hover:scale-[1.03] hover:border-purple-500/30 transition-all duration-500 group reveal-on-scroll"
                ref={addToRevealRefs}
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <i key={j} className="fas fa-star text-purple-400 text-sm"></i>
                  ))}
                </div>
                <p className="text-gray-200 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${t.from} flex items-center justify-center font-bold text-sm`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{t.name}</p>
                    <p className={`text-xs ${t.tint}`}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-fuchsia-900/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />

        <div className="absolute -bottom-16 left-0 w-72 h-72 bg-purple-500 rounded-full opacity-20 blur-[80px] animate-pulse" />
        <div className="absolute -top-20 right-10 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-[100px] animate-pulse" style={{ animationDelay: "0.7s" }} />
        <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-fuchsia-500 rounded-full opacity-10 blur-[90px] animate-pulse" style={{ animationDelay: "1.4s" }} />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full border border-purple-500/10 animate-ping" style={{ animationDuration: "5s" }} />
          <div className="absolute inset-0 w-[500px] h-[500px] rounded-full border border-indigo-500/8 animate-ping" style={{ animationDuration: "7s", animationDelay: "1.5s" }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 reveal-on-scroll" ref={addToRevealRefs}>
          <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-5 py-2 mb-8 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm font-mono text-green-400">ระบบพร้อมใช้งานตลอด 24 ชั่วโมง</span>
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
              className="group relative px-10 py-4 bg-white text-black font-bold rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-3 text-lg overflow-hidden"
              onClick={() => router.push("/login")}
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                เริ่มต้นใช้งาน{" "}
                <i className="fas fa-shield-alt group-hover:rotate-12 transition-transform duration-300"></i>
              </span>
            </button>
            <button
              className="group px-10 py-4 rounded-full border border-white/30 bg-transparent backdrop-blur-sm font-semibold hover:bg-white/10 hover:border-purple-400/50 hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <i className="fas fa-chart-line group-hover:text-purple-400 transition-colors"></i> ดูรายงานตัวอย่าง
            </button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/30 text-sm">
            <span className="flex items-center gap-1.5"><i className="fas fa-lock text-green-400/60"></i> SSL Encrypted</span>
            <span className="flex items-center gap-1.5"><i className="fas fa-shield-haltered text-purple-400/60"></i> GDPR Compliant</span>
            <span className="flex items-center gap-1.5"><i className="fas fa-cloud text-indigo-400/60"></i> Cloud Protected</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </section>

      <footer className="border-t border-white/10 py-12 px-6 text-center text-gray-400 text-sm relative">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-indigo-500"></div>
            <p>© 2025 RAMPART — สร้างด้วยจิตวิญญาณ</p>
          </div>
          <div className="flex gap-6 text-lg">
            <i className="fab fa-twitter hover:text-purple-400 cursor-pointer transition hover:scale-125 duration-200"></i>
            <i className="fab fa-instagram hover:text-purple-400 cursor-pointer transition hover:scale-125 duration-200"></i>
            <i className="fab fa-github hover:text-purple-400 cursor-pointer transition hover:scale-125 duration-200"></i>
            <i className="fab fa-dribbble hover:text-purple-400 cursor-pointer transition hover:scale-125 duration-200"></i>
          </div>
        </div>
      </footer>

    </>
  );
}
