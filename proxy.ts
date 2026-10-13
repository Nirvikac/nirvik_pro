import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GATE_COOKIE, verifyGateToken } from "./lib/gate";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The gate page and its PIN-check endpoint must stay reachable while locked.
  if (pathname === "/gate" || pathname === "/api/gate") {
    return NextResponse.next();
  }

  const pin = process.env.SITE_PIN;
  const secret = process.env.GATE_SECRET || pin;

  // Fail closed: if the gate isn't configured, lock the site rather than expose it.
  if (!pin || !secret) {
    return new NextResponse(
      "Site gate is not configured. Set SITE_PIN and GATE_SECRET.",
      { status: 503 }
    );
  }

  const token = request.cookies.get(GATE_COOKIE)?.value;
  if (await verifyGateToken(token, secret)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  url.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Run for everything except Next.js build assets and static files (which have
  // a file extension), so CSS/JS/images keep loading on the gate page.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:js|css|svg|jpg|jpeg|png|webp|gif|ico|glb|gltf|woff|woff2|ttf|otf|map|json|xml|txt)$).*)",
  ],
};
