import type { Metadata } from "next";
import Navbarservice from "@/components/Navbarservice";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "ติดต่อเรา | RAMPART Security",
  description: "ช่องทางติดต่อทีมพัฒนา RAMPART",
};

const TEAM = [
  {
    name: "Phanuwat Khamtha",
    role: "ผู้พัฒนาระบบวิเคราะห์และ AI",
    facebook: "https://www.facebook.com/phanuwat.khamtha",
    icon: "fas fa-brain",
  },
  {
    name: "Passapol Sutatam",
    role: "ผู้พัฒนาแพลตฟอร์มและโครงสร้างพื้นฐาน",
    facebook: "https://www.facebook.com/passapol.sutatam/",
    icon: "fas fa-server",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <Navbarservice />

      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-purple-300 font-mono tracking-widest text-sm uppercase bg-white/5 px-4 py-1 rounded-full border border-purple-500/20">
              ติดต่อเรา
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              พูดคุยกับทีมพัฒนา
            </h1>
            <p className="text-gray-300/80 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
              หากมีข้อสงสัยเกี่ยวกับการใช้งาน พบปัญหา หรืออยากแลกเปลี่ยนความรู้ด้านความปลอดภัยไซเบอร์
              ติดต่อทีมได้ผ่านช่องทางด้านล่าง
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center hover:border-purple-500/30 transition-colors"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
                  <i className={`${member.icon} text-3xl`}></i>
                </div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-gray-400 text-sm mt-1 mb-6">{member.role}</p>
                <a
                  href={member.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1877F2]/90 hover:bg-[#1877F2] font-semibold text-sm transition-colors"
                >
                  <i className="fab fa-facebook text-lg"></i>
                  ทักแชทผ่าน Facebook
                </a>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-1">
                <i className="fas fa-envelope mr-2 text-purple-400"></i>
                อีเมลทีมงาน
              </h3>
              <p className="text-gray-400 text-sm">
                สำหรับเรื่องที่ต้องการหลักฐานเป็นลายลักษณ์อักษร เช่น รายงานปัญหาหรือข้อเสนอการใช้งานเชิงองค์กร
              </p>
            </div>
            <a
              href="mailto:rampartmalwareanalysis@gmail.com"
              className="px-6 py-3 rounded-full border border-purple-400/40 bg-purple-500/10 text-purple-200 font-semibold text-sm hover:bg-purple-500/20 transition-colors whitespace-nowrap"
            >
              rampartmalwareanalysis@gmail.com
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
