import type { NextConfig } from "next";

/**
 * Avatars (and any other user-uploaded images) are served directly from the
 * FastAPI backend (see src/lib/avatar.ts -> SERVER_URL), not from this Next.js
 * app itself. next/image refuses to optimize images from a host that isn't
 * explicitly allowlisted, so the backend's own origin needs to be added here -
 * derived from the same env var the rest of the app already uses, so
 * dev/staging/prod stay in sync automatically instead of needing a second
 * hardcoded host list.
 */
function backendRemotePattern() {
  const serverUrl = process.env.SERVER_URL;
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
  // SERVER_URL is read from client-side code (the /scan page) so the browser
  // can POST the file straight to FastAPI instead of relaying it through this
  // app. Without this key Next.js would not expose a non-public var to the
  // browser at all.
  //
  // Everything listed here is substituted into the client bundle at build time
  // and is therefore public. Only non-secret values may appear - never add
  // JWT_SECRET, OAUTH_BRIDGE_SECRET, RECAPTCHA_SECRET_KEY or the OAuth client
  // secrets.
  //
  // config.env is evaluated once, when next.config is loaded. Editing .env
  // afterwards reloads NEXT_PUBLIC_* but not this map, so a changed SERVER_URL
  // needs `next dev` restarted (or a rebuild) before the browser sees it.
  env: {
    SERVER_URL: process.env.SERVER_URL,
  },
  images: {
    remotePatterns: [
      ...(backendPattern ? [backendPattern] : []),
      // Always allow localhost on any port too, so local dev keeps working
      // even if SERVER_URL is temporarily unset/misconfigured.
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
