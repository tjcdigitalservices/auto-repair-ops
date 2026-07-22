export const BUSINESS_ASSETS_BUCKET = "business-assets";

export function buildBusinessLogoObjectKey(
  tenantId: string,
  branchId: string,
  fileName: string,
) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`
    : "";

  return `tenants/${tenantId}/business-logos/${branchId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
}

export function buildBusinessMarkObjectKey(
  tenantId: string,
  branchId: string,
  fileName: string,
) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`
    : "";

  return `tenants/${tenantId}/business-marks/${branchId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
}

export function buildProductImageObjectKey(
  tenantId: string,
  productId: string,
  fileName: string,
) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`
    : "";

  return `tenants/${tenantId}/product-images/${productId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
}
