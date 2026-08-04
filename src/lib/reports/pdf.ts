import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import type { PdfAuthSession } from "@/lib/reports/pdf-auth";

const LOCAL_BROWSER_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((value): value is string => Boolean(value));

export async function renderInternalUrlToPdf(params: {
  url: string;
  cookieHeader?: string | null;
  /** Injected into localStorage before navigation (same key/shape as mobile document-viewer). */
  authSession?: PdfAuthSession | null;
  storageKey?: string | null;
}) {
  const [{ default: puppeteer }, chromiumModule] = await Promise.all([
    import("puppeteer-core"),
    import("@sparticuz/chromium"),
  ]);
  const chromium = chromiumModule.default ?? chromiumModule;
  const executablePath = await resolveBrowserExecutablePath(chromium);

  chromium.setGraphicsMode = false;

  const browser = await puppeteer.launch({
    args: puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    defaultViewport: {
      width: 1280,
      height: 1810,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false,
    },
    executablePath,
    headless: "shell",
  });

  try {
    const page = await browser.newPage();

    if (params.cookieHeader) {
      const cookies = parseCookieHeader(params.cookieHeader, params.url);
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
      }
      await page.setExtraHTTPHeaders({
        cookie: params.cookieHeader,
      });
    }

    if (params.authSession && params.storageKey) {
      const sessionJson = JSON.stringify({
        access_token: params.authSession.access_token,
        refresh_token: params.authSession.refresh_token,
        expires_at: params.authSession.expires_at,
        expires_in: params.authSession.expires_in,
        token_type: params.authSession.token_type ?? "bearer",
        user: params.authSession.user,
      });
      await page.evaluateOnNewDocument(
        (storageKey: string, payload: string) => {
          try {
            localStorage.setItem(storageKey, payload);
          } catch {
            // Ignore storage failures in print context.
          }
        },
        params.storageKey,
        sessionJson,
      );
    }

    await page.goto(params.url, {
      waitUntil: "domcontentloaded",
    });

    const finalUrl = page.url();
    if (finalUrl.includes("/login") || finalUrl.includes("/forbidden")) {
      throw new Error("Print page requires authentication.");
    }

    // Letterhead logos load from remote storage; wait so PDF capture includes them.
    await waitForPrintImages(page);

    await page.emulateMediaType("print");

    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });
  } finally {
    await browser.close();
  }
}

async function waitForPrintImages(page: {
  // puppeteer Page#evaluate — keep loosely typed to avoid coupling to puppeteer-core generics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluate: (pageFunction: () => any, ...args: never[]) => Promise<unknown>;
}) {
  const IMAGE_WAIT_MS = 3000;
  try {
    await Promise.race([
      page.evaluate(async () => {
        const images = Array.from(document.images);
        if (images.length === 0) {
          return true;
        }

        await Promise.all(
          images.map(
            (image) =>
              new Promise<void>((resolve) => {
                if (image.complete) {
                  resolve();
                  return;
                }
                const done = () => resolve();
                image.addEventListener("load", done, { once: true });
                image.addEventListener("error", done, { once: true });
              }),
          ),
        );
        return true;
      }),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), IMAGE_WAIT_MS);
      }),
    ]);
  } catch {
    // Ignore image-wait failures; PDF generation should still proceed.
  }
}

function parseCookieHeader(cookieHeader: string, url: string) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf("=");
      if (separator <= 0) {
        return null;
      }
      const name = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (!name || !value) {
        return null;
      }
      return {
        name,
        value,
        url,
        path: "/",
      };
    })
    .filter((cookie): cookie is NonNullable<typeof cookie> => cookie != null);
}

async function resolveBrowserExecutablePath(chromium: {
  executablePath: () => Promise<string>;
}) {
  if (process.env.AWS_REGION || process.env.VERCEL) {
    return chromium.executablePath();
  }

  for (const candidate of LOCAL_BROWSER_CANDIDATES) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  if (process.platform !== "linux") {
    throw new Error(
      "No local Chrome executable was found. Set PUPPETEER_EXECUTABLE_PATH or install Google Chrome to enable local PDF generation.",
    );
  }

  return chromium.executablePath();
}
