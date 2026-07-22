import "server-only";

import type { StoreHoursDay } from "@/lib/branding/types";
import { DEFAULT_BRAND_PACK } from "@/lib/branding/types";

import {
  mapStoreHoursToFormValues,
  STORE_HOUR_DAY_NAMES,
  storeHourFieldName,
} from "@/features/settings/store-hours.shared";

export {
  mapStoreHoursToFormValues,
  STORE_HOUR_DAY_NAMES,
  storeHourFieldName,
} from "@/features/settings/store-hours.shared";
export type { StoreHourDayName } from "@/features/settings/store-hours.shared";

export function defaultStoreHourFormValues(): Record<string, string> {
  return mapStoreHoursToFormValues([...DEFAULT_BRAND_PACK.storeHours]);
}

export function parseStoreHoursFormData(formData: FormData): StoreHoursDay[] {
  return STORE_HOUR_DAY_NAMES.map((day) => {
    const value = formData.get(storeHourFieldName(day));
    const hours = typeof value === "string" ? value.trim() : "";
    return {
      day,
      hours: hours || "Closed",
    };
  });
}

export function mapTenantBrandingToPublicPresenceValues(branding: {
  website_url?: string | null;
  facebook_url?: string | null;
  facebook_label?: string | null;
  store_hours?: unknown;
} | null): {
  websiteUrl: string;
  facebookUrl: string;
  facebookLabel: string;
  storeHours: Record<string, string>;
} {
  const storeHours = Array.isArray(branding?.store_hours)
    ? branding.store_hours
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null;
          }
          const day = "day" in entry ? String(entry.day ?? "") : "";
          const hours = "hours" in entry ? String(entry.hours ?? "") : "";
          if (!day || !hours) {
            return null;
          }
          return { day, hours };
        })
        .filter((entry): entry is StoreHoursDay => entry !== null)
    : [...DEFAULT_BRAND_PACK.storeHours];

  return {
    websiteUrl: branding?.website_url ?? "",
    facebookUrl: branding?.facebook_url ?? "",
    facebookLabel: branding?.facebook_label ?? "",
    storeHours: mapStoreHoursToFormValues(storeHours),
  };
}
