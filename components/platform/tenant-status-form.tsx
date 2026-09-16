"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTenantStatusAction } from "@/lib/platform/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TenantStatusForm({
  tenantId,
  status,
}: {
  tenantId: string;
  status: "active" | "suspended" | "pending";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nextStatus = status === "suspended" ? "active" : "suspended";

  return (
    <form
      className="space-y-3 rounded-md border bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        setMessage(null);
        const result = await setTenantStatusAction(tenantId, new FormData(event.currentTarget));
        setPending(false);
        if (result.error) setError(result.error);
        else {
          setMessage(nextStatus === "suspended" ? "Tenant suspended. Listings are hidden." : "Tenant reactivated.");
          router.refresh();
        }
      }}
    >
      <input type="hidden" name="status" value={nextStatus} />
      <p className="text-sm text-muted-foreground">
        {status === "suspended"
          ? "Reactivate this tenant to restore marketplace eligibility."
          : "Suspend to hide every listing from the public marketplace. The owner can still sign in to Manage."}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="status-reason">Reason</Label>
        <Textarea id="status-reason" name="reason" required minLength={8} placeholder="Duplicate inventory claim" />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" variant={nextStatus === "suspended" ? "destructive" : "default"} disabled={pending}>
        {pending ? "Saving…" : nextStatus === "suspended" ? "Suspend tenant" : "Reactivate tenant"}
      </Button>
    </form>
  );
}
