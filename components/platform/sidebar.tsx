"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, PanelLeft, ScrollText } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import type { PlatformStaffContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/platform", label: "Overview" },
  { href: "/platform/tenants", label: "Tenants" },
  { href: "/platform/audit", label: "Platform audit" },
];

export function PlatformSidebar({ staff }: { staff: PlatformStaffContext }) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <Link href="/platform" className="block">
          <div className="text-sm font-medium">
            <span className="text-primary">HOARDINGS</span>360
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">Platform operations</div>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/platform" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-sm",
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.href === "/platform" ? (
                <LayoutDashboard className="size-4" />
              ) : item.href.includes("audit") ? (
                <ScrollText className="size-4" />
              ) : (
                <Building2 className="size-4" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="px-2.5 text-sm">
          <div className="font-medium">{staff.fullName}</div>
          <div className="text-muted-foreground">
            {staff.role === "SUPER_ADMIN" ? "Super admin" : "Support"}
          </div>
        </div>
        <form action={signOutAction} className="mt-2">
          <input type="hidden" name="next" value="/platform" />
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:block">{content}</aside>
      <div className="flex items-center justify-between border-b px-4 py-2 lg:hidden">
        <div className="text-sm font-medium">
          <span className="text-primary">HOARDINGS</span>360
        </div>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation menu" />}>
            <PanelLeft className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            {content}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
