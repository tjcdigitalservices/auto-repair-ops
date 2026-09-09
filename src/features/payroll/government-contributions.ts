export const GOVERNMENT_CONTRIBUTION_KEYS = ["sss", "philhealth", "pagibig"] as const;

export type GovernmentContributionKey = (typeof GOVERNMENT_CONTRIBUTION_KEYS)[number];

export const GOVERNMENT_CONTRIBUTION_LABELS: Record<GovernmentContributionKey, string> = {
  sss: "SSS",
  philhealth: "PhilHealth",
  pagibig: "Pag-IBIG",
};

export type ShopGovernmentContributionDefaults = {
  sssAmount: number;
  philhealthAmount: number;
  pagibigAmount: number;
};

export type CompensationContributionSettings = {
  useShopDefaultContributions: boolean;
  sssAmount: number | null;
  philhealthAmount: number | null;
  pagibigAmount: number | null;
};

export type ResolvedGovernmentContributions = {
  sssAmount: number;
  philhealthAmount: number;
  pagibigAmount: number;
};

export function resolveGovernmentContributions(params: {
  shopDefaults: ShopGovernmentContributionDefaults;
  profile: CompensationContributionSettings | null;
}): ResolvedGovernmentContributions {
  const { shopDefaults, profile } = params;

  if (!profile || profile.useShopDefaultContributions) {
    return {
      sssAmount: roundContribution(shopDefaults.sssAmount),
      philhealthAmount: roundContribution(shopDefaults.philhealthAmount),
      pagibigAmount: roundContribution(shopDefaults.pagibigAmount),
    };
  }

  return {
    sssAmount: roundContribution(profile.sssAmount ?? 0),
    philhealthAmount: roundContribution(profile.philhealthAmount ?? 0),
    pagibigAmount: roundContribution(profile.pagibigAmount ?? 0),
  };
}

export function normalizeAdjustmentLabel(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function isReservedGovernmentAdjustmentLabel(label: string) {
  const normalized = normalizeAdjustmentLabel(label);
  return (
    normalized === "sss" ||
    normalized === "philhealth" ||
    normalized === "pagibig" ||
    normalized === "pagibigfund"
  );
}

export function governmentContributionEntries(resolved: ResolvedGovernmentContributions) {
  return GOVERNMENT_CONTRIBUTION_KEYS.map((key) => ({
    key,
    label: GOVERNMENT_CONTRIBUTION_LABELS[key],
    amount:
      key === "sss"
        ? resolved.sssAmount
        : key === "philhealth"
          ? resolved.philhealthAmount
          : resolved.pagibigAmount,
  })).filter((entry) => entry.amount > 0);
}

function roundContribution(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Number(value.toFixed(4));
}
