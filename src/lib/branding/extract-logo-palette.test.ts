import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  deriveBrandPaletteFromLogo,
  formatHsl,
  rgbToHsl,
} from "@/lib/branding/extract-logo-palette";

describe("extract-logo-palette", () => {
  it("converts rgb to hsl channels", () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(formatHsl(225, 75, 17)).toBe("225 75% 17%");
  });

  it("uses a vivid midtone as primary so CTAs match the logo", async () => {
    // Dark navy background + bright yellow brand mark (like TJC icon).
    const png = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 11, g: 31, b: 77 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 36,
              height: 36,
              channels: 3,
              background: { r: 245, g: 180, b: 20 },
            },
          })
            .png()
            .toBuffer(),
          left: 14,
          top: 14,
        },
      ])
      .png()
      .toBuffer();

    const palette = await deriveBrandPaletteFromLogo(png);

    expect(palette).not.toBeNull();
    expect(palette?.primaryColor).toMatch(/^\d+ \d+% \d+%/);
    expect(palette?.accentColor).toMatch(/^\d+ \d+% \d+%/);
    expect(palette?.accentColor).not.toBe(palette?.primaryColor);

    const primaryLight = Number(palette!.primaryColor.split(" ")[2]?.replace("%", ""));
    // Primary should be button-friendly midtones, not near-black navy.
    expect(primaryLight).toBeGreaterThanOrEqual(30);
    expect(primaryLight).toBeLessThanOrEqual(50);
  });
});
