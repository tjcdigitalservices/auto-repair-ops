import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const devPort = process.env.PORT?.trim() || "3000";

const localOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  "localhost:3001",
  "127.0.0.1:3001",
  "localhost:3002",
  "127.0.0.1:3002",
  "localhost:3005",
  "127.0.0.1:3005",
  `localhost:${devPort}`,
  `127.0.0.1:${devPort}`,
];

function appendOriginsFromEnv(origins: string[]) {
  const raw = process.env.DEV_ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_DEV_ORIGIN;
  if (!raw) {
    return origins;
  }

  const merged = [...origins];
  for (const part of raw.split(",")) {
    const host = part.trim().replace(/^https?:\/\//, "");
    if (host && !merged.includes(host)) {
      merged.push(host);
    }
  }

  return merged;
}

// RFC1918-style patterns for phone/tablet testing on the same Wi‑Fi (hostname only).
const privateLanHostPatterns = ["192.168.*.*", "10.*.*.*", "172.*.*.*"];

const serverActionAllowedOrigins = appendOriginsFromEnv([
  ...localOrigins,
  ...privateLanHostPatterns,
]);

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sharp"],
  ...(isDev
    ? {
        allowedDevOrigins: appendOriginsFromEnv([
          "localhost",
          "127.0.0.1",
          ...privateLanHostPatterns,
        ]),
      }
    : {}),
  images: supabaseUrl
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
          },
        ],
      }
    : undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
      allowedOrigins: serverActionAllowedOrigins,
    },
  },
};

export default nextConfig;
