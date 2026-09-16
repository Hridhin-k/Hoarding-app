"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next || "/manage"} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-foreground underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
