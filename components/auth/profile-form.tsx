"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function saveProfile(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  return updateProfileAction(formData);
}

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, action, pending] = useActionState(saveProfile, null);
  return (
    <form action={action} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required defaultValue={fullName} className="h-12 rounded-md" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={phone} className="h-12 rounded-md" />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-muted-foreground">Profile saved.</p> : null}
      <Button type="submit" disabled={pending} className="h-12 w-full rounded-2xl">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
