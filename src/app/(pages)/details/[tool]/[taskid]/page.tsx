"use client";

import { useParams } from "next/navigation";
import { use, useEffect } from "react";
import axios from "axios";


interface Datareport {
    success: boolean
    task_id: string
    status: 'processing' | 'success' | 'failed'
    report: any
}

export default function Page() {
    const params = useParams();

    const tool = params?.tool as string;
    const taskid = params?.taskid as string;
    const allowedTools = ["mobsf", "cape", "virustotal"];

    if (!tool || !allowedTools.includes(tool)) {
        return <div>Invalid tool</div>;
    }

    useEffect(() => {
        if (!tool || !taskid) return; // กัน undefined

        async function fetchData() {
            try {
                const response = await axios.get<Datareport>(
                    `/api/report_target/${taskid}?tool=${tool}`,
                    { timeout: 20000 }
                );

                const data = response.data;
                console.log(data);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        fetchData();
    }, [tool, taskid]);

    return (
        <div>
            <h1>{tool}</h1>
            <p>{taskid}</p>
        </div>
    );
}