import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; checkEmail?: string; error?: string }>;
}) {
  const { next, checkEmail, error } = await searchParams;
  return (
    <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          <span className="text-primary">HOARDINGS</span>360
        </div>
        <h1 className="mt-2 text-xl font-semibold">
          {next?.startsWith("/platform") ? "Sign in to platform operations" : "Sign in"}
        </h1>
        {checkEmail ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Check your email to confirm the account, then sign in.
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-destructive">Could not complete sign-in. Please try again.</p> : null}
      </div>
      <LoginForm next={next} />
    </div>
  );
}
