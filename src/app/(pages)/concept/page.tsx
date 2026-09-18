import type { Metadata } from "next";
import Navbarservice from "@/components/Navbarservice";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "แนวคิด | RAMPART Security",
  description: "ทำไมต้องวิเคราะห์มัลแวร์แบบระยะไกลด้วย RAMPART",
};

const PRINCIPLES = [
  {
    icon: "fas fa-shield-alt",
    title: "ปลอดภัย แยกสภาพแวดล้อม",
    detail:
      "ไฟล์ที่ต้องสงสัยจะถูกส่งไปทดสอบในแซนด์บ็อกซ์ระยะไกลที่แยกออกจากเครื่องของคุณโดยสนิท ไม่ต้องเสี่ยงเปิดไฟล์ด้วยตัวเอง",
  },
  {
    icon: "fas fa-robot",
    title: "อัตโนมัติทั้งกระบวนการ",
    detail:
      "ตั้งแต่อัปโหลดจนได้รายงาน ระบบจัดการให้ครบทุกขั้นตอน ผู้ใช้ไม่จำเป็นต้องมีความรู้เชิงลึกด้านการวิเคราะห์มัลแวร์ก็ใช้งานได้",
  },
  {
    icon: "fas fa-layer-group",
    title: "รวมเครื่องมือไว้ที่เดียว",
    detail:
      "VirusTotal, MobSF, CAPE Sandbox และโมเดล AI ของเราทำงานร่วมกันเป็นท่อประมวลผลเดียว สรุปผลออกมาเป็นรายงานเดียวที่อ่านง่าย",
  },
];

export default function ConceptPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <Navbarservice />

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full border border-purple-500/20">
              แนวคิด
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent leading-tight">
              ทำไมต้องวิเคราะห์มัลแวร์
              <br />
              แบบระยะไกล
            </h1>
            <p className="text-gray-300/80 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              ไฟล์ที่ต้องสงสัยหนึ่งไฟล์ อาจซ่อนความเสียหายมหาศาลไว้ข้างใน
              RAMPART จึงถูกออกแบบมาเพื่อให้ทุกคนตรวจสอบไฟล์ได้อย่างปลอดภัย
              โดยไม่ต้องเสี่ยงเปิดไฟล์บนเครื่องของตัวเอง
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-500/30 transition-colors"
              >
                <i className={`${p.icon} text-3xl text-purple-400`}></i>
                <h3 className="text-xl font-bold mt-4 mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-black/40 p-8">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
              จากปัญหาจริงสู่แพลตฟอร์มเดียว
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                ในทางปฏิบัติ การวิเคราะห์ไฟล์ต้องสงสัยหนึ่งไฟล์มักต้องใช้เครื่องมือหลายตัว
                กระจัดกระจายอยู่คนละบริการ ต้องตั้งค่าเอง ตีความผลเอง
                และบางเครื่องมือก็ต้องมีสภาพแวดล้อมที่ปลอดภัยพร้อมใช้งานอยู่แล้ว
              </p>
              <p>
                RAMPART จึงรวมทุกอย่างไว้ในที่เดียว: อัปโหลดไฟล์เข้ามา
                ระบบจะคำนวณลายนิ้วมือ (hash) ของไฟล์ ตรวจซ้ำอัตโนมัติ
                จากนั้นกระจายงานไปยังเครื่องมือวิเคราะห์ทั้งหมดแบบขนาน
                แล้วสรุปผลรวมให้เป็นรายงานเดียวที่ผู้ใช้ทั่วไปก็อ่านเข้าใจได้
              </p>
              <p>
                ผลลัพธ์คือ ทุกคน ตั้งแต่นักศึกษาจนถึงทีมรักษาความปลอดภัย
                สามารถตรวจสอบไฟล์ได้อย่างมั่นใจ โดยใช้เพียงเบราว์เซอร์
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
