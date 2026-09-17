"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  PanelLeft,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { can, ROLE_LABELS, type Permission } from "@/lib/permissions/catalog";
import type { TenantContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/mark";
import { AccountMenu } from "@/components/account-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
};

const GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Inventory",
    items: [
      { href: "/manage", label: "Overview", icon: LayoutDashboard, permission: "boards.view" },
      { href: "/manage/boards", label: "Boards", icon: MapPinned, permission: "boards.view" },
      { href: "/manage/occupancy", label: "Availability", icon: CalendarRange, permission: "occupancy.view" },
      { href: "/manage/compliance", label: "Compliance", icon: ShieldCheck, permission: "compliance.view" },
    ],
  },
  {
    label: "Demand",
    items: [
      { href: "/manage/enquiries", label: "Enquiries", icon: Megaphone, permission: "enquiries.view" },
      { href: "/manage/customers", label: "Customers", icon: BriefcaseBusiness, permission: "customers.view" },
      { href: "/manage/campaigns", label: "Campaigns", icon: ClipboardList, permission: "campaigns.view" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/manage/field-jobs", label: "Field jobs", icon: ClipboardCheck, permission: "field.manage" },
      { href: "/manage/documents", label: "Documents", icon: FileText, permission: "documents.view" },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/manage/team", label: "Team", icon: Users, permission: "team.manage" },
      { href: "/manage/audit", label: "Activity", icon: ScrollText, permission: "audit.view" },
      { href: "/manage/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];

const COLLAPSE_KEY = "h360.sidebar";
const collapseListeners = new Set<() => void>();

function subscribeCollapse(listener: () => void) {
  collapseListeners.add(listener);
  return () => {
    collapseListeners.delete(listener);
  };
}

function getCollapsed() {
  return window.localStorage.getItem(COLLAPSE_KEY) === "1";
}

function setCollapsed(next: boolean) {
  window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  collapseListeners.forEach((listener) => listener());
}

function isActive(pathname: string, href: string) {
  if (href === "/manage") return pathname === "/manage";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  ctx,
  pathname,
  collapsed,
}: {
  ctx: TenantContext;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
      {GROUPS.map((group) => {
        const items = group.items.filter((item) => can(ctx, item.permission));
        if (!items.length) return null;
        return (
          <div key={group.label}>
            {collapsed ? null : (
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-muted-foreground">{group.label}</div>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-card font-medium text-foreground ring-1 ring-border"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function ManageChrome({
  ctx,
  unread,
  children,
}: {
  ctx: TenantContext;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapse, getCollapsed, () => false);

  function toggleCollapsed() {
    setCollapsed(!collapsed);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2 border-b px-3 py-4", collapsed && "justify-center px-2")}>
        <Link href="/manage" className="min-w-0">
          <BrandMark compact={collapsed} className="text-sm" />
          {collapsed ? null : (
            <div className="mt-1 truncate text-xs text-muted-foreground">{ctx.tenantName}</div>
          )}
        </Link>
      </div>
      <NavList ctx={ctx} pathname={pathname} collapsed={collapsed} />
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-background">
      <aside
        className={cn(
          "hidden shrink-0 self-stretch border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto",
          collapsed ? "w-14" : "w-56",
        )}
      >
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="h360-toolbar sticky top-0 z-20">
          <div className="flex h-14 items-center gap-2 px-4 lg:px-8">
            <Sheet>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" />}
              >
                <PanelLeft className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-56 p-0">
                <NavList ctx={ctx} pathname={pathname} collapsed={false} />
              </SheetContent>
            </Sheet>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
            >
              <PanelLeft className="size-4" />
            </Button>
            <form action="/manage/boards" className="hidden min-w-0 flex-1 md:block">
              <label className="sr-only" htmlFor="global-board-search">
                Search boards
              </label>
              <Input
                id="global-board-search"
                name="q"
                placeholder="Search boards"
                className="h-8 max-w-xs bg-background"
              />
            </form>
            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/manage/notifications"
                className="relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
              >
                <Bell className="size-4" />
                {unread > 0 ? (
                  <span className="absolute top-1.5 right-1.5 size-1.5 rounded-md bg-primary" />
                ) : null}
              </Link>
              <AccountMenu name={ctx.fullName} roleLabel={ROLE_LABELS[ctx.role]} profileHref="/manage/profile" />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
