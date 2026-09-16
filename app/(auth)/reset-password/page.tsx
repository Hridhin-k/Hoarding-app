import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getUser } from "@/lib/auth/session";

export default async function ResetPasswordPage() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Link expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password" className="underline">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          <span className="text-primary">HOARDINGS</span>360
        </div>
        <h1 className="mt-2 text-xl font-semibold">Choose a new password</h1>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
