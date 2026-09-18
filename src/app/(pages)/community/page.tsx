import type { Metadata } from "next";
import Link from "next/link";
import Navbarservice from "@/components/Navbarservice";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "ชุมชน | RAMPART Security",
  description: "ชุมชนผู้ใช้และผู้สนใจด้านความปลอดภัยไซเบอร์ของ RAMPART",
};

const AUDIENCES = [
  {
    icon: "fas fa-graduation-cap",
    title: "นักศึกษาและผู้สอน",
    detail:
      "ใช้เป็นสื่อการเรียนการสอนด้านความปลอดภัยไซเบอร์ ทดลองส่งไฟล์ตัวอย่างและอ่านรายงานจริงจากเครื่องมือมาตรฐานสากล",
  },
  {
    icon: "fas fa-server",
    title: "ทีม IT และ Security",
    detail:
      "ตรวจสอบไฟล์แนบหรือโปรแกรมที่ต้องสงสัยก่อนนำไปใช้งานจริงในองค์กร โดยไม่ต้องตั้งถามแล็บวิเคราะห์เอง",
  },
  {
    icon: "fas fa-flask",
    title: "นักวิจัยและนักพัฒนา",
    detail:
      "ศึกษาพฤติกรรมมัลแวร์จากรายงาน แลกเปลี่ยนมุมมอง และร่วมเสนอแนะการพัฒนาระบบให้ตอบโจทย์มากขึ้น",
  },
];

const CONTRIBUTIONS = [
  "ทดลองใช้งานและรายงานปัญหาที่พบ เพื่อให้ทีมพัฒนาแก้ไขอย่างรวดเร็ว",
  "เสนอฟีเจอร์หรือเครื่องมือวิเคราะห์ที่อยากให้เพิ่มเข้ามาในระบบ",
  "แบ่งปันความรู้ด้านความปลอดภัยไซเบอร์ให้กับสมาชิกในชุมชน",
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <Navbarservice />

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full border border-purple-500/20">
              ชุมชน
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              ชุมชนผู้ใช้ RAMPART
            </h1>
            <p className="text-gray-300/80 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              RAMPART สร้างขึ้นเพื่อให้ทุกคนเข้าถึงการวิเคราะห์มัลแวร์ได้ง่ายขึ้น
              ชุมชนของเราจึงเปิดกว้างสำหรับทุกคนที่สนใจด้านความปลอดภัยไซเบอร์
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {AUDIENCES.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-500/30 transition-colors"
              >
                <i className={`${a.icon} text-3xl text-purple-400`}></i>
                <h3 className="text-lg font-bold mt-4 mb-2">{a.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{a.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                ร่วมพัฒนากับเรา
              </h2>
              <ul className="space-y-3">
                {CONTRIBUTIONS.map((c) => (
                  <li key={c} className="text-gray-300 text-sm leading-relaxed flex gap-3">
                    <i className="fas fa-check-circle text-purple-400 mt-0.5"></i>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 font-semibold hover:scale-105 transition-transform"
              >
                ติดต่อทีมพัฒนา <i className="fas fa-arrow-right text-sm"></i>
              </Link>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-black/40 p-8">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                ติดตามข่าวสาร
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                ติดตามความคืบหน้าของโปรเจกต์ อัปเดตฟีเจอร์ใหม่ และพูดคุยกับทีมพัฒนาได้ผ่าน Facebook ส่วนตัวของทีม
              </p>
              <div className="space-y-3">
                <a
                  href="https://www.facebook.com/phanuwat.khamtha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:border-blue-400/40 transition-colors"
                >
                  <i className="fab fa-facebook text-2xl text-blue-400"></i>
                  <span className="text-sm font-medium">Phanuwat Khamtha</span>
                </a>
                <a
                  href="https://www.facebook.com/passapol.sutatam/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:border-blue-400/40 transition-colors"
                >
                  <i className="fab fa-facebook text-2xl text-blue-400"></i>
                  <span className="text-sm font-medium">Passapol Sutatam</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
