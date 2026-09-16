"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CalendarDays, QrCode, User } from "lucide-react";
import { cn } from "@/lib/utils";
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
      label: "Profile",
      icon: User,
      active: pathname.startsWith("/field/profile"),
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
      <header className="h360-toolbar flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <div className="text-sm font-medium">
            <span className="text-primary">H360</span> Field
          </div>
          <div className="truncate text-sm text-foreground">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{tenantName}</div>
        </div>
        <Link
          href="/field/profile"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Open profile and sign out"
        >
          <User className="size-5" />
        </Link>
      </header>
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto p-4 pb-6">{children}</main>
      <nav
        className="grid grid-cols-3 border-t border-border bg-card px-2 pt-1"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Field navigation"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-full py-2 text-xs font-medium",
              item.active ? "text-primary" : "text-muted-foreground hover:text-foreground",
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
