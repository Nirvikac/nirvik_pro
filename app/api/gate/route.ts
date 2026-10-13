import { NextResponse } from "next/server";
import {
  GATE_COOKIE,
  GATE_TTL_MS,
  createGateToken,
  rateLimit,
  safeEqual,
} from "@/lib/gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`gate:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const pin = process.env.SITE_PIN;
  const secret = process.env.GATE_SECRET || pin;
  if (!pin || !secret) {
    return NextResponse.json(
      { error: "Site gate is not configured." },
      { status: 503 }
    );
  }

  let submitted = "";
  try {
    if ((request.headers.get("content-type") || "").includes("application/json")) {
      const body = await request.json();
      submitted = String(body?.pin ?? "");
    } else {
      const form = await request.formData();
      submitted = String(form.get("pin") ?? "");
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!safeEqual(submitted, pin)) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const token = await createGateToken(secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(GATE_TTL_MS / 1000),
  });
  return response;
}
