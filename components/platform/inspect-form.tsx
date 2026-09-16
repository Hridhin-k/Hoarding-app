"use client";

import { useActionState } from "react";
import { startInspectAction } from "@/lib/platform/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function InspectTenantForm({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const bound = startInspectAction.bind(null, tenantId);
  const [state, action, pending] = useActionState(bound, null);

  return (
    <form action={action} className="max-w-lg space-y-3 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Inspecting {tenantName} is time-boxed to 30 minutes and is written to the platform audit log. Give a
        support reason first.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" name="reason" required minLength={8} placeholder="Owner reported missing listings" />
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Starting…" : "Start inspect"}
      </Button>
    </form>
  );
}
