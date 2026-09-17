import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  compact = false,
  className,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1.5",
        compact ? "px-0 py-1" : "rounded-md border border-border bg-card px-5 py-8",
        className,
      )}
    >
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={cn(buttonVariants({ size: "sm" }), "mt-1")}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
