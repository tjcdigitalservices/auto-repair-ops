import { PrintPage } from "@/components/reports/print-document-layout";
import type { DocumentPageLayout } from "@/components/document-engine/templates/types";
import type { DocumentPageProps } from "@/components/document-engine/types";
import { DEFAULT_A4_PAGE_LAYOUT } from "@/components/document-engine/templates/types";
import { cn } from "@/lib/utils";

/**
 * A single A4 page shell with header, body, and footer regions.
 * Does not know about the editor — pass body content as children.
 */
export function DocumentPage({
  header,
  footer,
  children,
  className,
  layout = DEFAULT_A4_PAGE_LAYOUT,
}: DocumentPageProps) {
  return (
    <article className={cn("document-composer-print-root", className)}>
      <PrintPage
        layoutMode="document"
        className="document-editable-page leading-[1.4]"
        bodyClassName={layout.bodyClassName ?? DEFAULT_A4_PAGE_LAYOUT.bodyClassName}
        horizontalPaddingClassName={layout.horizontalPaddingClassName}
        topPaddingClassName={layout.topPaddingClassName}
        bottomPaddingClassName={layout.bottomPaddingClassName}
        header={header}
        footer={footer}
      >
        {children}
      </PrintPage>
    </article>
  );
}
