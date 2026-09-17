"use client";

import { useState } from "react";
import { createFieldJobAction } from "@/lib/field/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateJobForm({
  boards,
  techs,
}: {
  boards: Array<{ id: string; name: string; board_code: string }>;
  techs: Array<{ id: string; name: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await createFieldJobAction(new FormData(event.currentTarget));
        if (result.error) setError(result.error);
        else event.currentTarget.reset();
      }}
    >
      <Input name="title" placeholder="Job title" required />
      <select name="boardId" required className="h360-select">
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.board_code} · {b.name}
          </option>
        ))}
      </select>
      <select name="jobType" className="h360-select" defaultValue="proof_capture">
        <option value="installation">Installation</option>
        <option value="removal">Removal</option>
        <option value="inspection">Inspection</option>
        <option value="maintenance">Maintenance</option>
        <option value="proof_capture">Proof of display</option>
      </select>
      <select name="assignedTo" className="h360-select">
        <option value="">Unassigned</option>
        {techs.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Input name="scheduledAt" type="datetime-local" />
      <Button type="submit">Assign job</Button>
      {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
