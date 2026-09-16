"use client";

import { useId, useState } from "react";
import { submitPublicEnquiryAction } from "@/lib/enquiries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EnquiryForm({ faceId, faceLabel }: { faceId: string; faceLabel: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formId = useId();

  if (done) {
    return (
      <div className="mt-4 rounded-md border border-success/25 bg-success/10 p-4 text-sm text-success" role="status">
        <p className="font-medium">Enquiry sent</p>
        <p className="mt-1 text-foreground">
          Thanks. The media owner has received your request for {faceLabel} and will contact you on the email and phone
          you provided.
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
      <p className="sm:col-span-2 text-sm text-muted-foreground">
        Request {faceLabel}. Your details go to the media owner for this site — not a public listing.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input id={`${formId}-name`} name="name" autoComplete="name" required placeholder="Your name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-company`}>Company</Label>
        <Input id={`${formId}-company`} name="companyName" autoComplete="organization" placeholder="Brand or agency" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-email`}>Email</Label>
        <Input id={`${formId}-email`} name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-phone`}>Phone</Label>
        <Input id={`${formId}-phone`} name="phone" type="tel" autoComplete="tel" required placeholder="10-digit mobile" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-start`}>Campaign start</Label>
        <Input id={`${formId}-start`} name="requestedStartDate" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-end`}>Campaign end</Label>
        <Input id={`${formId}-end`} name="requestedEndDate" type="date" />
      </div>
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor={`${formId}-message`}>Message</Label>
        <Textarea
          id={`${formId}-message`}
          name="message"
          placeholder="Campaign, duration, or creative notes"
          rows={3}
        />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error ? (
        <p className="sm:col-span-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending ? "Sending…" : `Enquire about ${faceLabel}`}
      </Button>
    </form>
  );
}
