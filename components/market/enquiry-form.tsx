"use client";

import { useState } from "react";
import { submitPublicEnquiryAction } from "@/lib/enquiries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EnquiryForm({ faceId, faceLabel }: { faceId: string; faceLabel: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (done) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-medium">Enquiry sent</p>
        <p className="mt-1">
          Thanks. The media owner has received your request for {faceLabel} and will contact you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await submitPublicEnquiryAction(faceId, new FormData(event.currentTarget));
        setPending(false);
        if (result.error) setError(result.error);
        else setDone(true);
      }}
    >
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label>Company</Label>
        <Input name="companyName" />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input name="phone" required />
      </div>
      <div className="space-y-1.5">
        <Label>Start date</Label>
        <Input name="requestedStartDate" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label>End date</Label>
        <Input name="requestedEndDate" type="date" />
      </div>
      <div className="sm:col-span-2 space-y-1.5">
        <Label>Message</Label>
        <Textarea name="message" />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending ? "Sending…" : `Enquire about ${faceLabel}`}
      </Button>
    </form>
  );
}
