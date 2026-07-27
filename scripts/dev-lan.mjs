import { execSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { networkInterfaces } from "node:os";
import fs from "node:fs";
import path from "node:path";

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

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });

    server.listen(Number(port), "0.0.0.0");
  });
}

function resolveMkcertBinary() {
  try {
    const fromPath = execSync("command -v mkcert", { encoding: "utf8" }).trim();
    if (fromPath) {
      return fromPath;
    }
  } catch {
    // fall through
  }

  return null;
}

function ensureDevHttpsCertificates(lanIp) {
  const certDir = path.resolve("certificates");
  const keyPath = path.join(certDir, "localhost-key.pem");
  const certPath = path.join(certDir, "localhost.pem");
  const hosts = ["localhost", "127.0.0.1", "::1"];

  if (lanIp) {
    hosts.push(lanIp);
  }

  const markerPath = path.join(certDir, ".lan-hosts");
  const marker = hosts.join(",");

  if (
    fs.existsSync(keyPath) &&
    fs.existsSync(certPath) &&
    fs.existsSync(markerPath) &&
    fs.readFileSync(markerPath, "utf8").trim() === marker
  ) {
    return { keyPath, certPath };
  }

  const mkcert = resolveMkcertBinary();
  if (!mkcert) {
    console.warn("");
    console.warn("  mkcert is not installed — HTTPS cert may not include your LAN IP.");
    console.warn("  Install: brew install mkcert && mkcert -install");
    console.warn("  Or stop the HTTP dev server and rely on Next.js --experimental-https.");
    console.warn("");
    return null;
  }

  fs.mkdirSync(certDir, { recursive: true });

  try {
    execSync(`"${mkcert}" -install`, { stdio: "ignore" });
  } catch {
    // already installed
  }

  execSync(
    `"${mkcert}" -key-file "${keyPath}" -cert-file "${certPath}" ${hosts.map((host) => `"${host}"`).join(" ")}`,
    { stdio: "inherit" },
  );

  fs.writeFileSync(markerPath, marker);

  return { keyPath, certPath };
}

const port = process.env.PORT?.trim() || "3000";
const lanIp = getLanIPv4();
const lanOrigin = lanIp ? `${lanIp}:${port}` : null;
const useHttps = process.argv.includes("--https");

if (lanOrigin && !process.env.NEXT_PUBLIC_DEV_ORIGIN) {
  process.env.NEXT_PUBLIC_DEV_ORIGIN = lanOrigin;
}

const portBusy = await isPortInUse(port);

if (portBusy) {
  console.error("");
  console.error(`  Port ${port} is already in use — usually another "next dev" is still running.`);
  console.error("");
  console.error("  Stop it first (Ctrl+C in that terminal), then run this command again.");
  if (useHttps) {
    console.error("");
    console.error(
      "  HTTPS on your phone will not work while an HTTP dev server is still bound to this port.",
    );
    console.error("  Opening https:// in Safari while the server speaks HTTP causes ERR_SSL_PROTOCOL_ERROR.");
  }
  console.error("");
  process.exit(1);
}

const nextArgs = ["next", "dev", "--webpack", "-H", "0.0.0.0", "-p", port];

if (useHttps) {
  const certs = ensureDevHttpsCertificates(lanIp);
  nextArgs.push("--experimental-https");

  if (certs) {
    nextArgs.push("--experimental-https-key", certs.keyPath, "--experimental-https-cert", certs.certPath);
  }

  if (lanOrigin) {
    console.log("");
    console.log("  LAN HTTPS dev server (same Wi‑Fi as this machine)");
    console.log(`  https://${lanOrigin}`);
    console.log("");
    console.log("  On iPhone Safari:");
    console.log("  1. Use https:// (not http://).");
    console.log("  2. If you see a certificate warning, tap Show Details → visit website.");
    console.log("  3. Allow camera when prompted.");
    console.log("");
    console.log(
      "  For a trusted cert on iPhone (optional): AirDrop the mkcert rootCA.pem from",
      "  \"mkcert -CAROOT\" and install it under Settings → General → VPN & Device Management.",
    );
    console.log("");
  }
} else if (lanOrigin) {
  console.log("");
  console.log("  LAN HTTP dev server");
  console.log(`  http://${lanOrigin}`);
  console.log("");
  console.log("  iPhone camera scanning requires HTTPS. Run: npm run dev:lan:https");
  console.log("");
} else {
  console.warn("Could not detect a LAN IPv4 address. Set NEXT_PUBLIC_DEV_ORIGIN in .env.local.");
}

spawn("npx", nextArgs, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
