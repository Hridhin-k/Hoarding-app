"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CalendarDays, QrCode, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/mark";
import { OfflineBanner } from "@/components/field/offline-banner";

export function FieldShell({
  name,
  tenantName,
  children,
}: {
  name: string;
  tenantName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/field/sw.js", { scope: "/field/" })
        .then((reg) => reg.update())
        .catch(() => undefined);
    }
    const onOnline = () => {
      void import("@/lib/field/offline-queue").then((mod) => mod.flushProofQueue());
    };
    window.addEventListener("online", onOnline);
    if (navigator.onLine) onOnline();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const items = [
    {
      href: "/field",
      label: "Jobs",
      icon: CalendarDays,
      active: pathname === "/field" || pathname.startsWith("/field/jobs"),
    },
    {
      href: "/field/scan",
      label: "Scan",
      icon: QrCode,
      active: pathname.startsWith("/field/scan"),
    },
    {
      href: "/field/profile",
      label: "You",
      icon: User,
      active: pathname.startsWith("/field/profile"),
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      <header className="h360-toolbar flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <BrandMark compact className="text-sm" />
          <p className="truncate text-xs text-muted-foreground">
            {name} · {tenantName}
          </p>
        </div>
      </header>
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-6">{children}</main>
      <nav
        className="grid grid-cols-3 border-t border-border bg-card px-1 pt-1"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Field navigation"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md py-2 text-xs font-medium",
              item.active ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
