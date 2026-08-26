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

  // ดึงบรรทัด error ที่อ่านเข้าใจง่ายจาก log
  const readableLine =
    errorLog.split("\n").find((l: string) =>
      /Failed to execute process|Access is denied|Unable to execute the initial process|Error: \d+|Invalid package type/i.test(l)
    )?.trim() || "";

  const errorMessage = realErrors[0]
    ? String(realErrors[0])
    : hasPackageError
      ? "Analysis failed: Invalid package type. APK file was run with 'jar' package but Java is not available."
      : hasRealFailure
        ? ("Analysis failed: " + (readableLine || "unknown error"))
        : "";

  return (
    <>
      <NavbarComponent />

      <div className="p-6 space-y-6 text-white max-w-6xl mx-auto">
        
        {/* 🔴 ERROR ALERT - กรณีวิเคราะห์ล้มเหลว */}
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
          <h2 className="text-xl font-bold mb-2">Raw JSON Report</h2>
          <pre className="text-xs text-gray-300 overflow-auto max-h-[500px]">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>

      </div>
    </>
  );
}