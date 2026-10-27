import { NextResponse } from "next/server";

import { SANDBOX_COOKIE } from "@/features/sandbox/constants";

function redirectOnRequestHost(request: Request, pathname: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const url = host ? `${proto}://${host}${pathname}` : new URL(pathname, request.url).toString();
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const next = formData?.get("next");
  const pathname = next === "/portal/attendance" ? "/portal/attendance" : "/dashboard";
  const response = redirectOnRequestHost(request, pathname);
  response.cookies.set(SANDBOX_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
