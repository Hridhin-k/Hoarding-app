import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/enums";

const cards: Array<{
  status: ComplianceStatus;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    status: "valid",
    title: "Valid",
    description: "Mandatory clearances in good standing",
    accent: "border-emerald-200 bg-emerald-50/50",
  },
  {
    status: "expiring",
    title: "Expiring soon",
    description: "Expires within 90 days",
    accent: "border-amber-200 bg-amber-50/50",
  },
  {
    status: "expired",
    title: "Expired",
    description: "Blocks marketplace publication",
    accent: "border-red-200 bg-red-50/50",
  },
  {
    status: "missing",
    title: "Missing",
    description: "No expiry date on record",
    accent: "border-slate-200 bg-slate-50/50",
  },
];

type Props = {
  counts: Record<ComplianceStatus, number>;
  activeStatus?: string;
};

export function ComplianceSummaryCards({ counts, activeStatus }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const href = `/manage/compliance?status=${card.status}`;
        const active = activeStatus === card.status;
        return (
          <Link key={card.status} href={href}>
            <Card className={cn("transition-shadow hover:shadow-sm", card.accent, active && "ring-2 ring-primary")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{counts[card.status] ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
