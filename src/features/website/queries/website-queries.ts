import { cache } from "react";
import { headers } from "next/headers";

import {
  buildBrandMap,
  buildCategoryMap,
  buildUnitMap,
} from "@/features/products/mappers";
import type { ProductType } from "@/features/products/types";
import type {
  WebsiteCatalogProduct,
  WebsitePostFormValues,
  WebsitePostListItem,
  WebsiteQuoteFormOptionData,
  WebsiteQuoteRequestListItem,
  WebsiteQuoteRequestStatus,
  WebsiteShellData,
  WebsiteActivityItem,
  WebsiteWorkspaceData,
} from "@/features/website/types";
import {
  buildWebsiteRecentActivity,
  isUuidLike,
  resolveWebsiteProductDisplayDescription,
  resolveWebsiteProductRouteSegment,
  resolveWebsitePublicUrl,
  sanitizeWebsiteBrandName,
  sanitizeWebsiteProductName,
} from "@/features/website/utils";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getTenantBrandingById } from "@/lib/branding";
import { isTenantOperable } from "@/lib/tenants/status";
import {
  getRequestTenantBranding,
  resolveRequestTenantSlug,
  sanitizeBrandName,
} from "@/lib/branding";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildBusinessLogoUrl, resolveProductImageUrl } from "@/lib/storage";
import type { TableRow } from "@/types/database";

type ProductRow = TableRow<"products">;
type CategoryRow = TableRow<"product_categories">;
type BrandRow = TableRow<"brands">;
type UnitRow = TableRow<"units">;
type WebsitePostRow = TableRow<"website_posts">;
type WebsiteQuoteRequestRow = TableRow<"website_quote_requests">;

const getWebsiteMainBranch = cache(async () => {
  const supabase = getSupabaseAdminClient();
  const slug = await resolveRequestTenantSlug();

  if (!slug) {
    throw new Error("Tenant is not configured for this request.");
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();

  if (tenantError) {
    throw new Error(tenantError.message);
  }

  if (!tenant || !["trial", "active", "past_due"].includes(tenant.status)) {
    throw new Error("Tenant is not available.");
  }

  const { data: branch, error } = await supabase
    .from("branches")
    .select("id, name, tenant_id")
    .eq("is_main", true)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!branch) {
    throw new Error("Default branch is not configured.");
  }

  return { ...branch, tenantId: tenant.id };
});

export const getWebsiteShellData = cache(async (): Promise<WebsiteShellData> => {
  const supabase = getSupabaseAdminClient();
  const [branch, branding] = await Promise.all([
    getWebsiteMainBranch(),
    getRequestTenantBranding(),
  ]);

  const { data: settings, error: settingsError } = await supabase
    .from("business_settings")
    .select("business_name, business_address, business_contact, business_email, business_logo_path, updated_at")
    .eq("branch_id", branch.id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  return {
    businessName: sanitizeBrandName(
      settings?.business_name,
      branding.companyName,
    ),
    businessLogoUrl: buildBusinessLogoUrl(settings?.business_logo_path ?? null, settings?.updated_at ?? null),
    branchName: branch.name,
    address: settings?.business_address ?? branding.address,
    contactNumber: settings?.business_contact ?? branding.phone,
    email: settings?.business_email ?? branding.supportEmail,
    logoSrc: branding.logoSrc,
    markSrc: branding.markSrc,
    facebookUrl: branding.facebookUrl,
    facebookLabel: branding.facebookLabel,
    mapsUrl: branding.mapsUrl,
    websiteUrl: branding.websiteUrl,
    storeHours: branding.storeHours,
    tagline: branding.tagline,
    companyName: branding.companyName,
    heroBackgroundSrc: branding.heroBackgroundSrc,
    featureBackgroundSrc: branding.featureBackgroundSrc,
    googleReviewsUrl: branding.googleReviewsUrl,
  };
});

export async function listWebsiteCatalogProducts({
  search,
  productType,
}: {
  search?: string;
  productType?: ProductType | "";
} = {}): Promise<WebsiteCatalogProduct[]> {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  let query = supabase
    .from("products")
    .select("*")
    .eq("website_visible", true)
    .eq("status", "active")
    .order("website_featured", { ascending: false })
    .order("website_sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (productType) {
    query = query.eq("product_type", productType);
  }

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `name.ilike.%${escapedSearch}%,website_short_description.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`,
    );
  }

  const [{ data: products, error: productError }, dictionaries] = await Promise.all([
    query,
    getWebsiteReferenceDictionaries(),
  ]);

  if (productError) {
    throw new Error(productError.message);
  }

  return ((products ?? []) as ProductRow[])
    .filter((product) => isPublicWebsiteCatalogRecord(product, branch.id))
    .map((product) =>
    mapProductRowToWebsiteCatalogProduct(product, dictionaries),
    );
}

