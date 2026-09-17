"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand/mark";

export function MarketSiteFooter() {
  const pathname = usePathname();
  if (pathname === "/market") return null;

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <BrandMark className="text-foreground" /> marketplace · published Kerala inventory
        </p>
        <p>
          Enquiries go to the media owner.{" "}
          <Link href="/login" className="font-medium text-foreground hover:text-primary">
            Sign in to manage boards
          </Link>
        </p>
      </div>
    </footer>
  );
}
