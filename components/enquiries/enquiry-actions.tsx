"use client";

import { useState } from "react";
import {
  assignEnquiryAction,
  convertEnquiryToCustomerAction,
  updateEnquiryStatusAction,
} from "@/lib/enquiries/actions";
import { Button } from "@/components/ui/button";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/lib/types/enums";

const STATUSES: EnquiryStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost", "closed"];

type Member = { user_id: string; full_name: string | null; email: string | null };

export function EnquiryActions({
  enquiryId,
  status,
  assignedTo,
  members,
  customerId,
}: {
  enquiryId: string;
  status: EnquiryStatus;
  assignedTo: string | null;
  members: Member[];
  customerId: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-4">
      <label className="text-sm text-muted-foreground">
        Status
        <select
          className="h360-select ml-2"
          defaultValue={status}
          disabled={pending}
          onChange={async (event) => {
            setPending(true);
            setError(null);
            setMessage(null);
            const result = await updateEnquiryStatusAction(enquiryId, event.target.value as EnquiryStatus);
            setPending(false);
            if (result.error) setError(result.error);
            else setMessage("Status updated.");
          }}
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {ENQUIRY_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-muted-foreground">
        Assign
        <select
          className="h360-select ml-2"
          defaultValue={assignedTo ?? ""}
          disabled={pending}
          onChange={async (event) => {
            setPending(true);
            setError(null);
            setMessage(null);
            const value = event.target.value || null;
            const result = await assignEnquiryAction(enquiryId, value);
            setPending(false);
            if (result.error) setError(result.error);
            else setMessage(value ? "Assigned." : "Unassigned.");
          }}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.full_name || m.email || m.user_id}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="button"
        variant="outline"
        disabled={pending || Boolean(customerId)}
        onClick={async () => {
          setPending(true);
          setError(null);
          setMessage(null);
          const result = await convertEnquiryToCustomerAction(enquiryId);
          setPending(false);
          if (result.error) setError(result.error);
          else setMessage("Converted to customer.");
        }}
      >
        {customerId ? "Customer linked" : "Convert to customer"}
      </Button>
      {message ? <p className="w-full text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
