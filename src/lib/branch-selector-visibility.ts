export function shouldShowBranchSelector({
  branches,
  canSwitch,
}: {
  branches: Array<{ id: string }>;
  canSwitch: boolean;
}) {
  // Hide branch controls for single-branch tenants or users who cannot switch branches.
  return branches.length > 1 && canSwitch;
}

/** Whether branch selectors, labels, or branch names should appear in admin UI. */
export function shouldShowBranchContext({
  branches,
  canSwitch,
}: {
  branches: Array<{ id: string }>;
  canSwitch: boolean;
}) {
  return shouldShowBranchSelector({ branches, canSwitch });
}

export function appendBranchContext(
  description: string,
  branchName: string,
  showBranchContext: boolean,
) {
  if (!showBranchContext) {
    return description;
  }

  const normalized = description.trim().replace(/\.$/, "");
  return `${normalized} for ${branchName}.`;
}
