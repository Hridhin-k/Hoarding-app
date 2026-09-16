import Link from "next/link";

export function MarketSiteHeader() {
  return (
    <header className="sticky top-0 z-20 h360-toolbar">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-medium">
          <span className="text-primary">HOARDINGS</span>360
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/market"
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
          >
            Marketplace
          </Link>
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Media owners
          </Link>
        </nav>
      </div>
    </header>
  );
}
