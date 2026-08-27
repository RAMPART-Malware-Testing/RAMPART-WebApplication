"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import GeometricLoader from "@/components/GeometricLoader";
import NavbarComponent from "@/components/NavbarComponent";
import ReportDownload from "./ReportDownload";

interface Datareport {
  success: boolean;
  task_id: string;
  status: "processing" | "success" | "failed";
  report: any;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

export default function Page({ taskid, tool }: { taskid: string; tool: string }) {
  const [reportData, setReportData] = useState<Datareport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // CAPE reports (behavior/apistats logs, signatures, network, dropped
  // files) can easily reach tens of MB as pretty-printed JSON - dumping
  // that unconditionally into a <pre> blocks the main thread on mount and
  // forces the browser to lay out one giant text node. Only stringify
  // and render it once the user explicitly asks to see it.
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await axios.get<Datareport>(
          `/api/report_target/${taskid}?tool=${tool}`
        );
        setReportData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [taskid, tool]);

  if (isLoading) return <GeometricLoader />;

  if (!reportData || reportData.status !== "success") {
    return <div className="text-center mt-10">❌ ไม่พบ report หรือยังไม่เสร็จ</div>;
  }

  const report = reportData.report;
  const target = report?.target;
  const file = target?.file || {};
  const debug = report?.debug || {};
  const network = report?.network || {};
  const info = report?.info || {};
  const statistics = report?.statistics || {};
  const cape = report?.CAPE || {};

  // ตรวจสอบว่าเป็น Failure จริงหรือไม่ — แยกเฉพาะ "jar ผิด" จากกรณีอื่น
  const errorLog = debug?.log || "";
  const realErrors = (debug?.errors || []).filter(Boolean);

  // จริงเฉพาะ : APK ถูกส่งไปรันแบบ jar (ไม่มี Java) — ไม่ใช่ทุก CuckooPackageError
  const hasPackageError =
    /Invalid package type/i.test(errorLog) && /jar/i.test(errorLog);

  // Failure จริงอื่น ๆ (เช่น CuckooPackageError: elevation/Error 740/access ...)
  const hasRealFailure =
    realErrors.length > 0 ||
    /CuckooPackageError|failed_analysis|analysis failed/i.test(errorLog);

  const hasError = hasPackageError || hasRealFailure;

  // ดึงบรรทัด error ที่อ่านเข้าใจง่ายจาก log — ต้องแยกให้ออกจากบรรทัด
  // WARNING ของ auxiliary module (เช่น disguise) ที่อาจปรากฏอยู่ก่อนหน้า
  // error ตัวจริงใน log เดียวกัน มิฉะนั้น regex ทั่วไป (เช่น "Access is
  // denied") จะไปจับ WARNING ที่ไม่เกี่ยวข้องแทนที่จะเป็นสาเหตุจริงที่ทำ
  // ให้การวิเคราะห์ล้มเหลว
  const auxWarningPattern = /Cannot execute auxiliary module/i;

  // อันดับ 1: ข้อความจาก exception ตัวจริงที่ CAPE โยนออกมา (บรรทัด
  // "lib.common.exceptions.CuckooPackageError: <เหตุผล>" ในไฟล์ traceback)
  // — เป็นข้อความที่ตรงกับสาเหตุการล้มเหลวจริงที่สุด ใช้บรรทัดสุดท้าย
  // เผื่อมีหลาย exception ซ้อนกัน (บรรทัดท้ายมักเป็นตัวที่ทำให้ task จบ)
  const packageErrorMatches = [...errorLog.matchAll(/CuckooPackageError:\s*(.+)/g)];
  const rootExceptionMessage = packageErrorMatches.length > 0
    ? packageErrorMatches[packageErrorMatches.length - 1][1].trim()
    : "";

  // อันดับ 2 (fallback): บรรทัดที่มี keyword error ทั่วไป แต่ไม่ใช่บรรทัด
  // WARNING ของ auxiliary module
  const readableLine =
    errorLog.split("\n").find((l: string) =>
      !auxWarningPattern.test(l) &&
      /Failed to execute process|Access is denied|Unable to execute the initial process|Error: \d+|Invalid package type/i.test(l)
    )?.trim() || "";