export async function listFeaturedWebsiteProducts(limitCount = 6) {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  const [{ data: products, error: productError }, dictionaries] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("website_visible", true)
      .eq("website_featured", true)
      .eq("status", "active")
      .order("website_sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(limitCount * 3),
    getWebsiteReferenceDictionaries(),
  ]);

  if (productError) {
    throw new Error(productError.message);
  }

  return ((products ?? []) as ProductRow[])
    .filter((product) => isPublicWebsiteCatalogRecord(product, branch.id))
    .slice(0, limitCount)
    .map((product) => mapProductRowToWebsiteCatalogProduct(product, dictionaries));
}

export async function getWebsiteProductBySlug(slug: string) {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  const routeSegment = slug.trim();
  const [{ data, error }, dictionaries] = await Promise.all([
    buildWebsiteProductLookupQuery(supabase, routeSegment),
    getWebsiteReferenceDictionaries(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const matchedProduct =
    ((data ?? []) as ProductRow[]).find((product) =>
      isPublicWebsiteCatalogRecord(product, branch.id),
    ) ?? null;

  if (!matchedProduct) {
    return null;
  }

  return mapProductRowToWebsiteCatalogProduct(matchedProduct, dictionaries);
}

export async function listPublishedWebsitePosts(limitCount?: number): Promise<WebsitePostListItem[]> {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  let query = supabase
    .from("website_posts")
    .select("*")
    .eq("tenant_id", branch.tenantId)
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (typeof limitCount === "number") {
    query = query.limit(limitCount);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WebsitePostRow[]).map(mapWebsitePostRowToItem);
}

export async function getWebsiteQuoteFormOptions(): Promise<WebsiteQuoteFormOptionData> {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  const [
    { data: services, error: servicesError },
    { data: makes, error: makesError },
    { data: models, error: modelsError },
    { data: transmissions, error: transmissionsError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("name, branch_id, is_global")
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_makes")
      .select("id, name")
      .eq("tenant_id", branch.tenantId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_models")
      .select("id, make_id, name")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_lookup_options")
      .select("label")
      .eq("lookup_type", "transmission")
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
  ]);

  if (servicesError || makesError || modelsError || transmissionsError) {
    throw new Error(
      servicesError?.message ??
        makesError?.message ??
        modelsError?.message ??
        transmissionsError?.message ??
        "Unable to load website quote form options.",
    );
  }

  const makesById = new Map(
    ((makes ?? []) as Array<{ id: string; name: string }>).map((make) => [make.id, make.name]),
  );

  return {
    services: ((services ?? []) as Array<{ name: string; branch_id: string; is_global?: boolean }>)
      .filter((service) => isPublicWebsiteCatalogRecord(service, branch.id))
      .map((service) => service.name),
    vehicleMakes: (makes ?? []) as Array<{ id: string; name: string }>,
    vehicleModels: ((models ?? []) as Array<{ id: string; make_id: string; name: string }>).map(
      (model) => ({
        id: model.id,
        makeId: model.make_id,
        makeName: makesById.get(model.make_id) ?? "Unknown make",
        name: model.name,
      }),
    ),
    transmissions: ((transmissions ?? []) as Array<{ label: string }>).map(
      (option) => option.label,
    ),
  };
}

export async function listWebsitePosts(): Promise<WebsitePostListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const { data, error } = await supabase
    .from("website_posts")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WebsitePostRow[]).map(mapWebsitePostRowToItem);
}

export async function getWebsitePostById(postId: string): Promise<WebsitePostFormValues | null> {
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const { data, error } = await supabase
    .from("website_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    postId: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    coverImageUrl: data.cover_image_url ?? "",
    category: data.category as WebsitePostFormValues["category"],
    isFeatured: data.is_featured,
    status: data.status,
  };
}

export async function listWebsiteQuoteRequests({
  search,
  status,
}: {
  search?: string;
  status?: WebsiteQuoteRequestStatus | "";
} = {}): Promise<WebsiteQuoteRequestListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("quotations:read");
  let query = supabase
    .from("website_quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,contact_number.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,vehicle_make.ilike.%${escapedSearch}%,vehicle_model.ilike.%${escapedSearch}%,city.ilike.%${escapedSearch}%,province.ilike.%${escapedSearch}%,service_needed.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WebsiteQuoteRequestRow[]).map((request) => ({
    id: request.id,
    requestedProductLabel: request.requested_product_label,
    firstName: request.first_name,
    lastName: request.last_name,
    contactNumber: request.contact_number,
    email: request.email,
    province: request.province,
    city: request.city,
    barangay: request.barangay,
    vehicleMake: request.vehicle_make,
    vehicleModel: request.vehicle_model,
    vehicleYear: request.vehicle_year,
    transmission: request.transmission,
    mileage: request.mileage,
    engineSize: request.engine_size,
    oilRequirementLiters: request.oil_requirement_liters,
    serviceNeeded: request.service_needed,
    customerConcern: request.customer_concern,
    status: request.status as WebsiteQuoteRequestStatus,
    createdAt: request.created_at,
    contactedAt: request.contacted_at,
  }));
}

