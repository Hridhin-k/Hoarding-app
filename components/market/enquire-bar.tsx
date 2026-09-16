import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketEnquireBar({ price, href }: { price: string; href: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 py-3 lg:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">From</p>
          <p className="tabular-inr text-sm font-semibold">{price}</p>
        </div>
        <Link href={href} className={cn(buttonVariants(), "min-w-28")}>
          Enquire
        </Link>
      </div>
    </div>
  );
}
