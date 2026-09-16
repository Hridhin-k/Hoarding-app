"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/safe-path";
import { PLATFORM_INSPECT_COOKIE, TENANT_COOKIE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/env";
import { toErrorMessage } from "@/lib/errors";
import { isSupabaseAuthCookie } from "@/lib/supabase/auth-cookies";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  organizationSchema,
  profileSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/auth";

export async function signUpAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return { error: "An account with that email already exists." };
    }
    return { error: "Could not create the account. Please try again." };
  }
  if (!data.session) {
    redirect("/login?checkEmail=1");
  }
  redirect("/onboarding");
}

export type AuthActionState = { error?: string; ok?: true } | null;

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (error.code === "email_not_confirmed" || message.includes("not confirmed")) {
      return { error: "Confirm your email before signing in. Check your inbox." };
    }
    return { error: "Invalid email or password." };
  }

  const cookieStore = await cookies();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .limit(1);

  const membership = memberships?.[0];
  const { data: platformStaff } = await supabase
    .from("platform_staff")
    .select("user_id")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    revalidatePath("/", "layout");
    if (platformStaff) redirect("/platform");
    redirect("/onboarding");
  }

  cookieStore.set(TENANT_COOKIE, membership.organization_id, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");

  const defaultNext = platformStaff ? "/platform" : "/manage";
  const next = safeInternalPath(String(formData.get("next") || defaultNext), defaultNext);
  if (platformStaff && !next.startsWith("/platform")) {
    redirect("/platform");
  }
  if (membership.role === "TECHNICIAN" && (next === "/manage" || next.startsWith("/manage/"))) {
    redirect("/field");
  }
  redirect(next);
}

export async function signOutAction(formData?: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_COOKIE);
  cookieStore.delete(PLATFORM_INSPECT_COOKIE);
  for (const cookie of cookieStore.getAll()) {
    if (isSupabaseAuthCookie(cookie.name)) {
      cookieStore.delete(cookie.name);
    }
  }
  const next = formData ? String(formData.get("next") || "") : "";
  if (next.startsWith("/field")) {
    redirect("/login?next=/field");
  }
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: "Could not send a reset email. Please try again." };
  return { ok: true as const };
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "This reset link is invalid or has expired." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not update the password. Please try again." };

  const ctxCookie = await cookies();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);
  if (memberships?.[0]?.organization_id) {
    ctxCookie.set(TENANT_COOKIE, memberships[0].organization_id, { path: "/", sameSite: "lax" });
    redirect("/manage");
  }
  const { data: staff } = await supabase
    .from("platform_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (staff) redirect("/platform");
  redirect("/onboarding");
}

export async function updateProfileAction(formData: FormData) {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update your profile." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
    })
    .eq("id", user.id);

  if (error) return { error: toErrorMessage(error) };

  await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function createOrganizationAction(formData: FormData) {
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid organization details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to create an organization." };

  const { data: staff } = await supabase
    .from("platform_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (staff) {
    return { error: "Platform staff cannot create a tenant organization." };
  }

  const { data, error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_phone: parsed.data.phone ?? null,
    p_email: parsed.data.email ?? null,
    p_city: parsed.data.city ?? null,
    p_state: parsed.data.state ?? null,
  });

  if (error) return { error: toErrorMessage(error) };

  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE, data as string, {
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  redirect("/manage");
}

export async function switchTenantAction(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return { error: "You are not a member of that organization." };

  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE, tenantId, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
  redirect("/manage");
}
