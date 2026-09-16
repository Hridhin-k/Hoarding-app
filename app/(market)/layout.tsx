import type { Metadata } from "next";
import { MarketSiteHeader } from "@/components/market/site-header";

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
    <div className="min-h-full bg-background text-foreground">
      <MarketSiteHeader />
      {children}
    </div>
  );
}
