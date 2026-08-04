import type { NextRequest } from "next/server";

import { getInvoicePrintDocument } from "@/features/invoices/queries/invoice-print-queries";
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

type InvoicePdfRouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function GET(request: NextRequest, context: InvoicePdfRouteContext) {
  const { invoiceId } = await context.params;
  const bearerAttempted = isBearerPdfAuthAttempted(request);
  const bearerAuth = await resolveBearerPdfAuth(request);

  if (bearerAttempted && !bearerAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  let invoiceNumber: string;
  let cookieHeader: string | null = request.headers.get("cookie");
  let authSession = bearerAuth?.session ?? null;
  let storageKey = bearerAuth?.storageKey ?? null;

  if (bearerAuth) {
    const allowed = await assertBearerStaffCapability(bearerAuth.supabase, "invoices:read");
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }

    const { data: invoice, error } = await bearerAuth.supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("id", invoiceId)
      .maybeSingle();

    if (error || !invoice) {
      return new Response("Invoice not found.", { status: 404 });
    }

    invoiceNumber = invoice.invoice_number;
    cookieHeader = bearerAuth.cookieHeader;
  } else {
    const session = await getAppSessionState();
    if (session.status !== "authenticated") {
      return new Response("Unauthorized", { status: 401 });
    }

    const document = await getInvoicePrintDocument(invoiceId);

    if (!document) {
      return new Response("Invoice not found.", { status: 404 });
    }

    invoiceNumber = document.invoice.invoiceNumber;
  }

  try {
    const printUrl = new URL(`/invoices/${invoiceId}/print`, resolvePdfInternalOrigin(request));
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader,
      authSession,
      storageKey,
    });
    const filename = `Invoice-${invoiceNumber}.pdf`;

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
        : "Unable to generate the invoice PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
