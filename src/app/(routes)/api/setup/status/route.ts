import { NextResponse } from "next/server";
import { needsFirstRunSetup } from "@/lib/setup-status";

export async function GET() {
    const needsSetup = await needsFirstRunSetup();
    return NextResponse.json(
        {
            success: needsSetup !== null,
            data: { needs_setup: needsSetup },
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
    );
}