export async function getWebsiteWorkspaceData(): Promise<WebsiteWorkspaceData> {
  const { context, supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const requestHost = (await headers()).get("host");
  const [
    branding,
    { data: tenant, error: tenantError },
    { count: publishedProducts, error: publishedProductsError },
    { count: draftProducts, error: draftProductsError },
    { count: publishedPosts, error: publishedPostsError },
    { count: draftPosts, error: draftPostsError },
    { count: pendingRequests, error: pendingRequestsError },
    { data: recentProducts, error: recentProductsError },
    { data: recentPosts, error: recentPostsError },
    { data: recentRequests, error: recentRequestsError },
    { data: latestPublishedProduct, error: latestPublishedProductError },
    { data: latestPublishedPost, error: latestPublishedPostError },
  ] = await Promise.all([
    getTenantBrandingById(context.tenantId),
    supabase.from("tenants").select("status, slug").eq("id", context.tenantId).maybeSingle(),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("website_visible", true)
      .eq("status", "active"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("website_visible", false)
      .eq("status", "active"),
    supabase
      .from("website_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("website_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "inactive"),
    supabase
      .from("website_quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("products")
      .select("id, name, website_visible, updated_at, created_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("website_posts")
      .select("id, title, status, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("website_quote_requests")
      .select("id, first_name, last_name, service_needed, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("updated_at")
      .eq("website_visible", true)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("website_posts")
      .select("published_at, updated_at")
      .eq("status", "active")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (
    tenantError ||
    publishedProductsError ||
    draftProductsError ||
    publishedPostsError ||
    draftPostsError ||
    pendingRequestsError ||
    recentProductsError ||
    recentPostsError ||
    recentRequestsError ||
    latestPublishedProductError ||
    latestPublishedPostError
  ) {
    throw new Error(
      tenantError?.message ??
        publishedProductsError?.message ??
        draftProductsError?.message ??
        publishedPostsError?.message ??
        draftPostsError?.message ??
        pendingRequestsError?.message ??
        recentProductsError?.message ??
        recentPostsError?.message ??
        recentRequestsError?.message ??
        latestPublishedProductError?.message ??
        latestPublishedPostError?.message ??
        "Unable to load website workspace data.",
    );
  }

  const productActivity: WebsiteActivityItem[] = ((recentProducts ?? []) as Array<
    Pick<ProductRow, "id" | "name" | "website_visible" | "updated_at" | "created_at">
  >)
    .filter((product) => product.website_visible)
    .map((product) => {
      const isNewPublish =
        Date.parse(product.updated_at) - Date.parse(product.created_at) < 5 * 60 * 1000;

      return {
        id: `product-${product.id}`,
        type: isNewPublish ? "product_published" : "product_updated",
        title: isNewPublish ? "Product published" : "Product updated",
        detail: product.name,
        occurredAt: product.updated_at,
        href: `/products/${product.id}/edit`,
      };
    });

  const postActivity: WebsiteActivityItem[] = ((recentPosts ?? []) as Array<
    Pick<WebsitePostRow, "id" | "title" | "status" | "created_at" | "published_at">
  >).map((post) => ({
    id: `post-${post.id}`,
    type: "journal_post_created",
    title: "Journal post created",
    detail: post.title,
    occurredAt: post.published_at ?? post.created_at,
    href: `/settings/website/journal/${post.id}/edit`,
  }));

  const requestActivity: WebsiteActivityItem[] = ((recentRequests ?? []) as Array<
    Pick<
      WebsiteQuoteRequestRow,
      "id" | "first_name" | "last_name" | "service_needed" | "created_at"
    >
  >).map((request) => ({
    id: `request-${request.id}`,
    type: "quote_request_received",
    title: "Quote request received",
    detail: `${request.first_name} ${request.last_name} · ${request.service_needed}`,
    occurredAt: request.created_at,
    href: "/quotations/website-requests",
  }));

  const lastPublishedCandidates = [
    latestPublishedProduct?.updated_at ?? null,
    latestPublishedPost?.published_at ?? latestPublishedPost?.updated_at ?? null,
  ].filter(Boolean) as string[];

  return {
    products: {
      published: publishedProducts ?? 0,
      draft: draftProducts ?? 0,
    },
    journal: {
      published: publishedPosts ?? 0,
      draft: draftPosts ?? 0,
    },
    quoteRequests: {
      pending: pendingRequests ?? 0,
    },
    status: {
      isOnline: tenant ? isTenantOperable(tenant.status) : false,
      publicUrl: resolveWebsitePublicUrl({
        websiteUrl: branding.websiteUrl,
        tenantSlug: tenant?.slug ?? null,
        requestHost,
      }),
      lastPublishedAt:
        lastPublishedCandidates.sort((left, right) => right.localeCompare(left))[0] ?? null,
    },
    recentActivity: buildWebsiteRecentActivity([
      ...productActivity,
      ...postActivity,
      ...requestActivity,
    ]),
  };
}

const getWebsiteReferenceDictionaries = cache(async () => {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  const [
    { data: categories, error: categoriesError },
    { data: brands, error: brandsError },
    { data: units, error: unitsError },
  ] = await Promise.all([
    supabase
      .from("product_categories")
      .select("*")
      .eq("tenant_id", branch.tenantId)
      .eq("status", "active"),
    supabase
      .from("brands")
      .select("*")
      .eq("tenant_id", branch.tenantId)
      .eq("status", "active"),
    supabase.from("units").select("*").eq("tenant_id", branch.tenantId),
  ]);

  if (categoriesError || brandsError || unitsError) {
    throw new Error(
      categoriesError?.message ??
        brandsError?.message ??
        unitsError?.message ??
        "Unable to load website reference data.",
    );
  }

  return {
    categories: buildCategoryMap((categories ?? []) as CategoryRow[]),
    brands: buildBrandMap((brands ?? []) as BrandRow[]),
    units: buildUnitMap((units ?? []) as UnitRow[]),
  };
});

function mapProductRowToWebsiteCatalogProduct(
  row: ProductRow,
  dictionaries: {
    categories: Map<string, string>;
    brands: Map<string, string>;
    units: Map<string, string>;
  },
): WebsiteCatalogProduct {
  const categoryName = row.category_id ? dictionaries.categories.get(row.category_id) ?? null : null;
  const brandName = row.brand_id ? dictionaries.brands.get(row.brand_id) ?? null : null;
  const name = sanitizeWebsiteProductName(row.name);
  const descriptionContext = {
    name,
    categoryName,
    productType: row.product_type,
  };

  return {
    id: row.id,
    name,
    slug: resolveWebsiteProductRouteSegment({
      id: row.id,
      websiteSlug: row.website_slug,
    }),
    productType: row.product_type,
    categoryName,
    brandName: sanitizeWebsiteBrandName(brandName),
    unitLabel: dictionaries.units.get(row.unit_id) ?? "Unit",
    price: row.selling_price,
    badge: row.website_badge,
    shortDescription: resolveWebsiteProductDisplayDescription({
      ...descriptionContext,
      shortDescription: row.website_short_description,
      description: null,
    }),
    description: resolveWebsiteProductDisplayDescription(descriptionContext),
    imageUrl: resolveProductImageUrl({
      productImagePath: row.product_image_path,
      productImageUrl: row.product_image_url,
      websiteImageUrl: row.website_image_url,
      cacheBust: row.updated_at,
    }),
    isFeatured: row.website_featured,
    sortOrder: row.website_sort_order,
  };
}

function mapWebsitePostRowToItem(row: WebsitePostRow): WebsitePostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    category: row.category as WebsitePostListItem["category"],
    isFeatured: row.is_featured,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

function buildWebsiteProductLookupQuery(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  routeSegment: string,
) {
  let query = supabase
    .from("products")
    .select("*")
    .eq("website_visible", true)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(2);

  if (isUuidLike(routeSegment)) {
    const escapedRouteSegment = routeSegment.replaceAll(",", "\\,");
    return query.or(
      `id.eq.${escapedRouteSegment},website_slug.eq.${escapedRouteSegment}`,
    );
  }

  return query.eq("website_slug", routeSegment);
}

function isPublicWebsiteCatalogRecord(
  row: { branch_id: string; is_global?: boolean | null },
  mainBranchId: string,
) {
  return row.branch_id === mainBranchId || row.is_global === true;
}
