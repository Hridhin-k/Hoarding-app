import { cn } from "@/lib/utils";

export function DisclosurePanel({
  title,
  children,
  defaultOpen = false,
  nested = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  nested?: boolean;
}) {
  return (
    <details className={cn("group", nested ? "rounded-md border border-border" : "h360-panel")} {...(defaultOpen ? { open: true } : {})}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-xs font-normal text-muted-foreground group-open:hidden">Show</span>
        <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Hide</span>
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
