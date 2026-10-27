export function normalizeIpAddress(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let candidate = value.split(",")[0]?.trim() ?? "";

  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("::ffff:")) {
    candidate = candidate.slice("::ffff:".length);
  }

  if (candidate.startsWith("[") && candidate.includes("]")) {
    candidate = candidate.slice(1, candidate.indexOf("]"));
  }

  if (ipVersion(candidate) === 0 && candidate.includes(":")) {
    const ipv4Candidate = candidate.split(":")[0]?.trim() ?? "";

    if (ipVersion(ipv4Candidate) === 4) {
      candidate = ipv4Candidate;
    }
  }

  return ipVersion(candidate) === 0 ? null : candidate;
}

export function isValidIpAddress(value: string) {
  return normalizeIpAddress(value) !== null;
}

export function isPublicIpAddress(value: string) {
  const normalized = normalizeIpAddress(value);

  if (!normalized) {
    return false;
  }

  const version = ipVersion(normalized);

  if (version === 4) {
    return isPublicIpv4Address(normalized);
  }

  if (version === 6) {
    return isPublicIpv6Address(normalized);
  }

  return false;
}

export function normalizePublicIpAddress(value: string | null | undefined) {
  const normalized = normalizeIpAddress(value);

  if (!normalized) {
    return null;
  }

  return isPublicIpAddress(normalized) ? normalized : null;
}

export function ipMatchesAllowedList(
  requestIp: string | null,
  allowedIps: Array<{ ipAddress: string }>,
) {
  if (!requestIp) {
    return null;
  }

  const normalizedRequestIp = normalizeIpAddress(requestIp);

  if (!normalizedRequestIp) {
    return null;
  }

  return (
    allowedIps.find(
      (allowedIp) => normalizeIpAddress(allowedIp.ipAddress) === normalizedRequestIp,
    ) ?? null
  );
}

function ipVersion(value: string) {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    const parts = value.split(".").map((part) => Number(part));
    return parts.every((part) => part >= 0 && part <= 255) ? 4 : 0;
  }

  if (value.includes(":") && /^[0-9a-fA-F:]+$/.test(value)) {
    return 6;
  }

  return 0;
}

function isPublicIpv4Address(value: string) {
  const parts = value.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  if (a === 0 || a === 10 || a === 127) {
    return false;
  }

  if (a === 169 && b === 254) {
    return false;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return false;
  }

  if (a === 192 && b === 168) {
    return false;
  }

  if (a === 100 && b >= 64 && b <= 127) {
    return false;
  }

  if (a >= 224) {
    return false;
  }

  return true;
}

function isPublicIpv6Address(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "::1" || normalized === "::") {
    return false;
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return false;
  }

  if (normalized.startsWith("fe8") || normalized.startsWith("fe9")) {
    return false;
  }

  if (normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return false;
  }

  return true;
}
