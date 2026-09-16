"use client";

import { useState } from "react";
import { cancelOccupancyAction, updateOccupancyAction } from "@/lib/occupancy/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OccupancyState } from "@/lib/types/enums";

type Period = {
  id: string;
  start_date: string;
  end_date: string;
  state: OccupancyState;
  notes: string | null;
};

export function OccupancyPeriodActions({ period, faceId }: { period: Period; faceId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
          Edit
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit occupancy</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              setError(null);
              const form = new FormData(event.currentTarget);
              const result = await updateOccupancyAction({
                id: period.id,
                faceId: form.get("faceId"),
                startDate: form.get("startDate"),
                endDate: form.get("endDate"),
                state: form.get("state"),
                notes: form.get("notes"),
              });
              setPending(false);
              if (result.error) setError(result.error);
              else setOpen(false);
            }}
          >
            <input type="hidden" name="faceId" value={faceId} />
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input name="startDate" type="date" required defaultValue={period.start_date} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input name="endDate" type="date" required defaultValue={period.end_date} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <select name="state" defaultValue={period.state} className="h360-select w-full">
                <option value="occupied">Occupied</option>
                <option value="on_hold">Hold</option>
                <option value="booked_future">Booked future</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input name="notes" defaultValue={period.notes ?? ""} />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await cancelOccupancyAction(period.id);
          setPending(false);
          if (result.error) setError(result.error);
        }}
      >
        Cancel
      </Button>
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
