"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceFilters } from "@/components/location/place-filters";
import { KERALA_STATE } from "@/lib/geo/kerala";

async function createOrg(_prev: { error?: string } | null, formData: FormData) {
  return createOrganizationAction(formData);
}

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createOrg, null);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Organization name</Label>
        <Input id="name" name="name" placeholder="Horizon Outdoor Media" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="slug">URL slug</Label>
        <Input id="slug" name="slug" placeholder="horizon-outdoor" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Headquarters</Label>
          <input type="hidden" name="state" value={KERALA_STATE} />
          <div className="flex flex-wrap gap-2">
            <PlaceFilters districtAllLabel="Choose district" cityAllLabel="Choose city" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
