"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function requestReset(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  return requestPasswordResetAction(formData);
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestReset, null);
  if (state?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        If an account exists for that email, a reset link is on the way. Check your inbox and spam folder.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
