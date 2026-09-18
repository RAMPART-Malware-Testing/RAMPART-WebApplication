import type { Metadata } from "next";
import Navbarservice from "@/components/Navbarservice";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "เอกสาร | RAMPART Security",
  description: "คู่มือการใช้งาน RAMPART เบื้องต้น",
};

const STEPS = [
  {
    step: "1",
    title: "สมัครบัญชี / เข้าสู่ระบบ",
    detail:
      "สร้างบัญชีด้วยอีเมล หรือเข้าสู่ระบบผ่าน Google และ GitHub ยืนยันตัวตนด้วยรหัส OTP เพื่อความปลอดภัย",
  },
  {
    step: "2",
    title: "อัปโหลดไฟล์ที่ต้องสงสัย",
    detail:
      "เลือกไฟล์จากหน้าสแกน ระบบรองรับไฟล์ขนาดไม่เกิน 1 GB ระบบจะคำนวณ MD5, SHA-1 และ SHA-256 ของไฟล์ให้อัตโนมัติ",
  },
  {
    step: "3",
    title: "รอระบบวิเคราะห์",
    detail:
      "ไฟล์จะถูกส่งเข้ากระบวนการวิเคราะห์อัตโนมัติ หากไฟล์เคยถูกตรวจแล้ว ระบบจะแสดงผลเดิมทันทีโดยไม่ต้องตรวจซ้ำ",
  },
  {
    step: "4",
    title: "อ่านรายงานผล",
    detail:
      "ดูผลรวมจากทุกเครื่องมือในหน้ารายงาน พร้อมสรุปภัยคุกคามจาก AI และดาวน์โหลดรายงานเก็บไว้ได้",
  },
];

const TOOLS = [
  {
    name: "VirusTotal",
    detail: "ตรวจไฟล์กับเอนจิ้นแอนติไวรัสกว่า 70 ตัว เหมาะสำหรับตรวจเบื้องต้นและไฟล์ขนาดใหญ่ (ตรวจผ่าน hash)",
  },
  {
    name: "MobSF",
    detail: "วิเคราะห์แอปมือถือ Android และ iOS แบบอัตโนมัติ ทั้ง static และ dynamic",
  },
  {
    name: "CAPE Sandbox",
    detail: "รันไฟล์ในแซนด์บ็อกซ์ที่แยกจากระบบจริง บันทึกพฤติกรรมการทำงานของมัลแวร์อย่างละเอียด",
  },
  {
    name: "RampartAI",
    detail: "โมเดลวิเคราะห์มัลแวร์ที่พัฒนาเอง ช่วยจัดประเภทและให้คะแนนความเสี่ยงเพิ่มเติม",
  },
  {
    name: "Gemini AI",
    detail: "สรุปผลรวมจากทุกเครื่องมือให้อ่านเข้าใจง่าย พร้อมชี้จุดที่ควรใส่ใจ",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <Navbarservice />

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full border border-purple-500/20">
              เอกสาร
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              คู่มือการใช้งานเบื้องต้น
            </h1>
            <p className="text-gray-300/80 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              เริ่มใช้งาน RAMPART ได้ใน 4 ขั้นตอนง่าย ๆ
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex gap-5">
                <span className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
            เครื่องมือวิเคราะห์ที่ใช้งาน
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-16">
            {TOOLS.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-purple-500/30 transition-colors"
              >
                <h3 className="font-bold text-purple-200 mb-1">
                  <i className="fas fa-toolbox mr-2 text-purple-400"></i>
                  {t.name}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
            <h3 className="font-bold text-yellow-200 mb-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              ข้อควรระวัง
            </h3>
            <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
              <li>อย่าอัปโหลดไฟล์ที่มีข้อมูลส่วนบุคคลหรือความลับขององค์กร</li>
              <li>ไฟล์ที่อัปโหลดจะถูกรันในแซนด์บ็อกซ์ระยะไกล โปรดตรวจสอบให้แน่ใจว่ามีสิทธิ์นำไฟล์นั้นมาทดสอบ</li>
              <li>ผลวิเคราะห์เป็นเพียงข้อมูลประกอบการตัดสินใจ ไม่ควรใช้เป็นข้อสรุปเพียงอย่างเดียว</li>
            </ul>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
