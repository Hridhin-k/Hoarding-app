import Link from "next/link";
import { BrandMark } from "@/components/brand/mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="h360-toolbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-sm">
            <BrandMark />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/market" className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Marketplace
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-3.25rem)] max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kerala first · India next</p>
          <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            The operating system for outdoor advertising inventory.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
            Boards are structures. Faces are what you sell. Occupancy, compliance, marketplace enquiries, and field
            proof stay independent — and visible.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/signup" className={cn(buttonVariants())}>
              Create organization
            </Link>
            <Link href="/market" className={cn(buttonVariants({ variant: "outline" }))}>
              Browse inventory
            </Link>
          </div>
        </div>
        <dl className="grid gap-px overflow-hidden rounded-md border bg-border">
          {[
            ["Board ≠ Face", "Each face has its own size, rate, occupancy, and advertiser."],
            ["Three statuses", "Lifecycle, compliance, and occupancy never collapse into one badge."],
            ["Vacancy loop", "Becoming vacant is detected, notified, and listable."],
            ["Field proof", "Photo, GPS, time, and technician before a job is complete."],
          ].map(([title, copy]) => (
            <div key={title} className="bg-card px-4 py-3">
              <dt className="text-sm font-medium">{title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{copy}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
