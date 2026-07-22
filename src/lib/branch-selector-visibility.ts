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
