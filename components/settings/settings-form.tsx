"use client";

import { useState } from "react";
import { updateSettingsAction } from "@/lib/team/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ days }: { days: number }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="max-w-sm space-y-3 rounded-xl border bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await updateSettingsAction(new FormData(event.currentTarget));
        setMessage(result.error ?? "Saved.");
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="vacancyPrelistingDays">Vacancy pre-listing window (days)</Label>
        <Input id="vacancyPrelistingDays" name="vacancyPrelistingDays" type="number" min={1} max={365} defaultValue={days} />
        <p className="text-xs text-muted-foreground">
          Sales is notified when occupancy will end inside this window.
        </p>
      </div>
      <Button type="submit">Save</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
