"use client";

import { useState } from "react";
import { inviteMemberAction } from "@/lib/team/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteForm() {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await inviteMemberAction(new FormData(event.currentTarget));
        if (result.error) setError(result.error);
        else event.currentTarget.reset();
      }}
    >
      <Input name="email" type="email" placeholder="work@company.com" required className="max-w-xs" />
      <select name="role" className="h-8 rounded-lg border px-2 text-sm" defaultValue="SALES">
        <option value="ADMIN">Admin</option>
        <option value="OPS_MANAGER">Operations</option>
        <option value="SALES">Sales</option>
        <option value="COMPLIANCE">Compliance</option>
        <option value="TECHNICIAN">Technician</option>
      </select>
      <Button type="submit">Invite</Button>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
