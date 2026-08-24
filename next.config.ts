import type { NextConfig } from "next";

/**
 * Avatars (and any other user-uploaded images) are served directly from the
 * FastAPI backend (see src/lib/avatar.ts -> NEXT_PUBLIC_SERVER_URL), not
 * from this Next.js app itself. next/image refuses to optimize images from
 * a host that isn't explicitly allowlisted, so the backend's own origin
 * needs to be added here - derived from the same env var the rest of the
 * app already uses, so dev/staging/prod stay in sync automatically instead
 * of needing a second hardcoded host list.
 */
function backendRemotePattern() {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!serverUrl) return null;
  try {
    const url = new URL(serverUrl);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || "",
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

const backendPattern = backendRemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(backendPattern ? [backendPattern] : []),
      // Always allow localhost on any port too, so local dev keeps working
      // even if NEXT_PUBLIC_SERVER_URL is temporarily unset/misconfigured.
      { protocol: "http", hostname: "localhost", pathname: "/**" },
    ],
    // next/image refuses to fetch from an address that resolves to a
    // private/loopback IP by default (SSRF hardening) - which is exactly
    // what "localhost" resolves to. Safe here because the backend host is
    // developer-controlled, not user input, and this only affects local
    // dev/self-hosted deployments where frontend and backend share a
    // trusted network.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
