import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "cepm12_session";
const protectedPrefixes = ["/admin", "/store", "/account"];

// Optimistic check only: confirms a session cookie exists before letting the
// request through. The authoritative check (session validity + role) happens
// in each page via requireUser() — see src/lib/auth/dal.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/store/:path*", "/account/:path*"],
};
