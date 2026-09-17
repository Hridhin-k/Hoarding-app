import { cn } from "@/lib/utils";

export function PropertyList({
  items,
  className,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-sm text-foreground">{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
