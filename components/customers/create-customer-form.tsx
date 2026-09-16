"use client";

import { useState } from "react";
import { createCustomerAction } from "@/lib/enquiries/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateCustomerForm() {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-2 rounded-md border bg-card p-4 sm:grid-cols-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await createCustomerAction(new FormData(event.currentTarget));
        if (result.error) setError(result.error);
        else {
          setError(null);
          event.currentTarget.reset();
        }
      }}
    >
      <Input name="name" placeholder="Contact name" required />
      <Input name="companyName" placeholder="Company" />
      <select name="type" className="h360-select" defaultValue="advertiser">
        <option value="advertiser">Advertiser</option>
        <option value="agency">Agency</option>
        <option value="other">Other</option>
      </select>
      <Input name="email" placeholder="Email" type="email" />
      <Input name="phone" placeholder="Phone" />
      <Input name="notes" placeholder="Notes" />
      <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
        <Button type="submit">Add customer</Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}
