import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="h360-toolbar">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-sm font-medium">
            <span className="text-primary">HOARDINGS</span>360
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/market"
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Marketplace
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-6xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium text-primary">Outdoor advertising OS for Kerala — expanding across India</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          Boards, faces, occupancy, and field proof in one place.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Run inventory and compliance, fill upcoming vacancies, and list published faces on a public marketplace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}>
            Create organization
          </Link>
          <Link href="/market" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-6")}>
            Browse inventory
          </Link>
        </div>
      </main>
    </div>
  );
}
