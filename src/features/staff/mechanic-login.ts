function normalizeTenantPortalDomainLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function buildMechanicPortalEmailDomainFromTenant(params: {
  tenantName: string;
  tenantSlug: string;
}) {
  const fromName = normalizeTenantPortalDomainLabel(params.tenantName);

  if (fromName) {
    return `${fromName}.com`;
  }

  const fromSlug = params.tenantSlug.trim().toLowerCase().replace(/-/g, "");

  if (fromSlug) {
    return `${fromSlug}.com`;
  }

  throw new Error("Tenant name is required to build a portal email domain.");
}

/** @deprecated Use buildMechanicPortalEmailDomainFromTenant */
export function buildMechanicPortalEmailDomain(tenantSlug: string) {
  return buildMechanicPortalEmailDomainFromTenant({
    tenantName: "",
    tenantSlug,
  });
}

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
  emailDomain: string;
  takenUsernames: Iterable<string>;
}) {
  const firstName = normalizeMechanicLoginPart(params.firstName);
  const lastName = normalizeMechanicLoginPart(params.lastName);

  if (!lastName) {
    throw new Error("Last name is required to generate a portal username.");
  }

  const domain = params.emailDomain.trim().toLowerCase();
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

export function normalizeMechanicPortalUsernameInput(value: string, emailDomain: string) {
  const trimmed = value.trim().toLowerCase();
  const domain = emailDomain.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("@")) {
    return trimmed;
  }

  return `${trimmed}@${domain}`;
}

export function isMechanicPortalUsername(value: string, emailDomain: string) {
  return value.trim().toLowerCase().endsWith(`@${emailDomain.trim().toLowerCase()}`);
}
