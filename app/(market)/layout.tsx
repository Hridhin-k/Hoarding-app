import { MarketSiteHeader } from "@/components/market/site-header";
import { MarketSiteFooter } from "@/components/market/site-footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Marketplace",
    template: "%s · HOARDINGS360 Marketplace",
  },
  description: "Public outdoor advertising marketplace for Kerala, expanding across India.",
  robots: { index: true, follow: true },
};

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <MarketSiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <MarketSiteFooter />
    </div>
  );
}
