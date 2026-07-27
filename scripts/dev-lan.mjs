import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

function getLanIPv4() {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      const family = entry.family;
      const isIPv4 = family === "IPv4" || family === 4;
      if (isIPv4 && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

const port = process.env.PORT?.trim() || "3000";
const lanIp = getLanIPv4();
const lanOrigin = lanIp ? `${lanIp}:${port}` : null;

if (lanOrigin && !process.env.NEXT_PUBLIC_DEV_ORIGIN) {
  process.env.NEXT_PUBLIC_DEV_ORIGIN = lanOrigin;
}

const useHttps = process.argv.includes("--https");
const nextArgs = ["next", "dev", "--webpack", "-H", "0.0.0.0", "-p", port];

if (useHttps) {
  nextArgs.push("--experimental-https");
}

if (lanOrigin) {
  const protocol = useHttps ? "https" : "http";
  console.log("");
  console.log("  LAN dev server (same Wi‑Fi as this machine)");
  console.log(`  ${protocol}://${lanOrigin}`);
  console.log("");
  if (!useHttps) {
    console.log(
      "  Tip: Mobile browsers often require HTTPS for camera access. Run: npm run dev:lan:https",
    );
    console.log("");
  } else {
    console.log(
      "  Accept the self-signed certificate on your phone when prompted, then open the URL above.",
    );
    console.log("");
  }
} else {
  console.warn("Could not detect a LAN IPv4 address. Set NEXT_PUBLIC_DEV_ORIGIN in .env.local.");
}

spawn("npx", nextArgs, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
