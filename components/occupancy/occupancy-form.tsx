"use client";

import { useState } from "react";
import {
  blockDatesAction,
  createHoldAction,
  createOccupancyAction,
} from "@/lib/occupancy/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "occupied" | "hold" | "block" | "booked_future";

export function OccupancyForm({
  faces,
}: {
  faces: Array<{ id: string; label: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<Mode>("occupied");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      faceId: form.get("faceId"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      state: mode === "hold" ? "on_hold" : mode === "block" ? "blocked" : mode,
      notes: form.get("notes"),
    };
    setPending(true);
    setError(null);
    const result =
      mode === "hold"
        ? await createHoldAction(payload)
        : mode === "block"
          ? await blockDatesAction(payload)
          : await createOccupancyAction(payload);
    setPending(false);
    if (result.error) setError(result.error);
    else event.currentTarget.reset();
  }

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="gap-3">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="occupied">Occupancy</TabsTrigger>
        <TabsTrigger value="booked_future">Future booking</TabsTrigger>
        <TabsTrigger value="hold">Hold</TabsTrigger>
        <TabsTrigger value="block">Block dates</TabsTrigger>
      </TabsList>
      <form className="grid gap-4 rounded-md border bg-card p-4 sm:grid-cols-3" onSubmit={submit}>
        <TabsContent value={mode} className="contents">
          <div className="space-y-1.5 sm:col-span-3">
            <p className="text-sm text-muted-foreground">
              {mode === "occupied"
                ? "Mark the face as occupied for the selected dates."
                : mode === "booked_future"
                  ? "Reserve future dates without marking the face occupied today."
                  : mode === "hold"
                    ? "Place a temporary hold for sales follow-up."
                    : "Block installation or maintenance without a booking."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Board / face</Label>
            <select name="faceId" required className="h360-select w-full">
              {faces.map((face) => (
                <option key={face.id} value={face.id}>
                  {face.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input name="startDate" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input name="endDate" type="date" required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Input name="notes" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : mode === "hold"
                  ? "Create hold"
                  : mode === "block"
                    ? "Block dates"
                    : mode === "booked_future"
                      ? "Create booking"
                      : "Create occupancy"}
            </Button>
          </div>
          {error ? <p className="sm:col-span-3 text-sm text-destructive">{error}</p> : null}
        </TabsContent>
      </form>
    </Tabs>
  );
}
