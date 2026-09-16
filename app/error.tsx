"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Please try again. If the problem continues, contact support."}
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Try again
      </button>
    </div>
  );
}
