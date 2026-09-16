"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function updatePassword(_prev: { error?: string } | null, formData: FormData) {
  return updatePasswordAction(formData);
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
