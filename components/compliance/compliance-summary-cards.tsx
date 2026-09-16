import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/enums";

const cards: Array<{
  status: ComplianceStatus;
  title: string;
  description: string;
}> = [
  {
    status: "valid",
    title: "Valid",
    description: "In good standing",
  },
  {
    status: "expiring",
    title: "Expiring",
    description: "Within 90 days",
  },
  {
    status: "expired",
    title: "Expired",
    description: "Blocks marketplace",
  },
  {
    status: "missing",
    title: "Missing",
    description: "No expiry on record",
  },
];

type Props = {
  counts: Record<ComplianceStatus, number>;
  activeStatus?: string;
};

export function ComplianceSummaryCards({ counts, activeStatus }: Props) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-4">
      {cards.map((card) => {
        const href = `/manage/compliance?status=${card.status}`;
        const active = activeStatus === card.status;
        return (
          <Link
            key={card.status}
            href={href}
            className={cn("bg-card px-4 py-3.5 hover:bg-muted/40", active && "bg-accent")}
          >
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground">{card.title}</div>
            <div className="mt-1 text-2xl font-semibold tabular-inr">{counts[card.status] ?? 0}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{card.description}</div>
          </Link>
        );
      })}
    </div>
  );
}
