"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

export function MarketSiteHeader() {
  const pathname = usePathname();
  const onMarket = pathname.startsWith("/market");

  return (
    <header className="sticky top-0 z-20 h-14 h360-toolbar">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/market" className="flex min-w-0 items-baseline gap-2">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/market"
            className={cn(
              "rounded-md px-3 py-1.5",
              onMarket ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Marketplace
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Media owners
          </Link>
        </nav>
      </div>
    </header>
  );
}
