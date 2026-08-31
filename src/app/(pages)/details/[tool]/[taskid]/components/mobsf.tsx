"use client";

import { Component, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import GeometricLoader from "@/components/GeometricLoader";
import NavbarComponent from "@/components/NavbarComponent";
import ReportDownload from "./ReportDownload";

const ServerMap = dynamic(() => import("./servermap"), { ssr: false });

class MapBoundary extends Component<{ children?: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-lg shadow-sm p-8 text-center text-slate-400">
          แผนที่ไม่สามารถแสดงได้ในขณะนี้ (ข้อมูลตำแหน่งยังมีครบ)
        </div>
      );
    }
    return this.props.children;
  }
}

interface Datareport {
    success: boolean;
    task_id: string;
    status: "processing" | "success" | "failed";
    report: any;
}

export default function Page({ taskid, tool }: { taskid: string; tool: string }) {
    const [reportData, setReportData] = useState<Datareport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await axios.get<Datareport>(`/api/report_target/${taskid}?tool=${tool}`);
                setReportData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReport();
    }, [taskid, tool]);

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    if (isLoading) return <GeometricLoader loadingText="กำลังโหลดรายงาน MobSF" />;
    if (!reportData?.report) return <div className="p-8 text-center text-slate-400">ไม่พบข้อมูลรายงาน</div>;

    const report = reportData.report;
    const appsec = report.appsec || {};
    const highFindings = appsec.high || [];
    const warningFindings = appsec.warning || [];
    const infoFindings = appsec.info || [];
    const secureFindings = appsec.secure || [];
    const hotspotFindings = appsec.hotspot || [];

    const securityScore = appsec.security_score || 0;
    const totalTrackers = appsec.total_trackers || 0;
    const trackers = appsec.trackers || 0;

    const getScoreColor = () => {
        if (securityScore < 30) return "#ff0018";
        if (securityScore < 40) return "#ffc107";
        if (securityScore < 60) return "#17a2b8";
        return "#28a745";
    };

    const total = Math.max(1, highFindings.length + warningFindings.length + infoFindings.length + secureFindings.length);
    const hp = Math.floor((highFindings.length / total) * 100);
    const wp = Math.floor((warningFindings.length / total) * 100);
    const ip = Math.floor((infoFindings.length / total) * 100);
    const sp = Math.floor((secureFindings.length / total) * 100);

    const getRiskFactor = () => {
        if (securityScore < 30) return 3.9;
        if (securityScore < 40) return 2.5;
        if (securityScore < 60) return 1.5;
        return 0.5;
    };

    const getRiskText = () => {
        if (securityScore < 30) return "Critical Risk";
        if (securityScore < 40) return "High Risk";
        if (securityScore < 60) return "Medium Risk";
        return "Low Risk";
    };

    const FindingCard = ({ item, type, index }: { item: any; type: "high" | "warning" | "info" | "secure" | "hotspot"; index: number }) => {
        const colors = {
            high: { border: "border-red-500/20", bg: "bg-red-500/5", badge: "bg-red-500", text: "text-red-400" },
            warning: { border: "border-yellow-500/20", bg: "bg-yellow-500/5", badge: "bg-yellow-500", text: "text-yellow-400" },
            info: { border: "border-blue-500/20", bg: "bg-blue-500/5", badge: "bg-blue-500", text: "text-blue-400" },
            secure: { border: "border-green-500/20", bg: "bg-green-500/5", badge: "bg-green-500", text: "text-green-400" },
            hotspot: { border: "border-slate-500/20", bg: "bg-slate-500/5", badge: "bg-slate-500", text: "text-slate-400" },
        };
        const color = colors[type];
        const id = `${type}-${index}`;

        return (
            <div className={`rounded-lg border ${color.border} ${color.bg} mb-3 overflow-hidden`} >
                <button onClick={() => toggleSection(id)} className="w-full px-4 py-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${color.badge}`}>
                            {type === "hotspot" ? "hotspot" : type}
                        </span>
                        <span className={`font-medium ${color.text}`}>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{item.section}</span>
                        <svg className={`w-5 h-5 transition-transform text-slate-400 ${expandedSections[id] ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                {expandedSections[id] && (
                    <div className="px-4 py-3 border-t border-white/10 bg-black/20">
                        <pre className="whitespace-pre-wrap text-sm font-mono text-slate-300">{item.description}</pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <NavbarComponent />
            <div className="min-h-screen bg-[#050510] text-white gap-10">

                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="bg-white/5 border border-white/10 rounded-lg shadow-sm p-4 mb-6 flex flex-wrap justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-white">{report.app_name || report.file_name} {report.version_name} </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">ขนาด:</span>
                                    <span className="font-mono text-white">{report.size}</span>
                                </div>
                                <p className="text-sm text-slate-400">anlysis: {report.title}</p>
                                <p className="text-sm text-slate-400">version: {report.version}</p>
                                <p className="text-sm text-slate-400">type_file: {report.app_type}</p>
                                <p className="text-sm text-slate-400">md5: {report.md5}</p>
                                <p className="text-sm text-slate-400">sha1: {report.sha1}</p>
                                <p className="text-sm text-slate-400">sha256: {report.sha256}</p>
                                <p className="text-sm text-slate-400">package_name: {report.package_name}</p>
                                <p className="text-sm text-slate-400">task_id: {taskid}</p>
                            </div>
                        </div>

                    </div>

                    <ReportDownload taskid={taskid} md5={report.md5} tools={[tool]} />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm p-6 text-center">
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                                    <circle cx="64" cy="64" r="56" stroke={getScoreColor()} strokeWidth="12" fill="none" strokeDasharray={`${(securityScore / 100) * 351.86} 351.86`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{securityScore}</span>
                                </div>
                            </div>
                            <p className="mt-3 text-slate-400">Security Score /100</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm p-6">
                            <h3 className="font-medium mb-3 text-center text-white">Severity Distribution (%)</h3>
                            <div className="space-y-2">
                                {[
                                    { label: "High", value: hp, color: "bg-red-500" },
                                    { label: "Medium", value: wp, color: "bg-yellow-500" },
                                    { label: "Info", value: ip, color: "bg-blue-500" },
                                    { label: "Secure", value: sp, color: "bg-green-500" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <span className="w-16 text-sm text-slate-300">{item.label}</span>
                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                        </div>
                                        <span className="w-12 text-sm text-right text-slate-300">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm p-6 text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white ${trackers === 0 ? "bg-green-500" : trackers > 4 ? "bg-red-500" : "bg-slate-600"}`}>
                                {trackers}
                            </div>
                            <p className="mt-3 text-slate-400">{totalTrackers ? "User/Device Trackers" : "Not Scanned"}</p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg shadow-sm p-4 mb-6 flex flex-wrap justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Signature Certificate</h2>
                                {report.certificate_analysis?.certificate_info ? (
                                    <pre style={{ whiteSpace: "pre-line" }} className="text-sm text-slate-400">
                                        {report.certificate_analysis.certificate_info}
                                    </pre>
                                ) : (
                                    <p className="text-sm text-slate-400">ไม่มีข้อมูลใบรับรอง</p>
                                )}

                            </div>
                        </div>

                    </div>

                    <div className="w-full h-[500px] mb-50">
                        {report.domains && Object.keys(report.domains).length > 0 ? (
                            <MapBoundary>
                                <ServerMap domains={report.domains} />
                            </MapBoundary>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-lg shadow-sm p-8 text-center text-slate-400">
                                ไม่มีข้อมูลตำแหน่ง server
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg shadow-sm p-4 mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-white">Domain Malware Check</h2>
                        <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                            >
                                                API Name
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                            >
                                                Bad
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                            >
                                                IP
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                            >
                                                Country
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                            >
                                                Region/City
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                            >
                                                OFAC Listed
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                                            >
                                                Google Map
                                            </th>

                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {report.domains && Object.keys(report.domains).length > 0 ? (
                                            (Object.entries(report.domains) as [string, { bad: string; geolocation: { ip: string; country_long: string; region: string; city: string; latitude: number; longitude: number }; ofac: boolean }][]).map(([domain, info], idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                                    {domain}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {info.bad}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {info.geolocation?.ip || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {info.geolocation?.country_long || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {info.geolocation?.region}, {info.geolocation?.city}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {info.ofac ? "Yes" : "No"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {info.geolocation?.latitude && info.geolocation?.longitude ? (
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${info.geolocation.latitude},${info.geolocation.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:underline"
                                                        >
                                                            View Map
                                                        </a>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </td>
                                            </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-400">ไม่มีข้อมูล domain</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">Findings</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                                <div className="text-center p-3 bg-red-500/10 rounded-lg">
                                    <div className="text-2xl font-bold text-red-400">{highFindings.length}</div>
                                    <div className="text-sm text-red-400">High</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-400">{warningFindings.length}</div>
                                    <div className="text-sm text-yellow-400">Medium</div>
                                </div>
                                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-400">{infoFindings.length}</div>
                                    <div className="text-sm text-blue-400">Info</div>
                                </div>
                                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                    <div className="text-2xl font-bold text-green-400">{secureFindings.length}</div>
                                    <div className="text-sm text-green-400">Secure</div>
                                </div>
                                <div className="text-center p-3 bg-slate-500/10 rounded-lg">
                                    <div className="text-2xl font-bold text-slate-400">{hotspotFindings.length}</div>
                                    <div className="text-sm text-slate-400">Hotspot</div>
                                </div>
                            </div>

                            {highFindings.map((item: any, idx: number) => (
                                <FindingCard key={`high-${idx}`} item={item} type="high" index={idx} />
                            ))}
                            {warningFindings.map((item: any, idx: number) => (
                                <FindingCard key={`warning-${idx}`} item={item} type="warning" index={idx} />
                            ))}
                            {infoFindings.map((item: any, idx: number) => (
                                <FindingCard key={`info-${idx}`} item={item} type="info" index={idx} />
                            ))}
                            {secureFindings.map((item: any, idx: number) => (
                                <FindingCard key={`secure-${idx}`} item={item} type="secure" index={idx} />
                            ))}
                            {hotspotFindings.map((item: any, idx: number) => (
                                <FindingCard key={`hotspot-${idx}`} item={item} type="hotspot" index={idx} />
                            ))}

                            {highFindings.length === 0 && warningFindings.length === 0 && infoFindings.length === 0 && secureFindings.length === 0 && hotspotFindings.length === 0 && (
                                <div className="text-center py-8 text-slate-400">ไม่พบปัญหาในการวิเคราะห์</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        MobSF Application Security Scorecard generated for {report.app_name || report.file_name} {report.version_name}
                    </div>
                </div>
            </div>
        </>

    );
}
