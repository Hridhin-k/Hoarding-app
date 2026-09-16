import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-12">
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={cn(buttonVariants())}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
