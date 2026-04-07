"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import GeometricLoader from "@/components/GeometricLoader";
import NavbarComponent from "@/components/NavbarComponent";

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
    if (!reportData?.report) return <div className="p-8 text-center text-gray-500">ไม่พบข้อมูลรายงาน</div>;

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
            high: { border: "border-red-200", bg: "bg-red-50", badge: "bg-red-500", text: "text-red-700" },
            warning: { border: "border-yellow-200", bg: "bg-yellow-50", badge: "bg-yellow-500", text: "text-yellow-700" },
            info: { border: "border-blue-200", bg: "bg-blue-50", badge: "bg-blue-500", text: "text-blue-700" },
            secure: { border: "border-green-200", bg: "bg-green-50", badge: "bg-green-500", text: "text-green-700" },
            hotspot: { border: "border-gray-200", bg: "bg-gray-50", badge: "bg-gray-500", text: "text-gray-700" },
        };
        const color = colors[type];
        const id = `${type}-${index}`;

        return (
            <div className={`rounded-lg border ${color.border} ${color.bg} mb-3 overflow-hidden`} >
                <button onClick={() => toggleSection(id)} className="w-full px-4 py-3 flex justify-between items-center hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${color.badge}`}>
                            {type === "hotspot" ? "hotspot" : type}
                        </span>
                        <span className={`font-medium ${color.text}`}>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{item.section}</span>
                        <svg className={`w-5 h-5 transition-transform ${expandedSections[id] ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                {expandedSections[id] && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-white/50">
                        <pre className="whitespace-pre-wrap text-sm font-mono text-gray-600">{item.description}</pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
        <NavbarComponent />
         <div className="min-h-screen bg-[#f8f9fa] text-black">
           

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header Info */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={`/download/${report.hash}-icon.png`} className="w-12 h-12 rounded-lg" onError={(e) => ((e.target as HTMLImageElement).src = "/no_icon.png")} alt="app icon" />
                        <div>
                            <h2 className="text-lg font-semibold">{report.app_name || report.file_name} {report.version_name}</h2>
                            <p className="text-sm text-gray-500">{report.package_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">ขนาด:</span>
                        <span className="font-mono">{report.size}</span>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Security Score */}
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <div className="relative w-32 h-32 mx-auto">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                                <circle cx="64" cy="64" r="56" stroke={getScoreColor()} strokeWidth="12" fill="none" strokeDasharray={`${(securityScore / 100) * 351.86} 351.86`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">{securityScore}</span>
                            </div>
                        </div>
                        <p className="mt-3 text-gray-600">Security Score /100</p>
                    </div>


                    {/* Severity Distribution */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="font-medium mb-3 text-center">Severity Distribution (%)</h3>
                        <div className="space-y-2">
                            {[
                                { label: "High", value: hp, color: "bg-red-500" },
                                { label: "Medium", value: wp, color: "bg-yellow-500" },
                                { label: "Info", value: ip, color: "bg-blue-500" },
                                { label: "Secure", value: sp, color: "bg-green-500" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <span className="w-16 text-sm">{item.label}</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                    </div>
                                    <span className="w-12 text-sm text-right">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Privacy Risk */}
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-3xl font-bold text-white ${trackers === 0 ? "bg-green-500" : trackers > 4 ? "bg-red-500" : "bg-gray-600"}`}>
                            {trackers}
                        </div>
                        <p className="mt-3 text-gray-600">{totalTrackers ? "User/Device Trackers" : "Not Scanned"}</p>
                    </div>
                </div>

                {/* Findings Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold flex items-center gap-2">Findings</h3>
                    </div>
                    <div className="p-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{highFindings.length}</div>
                                <div className="text-sm text-red-600">High</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">{warningFindings.length}</div>
                                <div className="text-sm text-yellow-600">Medium</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{infoFindings.length}</div>
                                <div className="text-sm text-blue-600">Info</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{secureFindings.length}</div>
                                <div className="text-sm text-green-600">Secure</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-600">{hotspotFindings.length}</div>
                                <div className="text-sm text-gray-600">Hotspot</div>
                            </div>
                        </div>

                        {/* Findings List */}
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
                            <div className="text-center py-8 text-gray-500">ไม่พบปัญหาในการวิเคราะห์</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-400">
                    MobSF Application Security Scorecard generated for {report.app_name || report.file_name} {report.version_name}
                </div>
            </div>
        </div>
        </>
       
    );
}