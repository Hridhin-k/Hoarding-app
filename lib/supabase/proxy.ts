import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { TENANT_COOKIE } from "@/lib/constants";
import { getPublicEnv, hasPublicEnv } from "@/lib/env";
import { applyAuthCookieSetAll, copyResponseCookies } from "@/lib/supabase/auth-cookies";

export async function updateSession(request: NextRequest) {
  if (!hasPublicEnv()) {
    return NextResponse.next({ request });
  }

  const env = getPublicEnv();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        supabaseResponse = applyAuthCookieSetAll(request, cookiesToSet);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/auth/");
  const isProtected =
    path.startsWith("/manage") ||
    path.startsWith("/field") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/platform");

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (user && (path === "/login" || path === "/signup")) {
    const { data: staff } = await supabase
      .from("platform_staff")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = staff ? "/platform" : "/manage";
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (!user && isAuthRoute) {
    return supabaseResponse;
  }

  const needsTenantCookie =
    path.startsWith("/manage") || path.startsWith("/field") || path.startsWith("/onboarding");

  if (user && !request.cookies.get(TENANT_COOKIE) && needsTenantCookie) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    const tenantId = memberships?.[0]?.organization_id;
    if (tenantId) {
      supabaseResponse.cookies.set(TENANT_COOKIE, tenantId, {
        path: "/",
        sameSite: "lax",
        httpOnly: false,
      });
    }
  }

  return supabaseResponse;
}
