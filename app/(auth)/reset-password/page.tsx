import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getUser } from "@/lib/auth/session";

export default async function ResetPasswordPage() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="h360-quiet-link text-foreground underline-offset-4 hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
