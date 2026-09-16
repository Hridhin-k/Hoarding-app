"use client";

import { useState } from "react";
import { createCampaignAction } from "@/lib/enquiries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateCampaignForm({
  customers,
  faces,
}: {
  customers: Array<{ id: string; name: string }>;
  faces: Array<{ id: string; label: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await createCampaignAction(new FormData(event.currentTarget));
        if (result.error) setError(result.error);
        else {
          setError(null);
          event.currentTarget.reset();
        }
      }}
    >
      <Input name="name" placeholder="Campaign name" required />
      <select name="customerId" className="h-8 rounded-lg border px-2 text-sm">
        <option value="">No customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Input name="startDate" type="date" />
      <Input name="endDate" type="date" />
      <select name="status" className="h-8 rounded-lg border px-2 text-sm" defaultValue="draft">
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <div className="sm:col-span-2 space-y-1.5">
        <p className="text-sm text-muted-foreground">Faces (optional, multi-select)</p>
        <select name="faceIds" multiple className="min-h-28 w-full rounded-lg border px-2 py-2 text-sm">
          {faces.map((face) => (
            <option key={face.id} value={face.id}>
              {face.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
        <Button type="submit">Create campaign</Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}
