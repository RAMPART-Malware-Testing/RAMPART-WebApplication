"use client";

import { useParams } from "next/navigation";
import { use, useEffect } from "react";
import axios from "axios";
import { report } from "process";


interface Datareport {
    success: boolean
    task_id: string
    status: 'processing' | 'success' | 'failed'
    report: any
}


export default function Page() {

    return(
        <>
        Cape
        </>
    )
}