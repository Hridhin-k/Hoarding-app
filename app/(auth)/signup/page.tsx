import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm rounded-md border bg-card p-6">
      <div className="mb-6">
        <div className="text-sm font-medium text-muted-foreground">
          <span className="text-primary">HOARDINGS</span>360
        </div>
        <h1 className="mt-2 text-xl font-semibold">Create your account</h1>
      </div>
      <SignupForm />
    </div>
  );
}
