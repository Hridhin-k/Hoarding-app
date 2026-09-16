import { redirect } from "next/navigation";
import { ManageChrome } from "@/components/manage/sidebar";
import { requireTenant } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function ManageLayout({ children }: LayoutProps<"/manage">) {
  const ctx = await requireTenant();
  if (can(ctx, "field.view") && !can(ctx, "boards.view")) redirect("/field");

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .is("read_at", null);

  return (
    <ManageChrome ctx={ctx} unread={count ?? 0}>
      {ctx.tenantStatus === "suspended" ? (
        <div className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
          This organization is suspended on the marketplace. Public listings stay hidden until HOARDINGS360
          reactivates it. Manage still works.
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">{children}</main>
    </ManageChrome>
  );
}
