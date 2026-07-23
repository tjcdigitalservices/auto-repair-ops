import { cache } from "react";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import {
  getBusinessSettingsValues,
  getPublicPresenceSettingsValues,
} from "@/features/settings/queries/settings-queries";
import {
  mapDocumentRowToListItem,
  mapDocumentRowToRecord,
} from "@/features/documents/mappers";
import type {
  DocumentEditorPageData,
  DocumentListFilters,
  DocumentListItem,
} from "@/features/documents/types";
import type { DocumentRecord } from "@/components/document-engine/persistence/types";
import type { TableRow } from "@/types/database";

type DocumentRow = TableRow<"documents">;

export async function getDocumentEditorPageData(): Promise<DocumentEditorPageData> {
  const { branchScope } = await getBranchScopedServerClient("documents:write");
  const [settings, publicPresence] = await Promise.all([
    getBusinessSettingsValues(),
    getPublicPresenceSettingsValues(),
  ]);

  return {
    branchName: branchScope.selectedBranch?.name ?? branchScope.selectedBranchLabel,
    businessProfile: {
      businessName: settings.businessName,
      businessLogoUrl: settings.businessLogoUrl,
      businessVatRegistrationNo: settings.businessVatRegistrationNo || null,
      businessContact: settings.businessContact || null,
      businessEmail: settings.businessEmail || null,
      businessAddress: settings.businessAddress || null,
      websiteUrl: publicPresence.websiteUrl || null,
      facebookLabel: publicPresence.facebookLabel || null,
    },
  };
}

export async function listDocuments(
  filters: DocumentListFilters = {},
): Promise<DocumentListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("documents:read");
  let query = applyBranchFilter(
    supabase
      .from("documents")
      .select("id, title, template, status, updated_at")
      .neq("status", "archived")
      .order("updated_at", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    query = query.ilike("title", `%${escapeSearchTerm(filters.search.trim())}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DocumentRow[]).map(mapDocumentRowToListItem);
}

export const getDocumentById = cache(async (documentId: string): Promise<DocumentRecord | null> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("documents:read");

  const { data, error } = await applyBranchFilter(
    supabase.from("documents").select("*").eq("id", documentId),
    branchScope.selectedBranchId,
  ).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapDocumentRowToRecord(data as DocumentRow);
});

function escapeSearchTerm(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}
