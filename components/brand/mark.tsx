import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-baseline font-medium tracking-tight", className)}>
      {compact ? "H360" : (
        <>
          HOARDINGS<span className="text-primary">360</span>
        </>
      )}
    </span>
  );
}
