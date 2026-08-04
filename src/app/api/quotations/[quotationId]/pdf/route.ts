import type { NextRequest } from "next/server";

import { resolveQuotationPrintMode } from "@/features/quotations/report-utils";
import { getQuotationPrintDocument } from "@/features/quotations/queries/quotation-print-queries";
import { getAppSessionState } from "@/lib/auth/session";
import {
  assertBearerStaffCapability,
  isBearerPdfAuthAttempted,
  resolveBearerPdfAuth,
  resolvePdfInternalOrigin,
} from "@/lib/reports/pdf-auth";
import { renderInternalUrlToPdf } from "@/lib/reports/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuotationPdfRouteContext = {
  params: Promise<{
    quotationId: string;
  }>;
};

export async function GET(request: NextRequest, context: QuotationPdfRouteContext) {
  const { quotationId } = await context.params;
  const mode = resolveQuotationPrintMode(request.nextUrl.searchParams.get("mode"));
  const bearerAttempted = isBearerPdfAuthAttempted(request);
  const bearerAuth = await resolveBearerPdfAuth(request);

  if (bearerAttempted && !bearerAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  let quotationNumber: string;
  let cookieHeader: string | null = request.headers.get("cookie");
  let authSession = bearerAuth?.session ?? null;
  let storageKey = bearerAuth?.storageKey ?? null;

  if (bearerAuth) {
    const allowed = await assertBearerStaffCapability(bearerAuth.supabase, "quotations:read");
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }

    const { data: quotation, error } = await bearerAuth.supabase
      .from("quotations")
      .select("id, quotation_number")
      .eq("id", quotationId)
      .maybeSingle();

    if (error || !quotation) {
      return new Response("Quotation not found.", { status: 404 });
    }

    quotationNumber = quotation.quotation_number;
    cookieHeader = bearerAuth.cookieHeader;
  } else {
    const session = await getAppSessionState();
    if (session.status !== "authenticated") {
      return new Response("Unauthorized", { status: 401 });
    }

    const document = await getQuotationPrintDocument(quotationId);

    if (!document) {
      return new Response("Quotation not found.", { status: 404 });
    }

    quotationNumber = document.quotation.quotationNumber;
  }

  try {
    const printUrl = new URL(`/quotations/${quotationId}/print`, resolvePdfInternalOrigin(request));
    if (mode !== "full") {
      printUrl.searchParams.set("mode", mode);
    }
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader,
      authSession,
      storageKey,
    });
    const filename = `Quotation-${quotationNumber}${mode === "full" ? "" : `-${mode}`}.pdf`;

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate the quotation PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
