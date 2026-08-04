import type { NextRequest } from "next/server";

import { getJobOrderPrintDocument } from "@/features/job-orders/queries/job-order-print-queries";
import { resolveJobOrderPrintHidePrices } from "@/features/job-orders/print-utils";
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

type JobOrderPdfRouteContext = {
  params: Promise<{
    jobOrderId: string;
  }>;
};

export async function GET(request: NextRequest, context: JobOrderPdfRouteContext) {
  const { jobOrderId } = await context.params;
  const hidePrices = resolveJobOrderPrintHidePrices({
    hidePrices: request.nextUrl.searchParams.get("hidePrices") ?? undefined,
    showPrices: request.nextUrl.searchParams.get("showPrices") ?? undefined,
  });
  const bearerAttempted = isBearerPdfAuthAttempted(request);
  const bearerAuth = await resolveBearerPdfAuth(request);

  if (bearerAttempted && !bearerAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  let jobOrderNumber: string;
  let cookieHeader: string | null = request.headers.get("cookie");
  let authSession = bearerAuth?.session ?? null;
  let storageKey = bearerAuth?.storageKey ?? null;

  if (bearerAuth) {
    const allowed = await assertBearerStaffCapability(bearerAuth.supabase, "job_orders:read");
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }

    const { data: jobOrder, error } = await bearerAuth.supabase
      .from("job_orders")
      .select("id, job_order_number")
      .eq("id", jobOrderId)
      .maybeSingle();

    if (error || !jobOrder) {
      return new Response("Job order not found.", { status: 404 });
    }

    jobOrderNumber = jobOrder.job_order_number;
    cookieHeader = bearerAuth.cookieHeader;
  } else {
    const session = await getAppSessionState();
    if (session.status !== "authenticated") {
      return new Response("Unauthorized", { status: 401 });
    }

    const document = await getJobOrderPrintDocument(jobOrderId);

    if (!document) {
      return new Response("Job order not found.", { status: 404 });
    }

    jobOrderNumber = document.jobOrder.jobOrderNumber;
  }

  try {
    const printUrl = new URL(`/job-orders/${jobOrderId}/print`, resolvePdfInternalOrigin(request));
    if (!hidePrices) {
      printUrl.searchParams.set("showPrices", "1");
    }
    const pdfBuffer = await renderInternalUrlToPdf({
      url: printUrl.toString(),
      cookieHeader,
      authSession,
      storageKey,
    });
    const filename = `JobOrder-${jobOrderNumber}${hidePrices ? "-Workshop" : ""}.pdf`;

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
        : "Unable to generate the job order PDF in this environment.";

    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
