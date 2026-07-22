export type BrandPaletteHsl = {
  primaryColor: string;
  primaryColorStrong: string;
  primaryColorHover: string;
  accentColor: string;
  accentColorDark: string;
  softColor: string;
  borderColor: string;
};

export type LogoColorCandidate = {
  /** Button-ready HSL components, e.g. "215 90% 47%" */
  hsl: string;
  label: string;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
  weight: number;
};

type SharpModule = typeof import("sharp");

async function loadSharp(): Promise<SharpModule["default"]> {
  const sharpModule = await import("sharp");
  return sharpModule.default;
}

/**
 * Samples a logo/mark and returns distinct brand color candidates for Settings.
 */
export async function extractLogoColorCandidates(
  input: Buffer | ArrayBuffer | Uint8Array,
  limit = 5,
): Promise<LogoColorCandidate[]> {
  const colors = await sampleLogoColors(input);
  if (colors.length === 0) {
    return [];
  }

  const buttonFriendly = colors
    .filter((color) => color.s >= 24 && color.l >= 18 && color.l <= 68)
    .sort((a, b) => scoreButtonColor(b) - scoreButtonColor(a));

  const pool = buttonFriendly.length > 0 ? buttonFriendly : colors;
  const picked: HslColor[] = [];

  for (const color of pool) {
    if (picked.some((existing) => hueDistance(existing.h, color.h) < 22)) {
      continue;
    }
    picked.push(color);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked.map((color, index) => {
    const hsl = toButtonSeed(color);
    return {
      hsl,
      label: `Color ${index + 1}`,
    };
  });
}

/**
 * Builds a full theme pack from chosen primary + accent seeds.
 */
export function buildBrandPaletteFromSeeds(
  primaryHsl: string,
  accentHsl: string,
): BrandPaletteHsl | null {
  const primary = parseHsl(primaryHsl);
  const accent = parseHsl(accentHsl);

  if (!primary || !accent) {
    return null;
  }

  const primarySat = clamp(primary.s, 48, 90);
  const primaryLight = clamp(
    primary.l > 52 ? primary.l - 10 : primary.l,
    32,
    48,
  );
  const accentSat = clamp(accent.s, 50, 90);
  const accentLight = clamp(accent.l, 38, 56);

  return {
    primaryColor: formatHsl(primary.h, primarySat, primaryLight),
    primaryColorStrong: formatHsl(
      primary.h,
      Math.min(92, primarySat + 4),
      Math.max(18, primaryLight - 12),
    ),
    primaryColorHover: formatHsl(
      primary.h,
      primarySat,
      Math.min(54, primaryLight + 5),
    ),
    accentColor: formatHsl(accent.h, accentSat, accentLight),
    accentColorDark: formatHsl(
      accent.h,
      clamp(accentSat + 4, 50, 92),
      clamp(accentLight - 10, 28, 46),
    ),
    softColor: formatHsl(primary.h, clamp(primarySat - 35, 16, 42), 95),
    borderColor: formatHsl(primary.h, clamp(primarySat - 50, 8, 24), 90),
  };
}

/**
 * Samples a logo/mark image and derives tenant theme colors in the app's
 * "H S% L%" CSS-variable format (no `hsl()` wrapper).
 *
 * Primary is chosen for CTA buttons (readable white text on a vivid brand color).
 * Accent is a second distinct logo color when available.
 */
export async function deriveBrandPaletteFromLogo(
  input: Buffer | ArrayBuffer | Uint8Array,
): Promise<BrandPaletteHsl | null> {
  const candidates = await extractLogoColorCandidates(input, 4);
  if (candidates.length === 0) {
    return null;
  }

  const primary = candidates[0]!.hsl;
  const accent =
    candidates.find((candidate) => candidate.hsl !== primary)?.hsl ??
    shiftAccentSeed(primary);
  return buildBrandPaletteFromSeeds(primary, accent);
}

function shiftAccentSeed(primaryHsl: string) {
  const parsed = parseHsl(primaryHsl);
  if (!parsed) {
    return primaryHsl;
  }
  return formatHsl((parsed.h + 28) % 360, parsed.s, parsed.l);
}

async function sampleLogoColors(
  input: Buffer | ArrayBuffer | Uint8Array,
): Promise<HslColor[]> {
  try {
    const sharp = await loadSharp();
    const buffer = Buffer.isBuffer(input)
      ? input
      : Buffer.from(input instanceof ArrayBuffer ? new Uint8Array(input) : input);

    const { data, info } = await sharp(buffer)
      .rotate()
      .ensureAlpha()
      .resize(72, 72, { fit: "inside", withoutEnlargement: false })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buckets = new Map<string, HslColor>();

    for (let i = 0; i + 3 < data.length; i += info.channels) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const a = data[i + 3] ?? 255;

      if (a < 140) {
        continue;
      }

      const hsl = rgbToHsl(r, g, b);

      if (hsl.l > 94 || hsl.l < 6 || hsl.s < 12) {
        continue;
      }

      const key = `${Math.round(hsl.h / 10) * 10}:${Math.round(hsl.s / 8) * 8}:${Math.round(hsl.l / 8) * 8}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.weight += 1;
        existing.h = (existing.h * (existing.weight - 1) + hsl.h) / existing.weight;
        existing.s = (existing.s * (existing.weight - 1) + hsl.s) / existing.weight;
        existing.l = (existing.l * (existing.weight - 1) + hsl.l) / existing.weight;
      } else {
        buckets.set(key, { ...hsl, weight: 1 });
      }
    }

    return [...buckets.values()].sort(
      (a, b) => scoreBrandColor(b) - scoreBrandColor(a),
    );
  } catch {
    return [];
  }
}

function toButtonSeed(color: HslColor) {
  const sat = clamp(color.s, 48, 90);
  const light = clamp(color.l > 52 ? color.l - 10 : color.l, 32, 48);
  return formatHsl(color.h, sat, light);
}

function parseHsl(value: string): { h: number; s: number; l: number } | null {
  const match = value
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) {
    return null;
  }
  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

function scoreBrandColor(color: HslColor) {
  return color.weight * (color.s + 1) * (1 + Math.min(color.l, 100 - color.l) / 50);
}

function scoreButtonColor(color: HslColor) {
  const lightnessSweetSpot = 1 - Math.abs(color.l - 42) / 42;
  return color.weight * color.s * Math.max(0.25, lightnessSweetSpot);
}

function hueDistance(a: number, b: number) {
  const delta = Math.abs(a - b) % 360;
  return Math.min(delta, 360 - delta);
}

export function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function formatHsl(h: number, s: number, l: number) {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
