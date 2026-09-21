import Link from "next/link";

const MENU = [
  { href: "/concept", label: "แนวคิด" },
  { href: "/docs", label: "เอกสาร" },
  { href: "/innovation", label: "นวัตกรรม" },
  { href: "/community", label: "ชุมชน" },
  { href: "/public-reports", label: "รายงานสาธารณะ" },
  { href: "/contact", label: "ติดต่อเรา" },
];

export default function PublicFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-black/40">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent"
          >
            RAM<span className="text-white">PART</span>
          </Link>
          <p className="text-gray-400 text-sm mt-3 max-w-xs leading-relaxed">
            แพลตฟอร์มตรวจสอบมัลแวร์จากระยะไกล ด้วยการทดสอบการทำงานแบบอัตโนมัติ
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">เมนู</h4>
          <ul className="space-y-2 text-sm">
            {MENU.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-gray-400 hover:text-purple-300 transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">ช่องทางติดตาม</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://www.facebook.com/phanuwat.khamtha"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-300 transition-colors"
              >
                <i className="fab fa-facebook mr-2 text-blue-400"></i>Phanuwat Khamtha
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/passapol.sutatam/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-300 transition-colors"
              >
                <i className="fab fa-facebook mr-2 text-blue-400"></i>Passapol Sutatam
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} RAMPART Security. All rights reserved.
      </div>
    </footer>
  );
}
