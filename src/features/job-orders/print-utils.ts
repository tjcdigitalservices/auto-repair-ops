export function resolveJobOrderPrintHidePrices(searchParams?: {
  hidePrices?: string;
  showPrices?: string;
}) {
  if (searchParams?.showPrices === "1" || searchParams?.hidePrices === "0") {
    return false;
  }

  return true;
}
