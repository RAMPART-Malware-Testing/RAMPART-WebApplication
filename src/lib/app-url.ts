import type { NextRequest } from "next/server"

function configuredAppUrl(): string {
    return (process.env.APP_URL || "").trim().replace(/\/+$/, "")
}

export function appOrigin(request: NextRequest): string {
    const configured = configuredAppUrl()
    if (configured) return configured
    const forwardedHost = request.headers.get("x-forwarded-host")
    if (forwardedHost) {
        const host = forwardedHost.split(",")[0].trim()
        const proto = (request.headers.get("x-forwarded-proto") || "").split(",")[0].trim()
        const fallbackProto = new URL(request.url).protocol.replace(":", "")
        return `${proto || fallbackProto}://${host}`
    }
    return new URL(request.url).origin
}

export function appUrl(request: NextRequest, path: string): URL {
    return new URL(path, appOrigin(request))
}
