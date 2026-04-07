"use client";

import { useParams } from "next/navigation";
import { use, useEffect } from "react";
import axios from "axios";
import mobsf from "./components/mobsf";
import cape from "./components/cape";
import virustotal from "./components/virustotal";

type ToolProps = {
  taskid: string;
  tool: string;
};

const TOOL_COMPONENTS: Record<string, React.ComponentType<ToolProps>> = {
  mobsf: mobsf,
  cape: cape,
  virustotal: virustotal,
};

export default function Page() {
    const params = useParams();
    const tool = params?.tool as string;
    const taskid = params?.taskid as string;
    const allowedTools = ["mobsf", "cape", "virustotal"];
    if (!tool || !allowedTools.includes(tool)) {
        return <div>Invalid tool</div>;
    }

    const ToolComponent = TOOL_COMPONENTS[tool];
    return <ToolComponent taskid={taskid} tool={tool} />;

}