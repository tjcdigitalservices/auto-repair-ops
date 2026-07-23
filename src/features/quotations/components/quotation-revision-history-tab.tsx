import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import type { QuotationRevisionHistoryItem } from "@/features/quotations/queries/quotation-revision-history-queries";

export function QuotationRevisionHistoryTab({
  revisions,
}: {
  revisions: QuotationRevisionHistoryItem[];
}) {
  if (revisions.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/10 px-5 py-8 text-sm text-muted-foreground">
        No revisions have been recorded yet. Revisions are created when an approved quotation is
        updated and synchronized with its linked job order.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {revisions.map((revision) => (
        <article
          key={revision.id}
          className="rounded-2xl border border-border/60 bg-background px-5 py-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {formatDateTime(revision.revisedAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                {revision.revisedByName ?? "Unknown user"}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>
                {formatCurrency(revision.previousTotalAmount)} →{" "}
                {formatCurrency(revision.newTotalAmount)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-foreground">{revision.summary}</p>
        </article>
      ))}
    </div>
  );
}
