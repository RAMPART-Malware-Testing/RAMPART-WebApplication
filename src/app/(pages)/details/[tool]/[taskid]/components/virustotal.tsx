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

export default function VirustotalPage({ taskid, tool }: { taskid: string; tool: string }) {
    const [reportData, setReportData] = useState<Datareport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"detection" | "details">("detection");
    const [searchEngine, setSearchEngine] = useState("");
    const [downloadingTool, setDownloadingTool] = useState<string | null>(null)
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

    const handleDownload = async (tool: string, md5: string) => {
        if (downloadingTool) return
        try {
            setDownloadingTool(tool)
            const url = `${SERVER_URL}/api/analy/v1/download/report/${tool}-${md5}`
            const { data } = await axios.get(url, { timeout: 30000 })
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `${tool}-${md5}.json`
            link.click()
            URL.revokeObjectURL(link.href)
        } catch {
            alert(`ดาวน์โหลด ${tool} ไม่สำเร็จ`)
        } finally {
            setDownloadingTool(null)
        }
    }
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

    if (isLoading) return <GeometricLoader loadingText="กำลังโหลดรายงาน VirusTotal" />;

    const attributes = reportData?.report?.data?.attributes;
    const stats = attributes?.last_analysis_stats || {};
    const results = attributes?.last_analysis_results || {};

    const filteredResults = Object.entries(results).filter(([name]) =>
        name.toLowerCase().includes(searchEngine.toLowerCase())
    );

    const maliciousEnginesList = filteredResults.filter(([, d]: any) => d.category === "malicious");
    const suspiciousEnginesList = filteredResults.filter(([, d]: any) => d.category === "suspicious");
    const undetectedEnginesList = filteredResults.filter(([, d]: any) => d.category === "undetected");
    const timeoutEnginesList = filteredResults.filter(([, d]: any) => d.category === "timeout");
    const unsupportedEnginesList = filteredResults.filter(([, d]: any) => d.category === "type-unsupported");


    const colorMap: any = {
        red: {
            box: "bg-red-500/5 border-red-500/20",
            header: "bg-red-500/10 text-red-400",
            text: "text-red-400"
        },
        yellow: {
            box: "bg-yellow-500/5 border-yellow-500/20",
            header: "bg-yellow-500/10 text-yellow-400",
            text: "text-yellow-400"
        },
        green: {
            box: "bg-green-500/5 border-green-500/20",
            header: "bg-green-500/10 text-green-400",
            text: "text-green-400"
        },
        orange: {
            box: "bg-orange-500/5 border-orange-500/20",
            header: "bg-orange-500/10 text-orange-400",
            text: "text-orange-400"
        },
        gray: {
            box: "bg-gray-500/5 border-gray-500/20",
            header: "bg-gray-500/10 text-gray-400",
            text: "text-gray-400"
        }
    };

    const renderGroup = (
        title: string,
        color: keyof typeof colorMap,
        engines: [string, any][],
        fallback: string
    ) => {
        if (engines.length === 0) return null;

        const c = colorMap[color];

        return (
            <div className={`${c.box} border rounded-lg overflow-hidden mb-2`}>
                <div className={`${c.header} px-4 py-2 text-sm font-medium`}>
                    {title} ({engines.length})
                </div>

                {engines.map(([name, data]) => (
                    <div key={name} className="flex justify-between px-4 py-2 border-t border-white/5 hover:bg-white/5">
                        <span className="text-white text-sm">{name}</span>
                        <span className={`${c.text} text-sm font-mono`}>
                            {data.result || fallback}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <NavbarComponent />

            <div className="min-h-screen bg-[#1a1a1a] text-white">
                <div className="bg-[#2a2a2a] border-b border-gray-700 sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-4 py-4">

                        {/* Title */}
                        <div className="flex items-center justify-between flex-wrap gap-3">

                            {/* Left: Title + Task */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-shield-virus text-blue-400 text-xl"></i>
                                    <h1 className="text-white text-lg font-semibold">
                                        VT Detection
                                    </h1>
                                </div>

                                <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                                    <span>Task ID:</span>
                                    <span className="font-mono text-gray-300 break-all">
                                        {taskid}
                                    </span>
                                    <button className="hover:text-white">
                                        <i className="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">

                                {/* Download */}
                                <button
                                    onClick={() => handleDownload(tool, attributes?.md5)}
                                    className="px-4 py-2 bg-[#86aaf9] text-[#161625] text-sm rounded-lg flex items-center gap-2 transition"
                                >
                                    <i className="fas fa-download "></i>
                                    Download Json Report
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mt-4 border-t border-gray-700"></div>

                        {/* Summary Row */}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">

                            <div className="flex items-center gap-1">
                                <i className="fas fa-bug text-red-400"></i>
                                <span>Malicious: </span>
                                <span className="text-white font-medium">{stats?.malicious || 0}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                                <span>Suspicious: </span>
                                <span className="text-white font-medium">{stats?.suspicious || 0}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <i className="fas fa-check-circle text-green-400"></i>
                                <span>Undetected: </span>
                                <span className="text-white font-medium">{stats?.undetected || 0}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <i className="fas fa-clock text-orange-400"></i>
                                <span>Timeout: </span>
                                <span className="text-white font-medium">{stats?.timeout || 0}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <i className="fas fa-ban text-gray-400"></i>
                                <span>Unsupported: </span>
                                <span className="text-white font-medium">{stats?.["type-unsupported"] || 0}</span>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto p-4">

                    {/* Search */}
                    <input
                        placeholder="Search engine..."
                        value={searchEngine}
                        onChange={(e) => setSearchEngine(e.target.value)}
                        className="w-full mb-4 px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded"
                    />

                    {/* Tabs */}
                    <div className="flex gap-4 mb-4">
                        {["detection", "details"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={activeTab === tab ? "text-purple-400" : "text-gray-400"}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Detection */}
                    {activeTab === "detection" && (
                        <>
                            {renderGroup("Malicious", "red", maliciousEnginesList, "Detected")}
                            {renderGroup("Suspicious", "yellow", suspiciousEnginesList, "Suspicious")}
                            {renderGroup("Undetected", "green", undetectedEnginesList, "Undetected")}
                            {renderGroup("Timeout", "orange", timeoutEnginesList, "Timeout")}
                            {renderGroup("Unsupported", "gray", unsupportedEnginesList, "Unsupported")}

                            {filteredResults.length === 0 && (
                                <div className="text-center text-gray-500 mt-10">
                                    No result for "{searchEngine}"
                                </div>
                            )}
                        </>
                    )}

                    {/* Details */}
                    {activeTab === "details" && (
                        <pre className="bg-[#2a2a2a] p-4 rounded text-xs overflow-auto">
                            {JSON.stringify(attributes, null, 2)}
                        </pre>
                    )}

                </div>
            </div>
        </>

    );
}