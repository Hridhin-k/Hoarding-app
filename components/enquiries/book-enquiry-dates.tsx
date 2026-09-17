"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOccupancyAction } from "@/lib/occupancy/actions";
import { occupancyStateForRequestedDates } from "@/lib/occupancy/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BookEnquiryDates({
  enquiryId,
  faceId,
  faceLabel,
  startDate,
  endDate,
  customerId,
  notes,
}: {
  enquiryId: string;
  faceId: string;
  faceLabel: string;
  startDate: string | null;
  endDate: string | null;
  customerId: string | null;
  notes: string | null;
}) {
  const router = useRouter();
  const suggested = startDate ? occupancyStateForRequestedDates(startDate) : "occupied";
  const [start, setStart] = useState(startDate ?? "");
  const [end, setEnd] = useState(endDate ?? "");
  const [state, setState] = useState<"occupied" | "booked_future">(suggested);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedId, setBookedId] = useState<string | null>(null);

  const occupancyHref = `/manage/occupancy?face=${encodeURIComponent(faceId)}${
    start ? `&start=${encodeURIComponent(start)}` : ""
  }${end ? `&end=${encodeURIComponent(end)}` : ""}${
    customerId ? `&customer=${encodeURIComponent(customerId)}` : ""
  }`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await createOccupancyAction({
        faceId,
        startDate: start,
        endDate: end,
        state,
        source: "enquiry",
        customerId: customerId || null,
        notes: notes?.trim() || `Booked from enquiry ${enquiryId}`,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.id) setBookedId(result.id);
      router.refresh();
    } catch {
      setError("Could not book these dates. Sign out and sign in again, then retry.");
    } finally {
      setPending(false);
    }
  }

  if (bookedId) {
    return (
      <div className="h360-panel space-y-2 px-4 py-4">
        <h2 className="text-sm font-medium">Dates booked on {faceLabel}</h2>
        <p className="text-sm text-muted-foreground">
          Occupancy is recorded on the face, not the board. Open Availability to see the calendar.
        </p>
        <Link href="/manage/occupancy" className="h360-quiet-link text-sm">
          Open availability
        </Link>
      </div>
    );
  }

  return (
    <form className="h360-panel space-y-4 px-4 py-4" onSubmit={submit}>
      <div>
        <h2 className="text-sm font-medium">Book dates on {faceLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates occupancy on this face. Overlapping occupied or reserved dates are blocked.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-start">Start</Label>
          <Input
            id="enquiry-start"
            type="date"
            required
            value={start}
            onChange={(event) => {
              const next = event.target.value;
              setStart(next);
              if (next) setState(occupancyStateForRequestedDates(next));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-end">End</Label>
          <Input
            id="enquiry-end"
            type="date"
            required
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="enquiry-state">Type</Label>
          <select
            id="enquiry-state"
            className="h360-select w-full"
            value={state}
            onChange={(event) => setState(event.target.value as "occupied" | "booked_future")}
          >
            <option value="occupied">Occupied now</option>
            <option value="booked_future">Future booking</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Booking…" : "Book dates"}
        </Button>
        <Link href={occupancyHref} className="h360-quiet-link text-sm">
          Open on Availability
        </Link>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
