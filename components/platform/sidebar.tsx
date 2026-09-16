"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, PanelLeft, ScrollText } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import type { PlatformStaffContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/platform", label: "Overview", icon: LayoutDashboard },
  { href: "/platform/tenants", label: "Tenants", icon: Building2 },
  { href: "/platform/audit", label: "Audit", icon: ScrollText },
];

export function PlatformSidebar({ staff }: { staff: PlatformStaffContext }) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-3">
        <Link href="/platform" className="block">
          <BrandMark className="text-sm" />
          <div className="mt-0.5 text-xs text-muted-foreground">Platform operations</div>
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
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]",
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="px-2 text-xs">
          <div className="font-medium">{staff.fullName}</div>
          <div className="text-muted-foreground">{staff.role === "SUPER_ADMIN" ? "Super admin" : "Support"}</div>
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
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto">{content}</aside>
      <div className="flex items-center justify-between border-b bg-card px-3 py-2 lg:hidden">
        <BrandMark className="text-sm" />
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation menu" />}>
            <PanelLeft className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0">
            {content}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
