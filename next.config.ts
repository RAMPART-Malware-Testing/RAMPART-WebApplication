import type { NextConfig } from "next";

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
  env: {
    SERVER_URL: process.env.SERVER_URL,
  },
  images: {
    remotePatterns: [
      ...(backendPattern ? [backendPattern] : []),
      { protocol: "http", hostname: "localhost", pathname: "/**" },
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
