import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const localOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  "localhost:3005",
  "127.0.0.1:3005",
];

// Optional: add LAN/network IP used in the "Network:" line from next dev.
if (process.env.NEXT_PUBLIC_DEV_ORIGIN) {
  localOrigins.push(process.env.NEXT_PUBLIC_DEV_ORIGIN.replace(/^https?:\/\//, ""));
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sharp"],
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
      allowedOrigins: localOrigins,
    },
  },
};

export default nextConfig;
