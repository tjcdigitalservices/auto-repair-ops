export function normalizeCustomerLoginPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function buildCustomerTemporaryPassword(params: {
  lastName?: string | null;
  companyName?: string | null;
  displayName?: string | null;
}) {
  const seed =
    normalizeCustomerLoginPart(params.lastName ?? "") ||
    normalizeCustomerLoginPart(params.companyName ?? "") ||
    normalizeCustomerLoginPart(params.displayName ?? "");

  if (!seed) {
    throw new Error("A name is required to generate a temporary password.");
  }

  return `${seed}@${new Date().getFullYear()}`;
}

export function normalizeCustomerPortalEmail(email: string) {
  return email.trim().toLowerCase();
}