  const errorMessage = realErrors[0]
    ? String(realErrors[0])
    : hasPackageError
      ? "Analysis failed: Invalid package type. APK file was run with 'jar' package but Java is not available."
      : hasRealFailure
        ? ("Analysis failed: " + (rootExceptionMessage || readableLine || "unknown error"))
        : "";

  // ── Component-level status breakdown ──────────────────────────────
  // A single blanket "Analysis Failed" banner hides the fact that CAPE
  // has dozens of independent sub-systems (auxiliary modules, API hooks,
  // core behavior/network capture) - one of them failing (e.g. an
  // auxiliary module denied registry access) does NOT mean the analysis
  // itself failed. This breaks the raw debug log down into per-component
  // rows so the user can see exactly what didn't work and why, alongside
  // what DID work (behavior data, network capture, signatures - which
  // are almost always present even when an auxiliary module warns).
  interface ComponentStatus {
    name: string;
    ok: boolean;
    detail: string;
  }

  const logLines = errorLog.split("\n");

  // Auxiliary modules that failed to start (e.g. "disguise" needing
  // elevated registry access it didn't have in this VM) - cosmetic/
  // anti-detection helpers, never the core analysis engine.
  const auxModuleFailures = [
    ...errorLog.matchAll(/Cannot execute auxiliary module modules\.auxiliary\.(\w+): (.+)/g),
  ].map((m) => ({ module: m[1], reason: m[2].trim() }));

  // API hooks CAPE's monitor couldn't place inside the target process
  // (e.g. "Unable to place hook on X") - reduces visibility into that
  // specific API but does not stop monitoring of everything else.
  const missedHooks = [
    ...new Set(
      [...errorLog.matchAll(/Unable to place hook on ([\w:]+)/g)].map((m) => m[1])
    ),
  ];

  const hasBehaviorData = Array.isArray(report?.behavior?.processes) && report.behavior.processes.length > 0;
  const hasNetworkData = !!report?.network && Object.keys(report.network).length > 0;
  const hasSignatures = Array.isArray(report?.signatures) && report.signatures.length > 0;

  const componentStatuses: ComponentStatus[] = [
    {
      name: "Behavior monitoring (API/registry/file calls)",
      ok: hasBehaviorData,
      detail: hasBehaviorData
        ? `บันทึกพฤติกรรมได้ ${report.behavior.processes.length} process`
        : "ไม่มีข้อมูลพฤติกรรมถูกบันทึก",
    },
    {
      name: "Network capture",
      ok: hasNetworkData,
      detail: hasNetworkData ? "จับทราฟฟิกเครือข่ายได้ตามปกติ" : "ไม่มีข้อมูลเครือข่ายถูกบันทึก",
    },
    {
      name: "Signature matching",
      ok: hasSignatures,
      detail: hasSignatures ? `ตรวจพบ ${report.signatures.length} signature` : "ไม่มี signature ที่ตรงเงื่อนไข",
    },
    ...auxModuleFailures.map((f) => ({
      name: `Auxiliary module: ${f.module}`,
      ok: false,
      detail: `เริ่มทำงานไม่สำเร็จ (${f.reason}) — เป็นโมดูลเสริม (เช่น ปลอมตัว VM/anti-detection) ไม่กระทบผลวิเคราะห์หลัก`,
    })),
    ...(missedHooks.length > 0
      ? [{
          name: "API hooks (บาง function)",
          ok: false,
          detail: `วาง hook ไม่สำเร็จสำหรับ: ${missedHooks.join(", ")} — ลดความละเอียดของบาง API เท่านั้น ไม่กระทบ behavior หลัก`,
        }]
      : []),
  ];

  const hasNonFatalWarnings = componentStatuses.some((c) => !c.ok) && !hasError;

