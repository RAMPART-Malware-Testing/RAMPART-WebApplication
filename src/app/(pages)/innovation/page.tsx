import type { Metadata } from "next";
import Navbarservice from "@/components/Navbarservice";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "นวัตกรรม | RAMPART Security",
  description: "เทคโนโลยีและนวัตกรรมเบื้องหลัง RAMPART",
};

const FEATURES = [
  {
    icon: "fas fa-diagram-project",
    title: "ท่อประมวลผลอัตโนมัติ",
    detail:
      "งานวิเคราะห์ถูกกระจายผ่าน message queue (Celery) ให้เครื่องมือทุกตัวทำงานพร้อมกันแบบขนาน พร้อมกลไก retry และ timeout รายเครื่องมือ ทำให้ไฟล์เดียวได้ผลครบในรอบเดียว",
  },
  {
    icon: "fas fa-fingerprint",
    title: "ตรวจซ้ำด้วยลายนิ้วมือไฟล์",
    detail:
      "ทุกไฟล์จะถูกคำนวณ MD5 / SHA-1 / SHA-256 ก่อนวิเคราะห์ ไฟล์ที่เคยตรวจแล้วจะได้รายงานทันทีจากฐานข้อมูล ประหยัดเวลาและทรัพยากรของระบบ",
  },
  {
    icon: "fas fa-cubes",
    title: "หลายเอนจิ้นในที่เดียว",
    detail:
      "VirusTotal สำหรับตรวจรวดเร็ว, MobSF สำหรับแอปมือถือ, CAPE Sandbox สำหรับดูพฤติกรรมจริง, RampartAI โมเดลของเราเอง และ Gemini AI สำหรับสรุปผล — ทำงานร่วมกันโดยผู้ใช้ไม่ต้องตั้งค่าอะไร",
  },
  {
    icon: "fas fa-globe",
    title: "แซนด์บ็อกซ์ระยะไกล",
    detail:
      "การรันไฟล์เกิดขึ้นบนเซิร์ฟเวอร์วิเคราะห์ที่แยกจากผู้ใช้ทั้งหมด ผลลัพธ์พฤติกรรมของมัลแวร์ถูกบันทึกและแสดงผลผ่านเว็บ ไม่มีความเสี่ยงต่อเครื่องผู้ใช้",
  },
  {
    icon: "fas fa-brain",
    title: "สรุปผลด้วย AI",
    detail:
      "ผลดิบจากเครื่องมือแต่ละตัวถูกสรุปด้วย Gemini AI ให้เป็นภาษาที่อ่านเข้าใจง่าย ช่วยให้ผู้ใช้ทั่วไปเห็นภาพรวมความเสี่ยงได้อย่างรวดเร็ว",
  },
  {
    icon: "fas fa-user-shield",
    title: "สิทธิ์แบบหลายระดับ",
    detail:
      "ระบบสิทธิ์ master / admin / user ครบตั้งแต่การใช้งานส่วนตัวจนถึงการบริหารผู้ใช้และติดตาม audit log ทุกเหตุการณ์สำคัญในระบบ",
  },
];

export default function InnovationPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <Navbarservice />

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full border border-purple-500/20">
              นวัตกรรม
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              เทคโนโลยีเบื้องหลัง RAMPART
            </h1>
            <p className="text-gray-300/80 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              รวมเครื่องมือวิเคราะห์ชั้นนำและ AI ไว้ในท่อประมวลผลเดียว
              ออกแบบมาให้ผู้ใช้ไม่ต้องรู้ว่าข้างหลังซับซ้อนแค่ไหน
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-500/30 transition-colors"
              >
                <i className={`${f.icon} text-3xl text-purple-400`}></i>
                <h3 className="text-xl font-bold mt-4 mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-black/40 p-8">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              เส้นทางของไฟล์หนึ่งไฟล์ใน RAMPART
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-3 text-sm font-mono">
              {["อัปโหลด", "คำนวณ hash", "ตรวจซ้ำ", "VirusTotal", "MobSF", "CAPE", "RampartAI", "สรุปด้วย AI", "รายงาน"].map(
                (stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    {i > 0 && <i className="fas fa-chevron-right text-purple-500/60 hidden md:block"></i>}
                    <span className="px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-100 whitespace-nowrap">
                      {stage}
                    </span>
                  </div>
                ),
              )}
            </div>
            <p className="text-gray-400 text-sm mt-6 leading-relaxed">
              ทุกขั้นตอนทำงานอัตโนมัติบนเซิร์ฟเวอร์ของระบบ ผู้ใช้เพียงรอรับรายงานสรุปเมื่อเสร็จสิ้น
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
