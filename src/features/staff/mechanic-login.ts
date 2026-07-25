export const MECHANIC_PORTAL_EMAIL_DOMAIN = "sayautocare.com";

export function normalizeMechanicLoginPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function buildMechanicPortalUsername(params: {
  firstName: string;
  lastName: string;
  takenUsernames: Iterable<string>;
}) {
  const firstName = normalizeMechanicLoginPart(params.firstName);
  const lastName = normalizeMechanicLoginPart(params.lastName);

  if (!lastName) {
    throw new Error("Last name is required to generate a portal username.");
  }

  const domain = MECHANIC_PORTAL_EMAIL_DOMAIN;
  const taken = new Set(
    [...params.takenUsernames].map((username) => username.trim().toLowerCase()),
  );

  const candidates = [`${lastName}@${domain}`, `${firstName}.${lastName}@${domain}`];

  for (let suffix = 2; suffix <= 99; suffix += 1) {
    candidates.push(`${firstName}.${lastName}${suffix}@${domain}`);
  }

  for (const candidate of candidates) {
    if (!taken.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  throw new Error("Could not generate a unique portal username.");
}

export function buildMechanicTemporaryPassword(lastName: string) {
  const normalizedLastName = normalizeMechanicLoginPart(lastName);

  if (!normalizedLastName) {
    throw new Error("Last name is required to generate a temporary password.");
  }

  return `${normalizedLastName}@${new Date().getFullYear()}`;
}

export function normalizeMechanicPortalUsernameInput(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("@")) {
    return trimmed;
  }

  return `${trimmed}@${MECHANIC_PORTAL_EMAIL_DOMAIN}`;
}

export function isMechanicPortalUsername(value: string) {
  return value.trim().toLowerCase().endsWith(`@${MECHANIC_PORTAL_EMAIL_DOMAIN}`);
}
