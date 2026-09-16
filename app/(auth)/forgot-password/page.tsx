import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm rounded-md border bg-card p-6">
      <div className="mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          <span className="text-primary">HOARDINGS</span>360
        </div>
        <h1 className="mt-2 text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">We will email a link if the account exists.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
