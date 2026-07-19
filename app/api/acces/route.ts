import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_COOKIE_NAME,
  computeAccessToken,
} from "@/lib/access-pin";

export async function POST(request: Request) {
  const pin = process.env.DASHBOARD_PIN;
  if (!pin) {
    return NextResponse.json(
      { error: "DASHBOARD_PIN n'est pas configurée." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const submitted = typeof body?.pin === "string" ? body.pin : "";

  if (submitted !== pin) {
    return NextResponse.json({ error: "Code incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE_NAME, computeAccessToken(pin), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  return response;
}