  return (
    <>
      <NavbarComponent />

      <div className="p-6 space-y-6 text-white max-w-6xl mx-auto">
        
        {/* 🔴 ERROR ALERT - กรณีวิเคราะห์ล้มเหลวจริง (core analysis ไม่ทำงาน) */}
        {hasError && (
          <div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-xl">
            <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Analysis Failed</h2>
            <p className="text-red-300">{errorMessage}</p>
            {errorMessage && hasPackageError && (
              <div className="mt-3 p-3 bg-black/50 rounded-lg text-sm font-mono">
                <p className="text-yellow-400">Root Cause:</p>
                <p>The submitted file is an <strong>Android APK</strong> but was analyzed with the <strong>'jar'</strong> package (for Java JAR files).</p>
                <p className="mt-2">✅ <strong>Recommendation:</strong> Re-analyze using package <code>"apk"</code> or <code>"android"</code>.</p>
              </div>
            )}
          </div>
        )}

        {/* 🟡 COMPONENT STATUS BREAKDOWN - แทนที่การขึ้น "Analysis Failed"
            แบบเหมารวมเมื่อมีแค่บาง sub-system (auxiliary module/API hook)
            ที่ทำงานไม่สำเร็จ แต่ core analysis (behavior/network/signatures)
            ยังทำงานได้ปกติ - บอกชัดเจนว่าอะไรใช้ได้ อะไรใช้ไม่ได้ และทำไม */}
        {!hasError && hasNonFatalWarnings && (
          <div className="bg-gray-900 border border-yellow-700/50 rounded-xl p-4">
            <h2 className="text-lg font-bold text-yellow-400 mb-1">
              ℹ️ การวิเคราะห์สำเร็จ แต่มีบางส่วนทำงานไม่ครบ
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              ผลวิเคราะห์หลัก (พฤติกรรมไฟล์, เครือข่าย, signature) ยังใช้งานได้ครบถ้วน — รายการด้านล่างคือส่วนย่อยที่ทำงานไม่สำเร็จ ซึ่งไม่กระทบความถูกต้องของผลลัพธ์โดยรวม
            </p>
            <div className="space-y-2">
              {componentStatuses.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    c.ok
                      ? "bg-emerald-900/20 border-emerald-700/40"
                      : "bg-yellow-900/20 border-yellow-700/40"
                  }`}
                >
                  <span className={`text-lg leading-none ${c.ok ? "text-emerald-400" : "text-yellow-400"}`}>
                    {c.ok ? "✅" : "⚠️"}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${c.ok ? "text-emerald-300" : "text-yellow-300"}`}>
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

       

        {/* 📊 Analysis Info */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-3">Analysis Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-400">Task ID:</span> <span className="font-mono text-xs">{reportData.task_id?.slice(0, 8)}...</span></div>
            <div><span className="text-gray-400">Started:</span> {info?.started || "N/A"}</div>
            <div><span className="text-gray-400">Duration:</span> {info?.duration || 0} seconds</div>
            <div><span className="text-gray-400">Package Used:</span> <span className="text-yellow-400">{info?.package || "jar"} {hasPackageError && "(❌ Incorrect)"}</span></div>
            <div><span className="text-gray-400">Machine:</span> {info?.machine?.name || "N/A"}</div>
            <div><span className="text-gray-400">Score:</span> <span className="text-green-400">{report?.malscore || 0}</span></div>
            <div><span className="text-gray-400">Status:</span> <span className={hasError ? "text-red-400" : "text-green-400"}>{hasError ? "Failed" : "Success"}</span></div>
            <div><span className="text-gray-400">CAPE Version:</span> {info?.CAPE_current_commit?.slice(0, 7) || "N/A"}</div>
          </div>
        </div>

        

       
        

        {/* 📄 RAW JSON (สำหรับ Debug) */}
        <ReportDownload taskid={taskid} md5={report?.target?.file?.md5} tools={[tool]} />
        <div className="bg-black p-4 rounded-xl overflow-x-auto border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Raw JSON Report</h2>
            <button
              onClick={() => setShowRawJson((prev) => !prev)}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-cyan-300"
            >
              {showRawJson ? "ซ่อน Raw JSON" : "ดู Raw JSON"}
            </button>
          </div>
          {showRawJson ? (
            <pre className="text-xs text-gray-300 overflow-auto max-h-[500px]">
              {JSON.stringify(report, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-gray-500">
              รายงานฉบับเต็มอาจมีขนาดใหญ่มาก (การเรียก API/registry ระหว่างวิเคราะห์แบบละเอียด) กดปุ่มด้านบนเพื่อโหลดและแสดงผล
            </p>
          )}
        </div>

      </div>
    </>
  );
}