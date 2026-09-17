import Link from "next/link";

export function SectionHeading({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {href ? (
        <Link href={href} className="h360-quiet-link text-xs">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
