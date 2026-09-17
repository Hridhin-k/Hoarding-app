"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, PanelLeft, ScrollText } from "lucide-react";
import type { PlatformStaffContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/mark";
import { AccountMenu } from "@/components/account-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/tenants", label: "Tenants", icon: Building2 },
  { href: "/platform/audit", label: "Audit", icon: ScrollText },
];

export function PlatformChrome({
  staff,
  children,
}: {
  staff: PlatformStaffContext;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-4">
        <Link href="/platform" className="block">
          <BrandMark className="text-sm" />
          <div className="mt-1 text-xs text-muted-foreground">Platform operations</div>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/platform" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]",
                active
                  ? "bg-card font-medium text-foreground ring-1 ring-border"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto">
        {content}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="h360-toolbar sticky top-0 z-20 flex h-14 items-center gap-2 px-4 lg:px-8">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu" />}>
              <PanelLeft className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              {content}
            </SheetContent>
          </Sheet>
          <BrandMark className="text-sm lg:hidden" />
          <div className="ml-auto">
            <AccountMenu
              name={staff.fullName}
              roleLabel={staff.role === "SUPER_ADMIN" ? "Super admin" : "Support"}
              signOutNext="/platform"
            />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
