"use client";

import { useState } from "react";
import { createComplianceAction } from "@/lib/compliance/actions";
import { CLEARANCE_TYPES } from "@/lib/constants";
import { CLEARANCE_TYPE_LABELS } from "@/lib/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  boards: Array<{ id: string; board_code: string; name: string }>;
};

export function CreateComplianceForm({ boards }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [boardId, setBoardId] = useState(boards[0]?.id ?? "");
  const [clearanceType, setClearanceType] = useState<string>(CLEARANCE_TYPES[0]);
  const [isMandatory, setIsMandatory] = useState(true);

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        if (!boardId) {
          setError("Choose a board.");
          return;
        }
        const formData = new FormData(event.currentTarget);
        formData.set("clearanceType", clearanceType);
        formData.set("isMandatory", isMandatory ? "true" : "false");
        const result = await createComplianceAction(boardId, formData);
        if (result.error) setError(result.error);
        else event.currentTarget.reset();
      }}
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="boardId">Board</Label>
        <Select value={boardId} onValueChange={(v) => v && setBoardId(v)}>
          <SelectTrigger id="boardId">
            <SelectValue placeholder="Select board" />
          </SelectTrigger>
          <SelectContent>
            {boards.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.board_code} · {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="clearanceType">Clearance type</Label>
        <Select value={clearanceType} onValueChange={(v) => v && setClearanceType(v)}>
          <SelectTrigger id="clearanceType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLEARANCE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {CLEARANCE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="authority">Authority</Label>
        <Input id="authority" name="authority" placeholder="Issuing authority" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Reference number</Label>
        <Input id="referenceNumber" name="referenceNumber" placeholder="Permit / license no." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="issueDate">Issue date</Label>
        <Input id="issueDate" name="issueDate" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry date</Label>
        <Input id="expiryDate" name="expiryDate" type="date" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="renewalCycle">Renewal cycle</Label>
        <Input id="renewalCycle" name="renewalCycle" placeholder="e.g. Annual" />
      </div>
      <div className="flex items-center gap-3 pt-6">
        <Switch id="isMandatory" checked={isMandatory} onCheckedChange={setIsMandatory} />
        <Label htmlFor="isMandatory">Mandatory for marketplace</Label>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="file">Permit document</Label>
        <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx" />
        <p className="text-xs text-muted-foreground">PDF, image, or Word · max 20 MB · stored privately.</p>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <Button type="submit">Add clearance</Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}
