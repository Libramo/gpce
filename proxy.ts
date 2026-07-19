import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE_NAME, isValidAccessToken } from "@/lib/access-pin";

/** Gates the dashboard page behind a shared PIN — see lib/access-pin.ts.
 * The matcher below deliberately scopes this to the page route only; API
 * routes (/api/*) are NOT covered, a deliberate choice (not this file's
 * job to second-guess — see architecture.md's Auth and Access Model). */
export default function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (isValidAccessToken(token)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/acces", request.url));
}

export const config = {
  matcher: ["/"],
};
