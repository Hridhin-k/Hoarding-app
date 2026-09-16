import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_PREFIX = /^sb-.+-auth-token/;

export function isSupabaseAuthCookie(name: string) {
  return AUTH_COOKIE_PREFIX.test(name);
}

export function expireStaleAuthCookies(
  existing: { name: string }[],
  nextNames: Set<string>,
  expire: (name: string) => void,
) {
  for (const cookie of existing) {
    if (isSupabaseAuthCookie(cookie.name) && !nextNames.has(cookie.name)) {
      expire(cookie.name);
    }
  }
}

export function copyResponseCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export function expireAuthCookieOnResponse(response: NextResponse, name: string) {
  response.cookies.set(name, "", { path: "/", maxAge: 0, sameSite: "lax" });
}

export function applyAuthCookieSetAll(
  request: NextRequest,
  cookiesToSet: { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }[],
) {
  cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
  const next = NextResponse.next({ request });
  const kept = new Set(cookiesToSet.map((cookie) => cookie.name));
  expireStaleAuthCookies(request.cookies.getAll(), kept, (name) => expireAuthCookieOnResponse(next, name));
  cookiesToSet.forEach(({ name, value, options }) => next.cookies.set(name, value, options));
  return next;
}
