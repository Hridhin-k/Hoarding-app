"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  PanelLeft,
  Settings,
  ShieldCheck,
  Users,
  CalendarRange,
  BriefcaseBusiness,
  ScrollText,
  UserRound,
} from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { can } from "@/lib/permissions/catalog";
import type { TenantContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ROLE_LABELS } from "@/lib/permissions/catalog";

const NAV = [
  { href: "/manage", label: "Dashboard", icon: LayoutDashboard, permission: "boards.view" as const },
  { href: "/manage/boards", label: "Boards", icon: MapPinned, permission: "boards.view" as const },
  { href: "/manage/occupancy", label: "Occupancy", icon: CalendarRange, permission: "occupancy.view" as const },
  { href: "/manage/compliance", label: "Compliance", icon: ShieldCheck, permission: "compliance.view" as const },
  { href: "/manage/enquiries", label: "Enquiries", icon: Megaphone, permission: "enquiries.view" as const },
  { href: "/manage/customers", label: "Customers", icon: BriefcaseBusiness, permission: "customers.view" as const },
  { href: "/manage/campaigns", label: "Campaigns", icon: ClipboardList, permission: "campaigns.view" as const },
  { href: "/manage/field-jobs", label: "Field jobs", icon: FolderOpen, permission: "field.manage" as const },
  { href: "/manage/documents", label: "Documents", icon: FolderOpen, permission: "documents.view" as const },
  { href: "/manage/team", label: "Team", icon: Users, permission: "team.manage" as const },
  { href: "/manage/audit", label: "Audit", icon: ScrollText, permission: "audit.view" as const },
  { href: "/manage/settings", label: "Settings", icon: Settings, permission: "settings.manage" as const },
];

export function ManageSidebar({ ctx, unread }: { ctx: TenantContext; unread: number }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => can(ctx, item.permission));

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <Link href="/manage" className="block">
          <div className="text-sm font-medium">
            <span className="text-primary">HOARDINGS</span>360
          </div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">{ctx.tenantName}</div>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/manage" && pathname.startsWith(item.href));
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
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Link href="/manage/notifications" className="mb-2 flex items-center justify-between rounded-lg px-2.5 py-2 text-sm hover:bg-muted">
          <span className="flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
          </span>
          {unread > 0 ? (
            <span className="rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">{unread}</span>
          ) : null}
        </Link>
        <Link href="/manage/profile" className="mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted">
          <UserRound className="size-4" />
          Profile
        </Link>
        <div className="px-2.5 py-1 text-xs text-muted-foreground">
          {ctx.fullName}
          <div>{ROLE_LABELS[ctx.role]}</div>
        </div>
        <form action={signOutAction}>
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar lg:block">{content}</aside>
      <div className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
        <div>
          <div className="text-sm font-medium">
            <span className="text-primary">HOARDINGS</span>360
          </div>
          <div className="text-sm text-muted-foreground">{ctx.tenantName}</div>
        </div>
        <Sheet>
          <SheetTrigger
            render={<Button variant="outline" size="icon" aria-label="Open navigation menu" />}
          >
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
