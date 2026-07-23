import { cache } from "react";

import { getBranchScopedServerClient } from "@/lib/branches";
import { formatCurrency } from "@/lib/currency";
import type { Json, TableRow } from "@/types/database";

type QuotationRevisionRow = TableRow<"quotation_revisions">;

export type QuotationRevisionHistoryItem = {
  id: string;
  revisedAt: string;
  revisedByName: string | null;
  previousTotalAmount: number;
  newTotalAmount: number;
  summary: string;
  changeSummary: {
    linesAdded: number;
    linesUpdated: number;
    linesRemoved: number;
  };
};

export const getQuotationRevisionHistory = cache(
  async (quotationId: string): Promise<QuotationRevisionHistoryItem[]> => {
    const { supabase } = await getBranchScopedServerClient("quotations:read");

    const { data, error } = await supabase
      .from("quotation_revisions")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("revised_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const revisions = (data ?? []) as QuotationRevisionRow[];
    const userIds = [
      ...new Set(revisions.map((row) => row.revised_by).filter((id): id is string => Boolean(id))),
    ];

    const revisedByNameByUserId = await getRevisedByNameMap(userIds);

    return revisions.map((row) => {
      const changeSummary = parseChangeSummary(row.change_summary);

      return {
        id: row.id,
        revisedAt: row.revised_at,
        revisedByName: row.revised_by ? revisedByNameByUserId.get(row.revised_by) ?? null : null,
        previousTotalAmount: row.previous_total_amount,
        newTotalAmount: row.new_total_amount,
        summary: buildRevisionSummary(changeSummary, row.previous_total_amount, row.new_total_amount),
        changeSummary,
      };
    });
  },
);

async function getRevisedByNameMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const { supabase } = await getBranchScopedServerClient("quotations:read");
  const { data, error } = await supabase
    .from("staff")
    .select("linked_user_id, first_name, last_name")
    .in("linked_user_id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row) => [
      row.linked_user_id as string,
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Staff member",
    ]),
  );
}

function parseChangeSummary(value: Json) {
  const summary = value as {
    lines_added?: number;
    lines_updated?: number;
    lines_removed?: number;
  };

  return {
    linesAdded: summary.lines_added ?? 0,
    linesUpdated: summary.lines_updated ?? 0,
    linesRemoved: summary.lines_removed ?? 0,
  };
}

function buildRevisionSummary(
  changeSummary: QuotationRevisionHistoryItem["changeSummary"],
  previousTotal: number,
  newTotal: number,
) {
  const parts = [
    changeSummary.linesAdded > 0 ? `${changeSummary.linesAdded} added` : null,
    changeSummary.linesUpdated > 0 ? `${changeSummary.linesUpdated} updated` : null,
    changeSummary.linesRemoved > 0 ? `${changeSummary.linesRemoved} removed` : null,
  ].filter(Boolean);

  const delta = newTotal - previousTotal;
  const deltaLabel =
    delta === 0
      ? "Total unchanged"
      : `Total ${delta > 0 ? "increased" : "decreased"} by ${formatCurrency(Math.abs(delta))}`;

  if (parts.length === 0) {
    return deltaLabel;
  }

  return `${parts.join(", ")} · ${deltaLabel}`;
}
