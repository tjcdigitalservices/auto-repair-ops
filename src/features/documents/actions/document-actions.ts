"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDocumentJson, normalizeDocumentJson } from "@/components/document-engine/persistence/document-content";
import type {
  DocumentRecord,
  SaveDocumentInput,
  SaveDocumentResult,
} from "@/components/document-engine/persistence/types";
import { isDocumentTemplateName } from "@/components/document-engine/templates/registry";
import {
  buildDuplicateDocumentTitle,
  mapDocumentRowToRecord,
  normalizeDocumentTitle,
} from "@/features/documents/mappers";
import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import type { Json, TableRow } from "@/types/database";

type DocumentRow = TableRow<"documents">;

export async function saveDocumentAction(input: SaveDocumentInput): Promise<SaveDocumentResult> {
  const parsed = parseSaveDocumentInput(input);

  if (!parsed.ok) {
    return parsed;
  }

  const { values } = parsed;
  const { branchScope, context, supabase } = await getBranchScopedServerClient("documents:write");
  const payload = {
    tenant_id: context.tenantId,
    branch_id: branchScope.writeBranchId,
    title: values.title,
    template: values.template,
    content_json: values.contentJson as Json,
    status: values.status,
    created_by: context.staffId,
  };

  if (values.id) {
    const { data: existing, error: fetchError } = await applyBranchFilter(
      supabase.from("documents").select("id, status").eq("id", values.id),
      branchScope.selectedBranchId,
    ).maybeSingle();

    if (fetchError) {
      return { ok: false, message: fetchError.message };
    }

    if (!existing) {
      return { ok: false, message: "Document does not exist." };
    }

    if (existing.status === "published") {
      return {
        ok: false,
        message: "Published documents cannot be edited. Create a revision instead.",
      };
    }

    const { data, error } = await supabase
      .from("documents")
      .update({
        title: payload.title,
        template: payload.template,
        content_json: payload.content_json,
        status: payload.status,
        ...(payload.status === "published" ? { published_at: new Date().toISOString() } : {}),
      })
      .eq("id", values.id)
      .eq("tenant_id", context.tenantId)
      .select("*")
      .single();

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidateDocumentPaths(values.id);
    return { ok: true, document: mapDocumentRowToRecord(data as DocumentRow) };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const document = mapDocumentRowToRecord(data as DocumentRow);
  revalidateDocumentPaths(document.id);
  return { ok: true, document };
}

export async function duplicateDocumentAction(documentId: string): Promise<SaveDocumentResult> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("documents:write");

  const { data: source, error: fetchError } = await applyBranchFilter(
    supabase.from("documents").select("*").eq("id", documentId),
    branchScope.selectedBranchId,
  ).maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!source) {
    return { ok: false, message: "Document does not exist." };
  }

  const sourceRow = source as DocumentRow;
  const { data, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: context.tenantId,
      branch_id: branchScope.writeBranchId,
      title: buildDuplicateDocumentTitle(sourceRow.title),
      template: sourceRow.template,
      content_json: sourceRow.content_json,
      status: "draft",
      created_by: context.staffId,
    })
    .select("*")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const document = mapDocumentRowToRecord(data as DocumentRow);
  revalidateDocumentPaths(document.id);
  return { ok: true, document };
}

export async function archiveDocumentAction(documentId: string): Promise<SaveDocumentResult> {
  return updateDocumentStatus(documentId, "archived");
}

export async function reviseDocumentAction(documentId: string): Promise<SaveDocumentResult> {
  const { branchScope, supabase } = await getBranchScopedServerClient("documents:write");

  const { data: existing, error: fetchError } = await applyBranchFilter(
    supabase.from("documents").select("id, status").eq("id", documentId),
    branchScope.selectedBranchId,
  ).maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!existing) {
    return { ok: false, message: "Document does not exist." };
  }

  if (existing.status !== "published") {
    return { ok: false, message: "Only published documents can be revised." };
  }

  const { data: newDocumentId, error } = await supabase.rpc("create_document_revision", {
    p_document_id: documentId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!newDocumentId) {
    return { ok: false, message: "Revision could not be created." };
  }

  const { data, error: loadError } = await applyBranchFilter(
    supabase.from("documents").select("*").eq("id", newDocumentId),
    branchScope.selectedBranchId,
  ).maybeSingle();

  if (loadError) {
    return { ok: false, message: loadError.message };
  }

  if (!data) {
    return { ok: false, message: "Revision was created but could not be loaded." };
  }

  const document = mapDocumentRowToRecord(data as DocumentRow);
  revalidateDocumentPaths(documentId);
  revalidateDocumentPaths(document.id);
  return { ok: true, document };
}

export async function reviseDocumentFormAction(formData: FormData) {
  const documentId = readRequiredDocumentId(formData);
  const result = await reviseDocumentAction(documentId);

  if (!result.ok) {
    throw new Error(result.message);
  }

  redirect(`/documents/${result.document.id}`);
}

export async function deleteDocumentAction(documentId: string): Promise<SaveDocumentResult> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("documents:write");

  const { data: existing, error: fetchError } = await applyBranchFilter(
    supabase.from("documents").select("id").eq("id", documentId),
    branchScope.selectedBranchId,
  ).maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!existing) {
    return { ok: false, message: "Document does not exist." };
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("tenant_id", context.tenantId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateDocumentPaths(documentId);
  redirect("/documents");
}

async function updateDocumentStatus(
  documentId: string,
  status: DocumentRow["status"],
): Promise<SaveDocumentResult> {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("documents:write");

  const { data, error } = await applyBranchFilter(
    supabase
      .from("documents")
      .update({ status })
      .eq("id", documentId)
      .eq("tenant_id", context.tenantId)
      .select("*"),
    branchScope.selectedBranchId,
  ).maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Document does not exist." };
  }

  revalidateDocumentPaths(documentId);
  return { ok: true, document: mapDocumentRowToRecord(data as DocumentRow) };
}

function parseSaveDocumentInput(
  input: SaveDocumentInput,
):
  | { ok: true; values: Required<Pick<SaveDocumentInput, "title" | "template" | "contentJson" | "status">> & { id?: string } }
  | { ok: false; message: string } {
  if (!isDocumentTemplateName(input.template)) {
    return { ok: false, message: "Unsupported document template." };
  }

  const title = normalizeDocumentTitle(input.title, "Untitled document");
  const contentJson = normalizeDocumentJson(input.contentJson);

  if (!isDocumentJson(contentJson)) {
    return { ok: false, message: "Document content must be valid TipTap JSON." };
  }

  return {
    ok: true,
    values: {
      id: input.id,
      title,
      template: input.template,
      contentJson,
      status: input.status,
    },
  };
}

function revalidateDocumentPaths(documentId: string) {
  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
}

function readRequiredDocumentId(formData: FormData) {
  const value = formData.get("documentId");

  if (typeof value !== "string" || !value) {
    throw new Error("Required identifier is missing.");
  }

  return value;
}

export type { DocumentRecord, SaveDocumentResult };
