import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; checkEmail?: string; error?: string }>;
}) {
  const { next, checkEmail, error } = await searchParams;
  return (
    <div className="w-full max-w-sm rounded-md border bg-card p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
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
