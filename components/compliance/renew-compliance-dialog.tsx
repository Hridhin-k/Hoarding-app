"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateComplianceAction } from "@/lib/compliance/actions";
import { CLEARANCE_TYPES } from "@/lib/constants";
import { CLEARANCE_TYPE_LABELS, type ClearanceType } from "@/lib/types/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type RenewableCompliance = {
  id: string;
  boardLabel: string;
  clearanceType: ClearanceType;
  authority: string | null;
  referenceNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  renewalCycle: string | null;
  isMandatory: boolean;
  notes: string | null;
  status: string;
};

export function RenewComplianceDialog({ record }: { record: RenewableCompliance }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [clearanceType, setClearanceType] = useState<string>(record.clearanceType);
  const [isMandatory, setIsMandatory] = useState(record.isMandatory);

  const label = record.status === "expired" || record.status === "expiring" ? "Renew" : "Update";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setClearanceType(record.clearanceType);
          setIsMandatory(record.isMandatory);
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>{label}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {label} clearance · {record.boardLabel}
          </DialogTitle>
          <DialogDescription>
            Set the new expiry and attach the renewed permit. Status updates from the expiry date.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            setError(null);
            const formData = new FormData(event.currentTarget);
            formData.set("clearanceType", clearanceType);
            formData.set("isMandatory", isMandatory ? "true" : "false");
            try {
              const result = await updateComplianceAction(record.id, formData);
              if (result.error) {
                setError(result.error);
                setPending(false);
                return;
              }
              setOpen(false);
              router.refresh();
            } catch {
              setError("Could not save the renewal. Sign in again if your session expired.");
              setPending(false);
            }
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`clearance-${record.id}`}>Clearance type</Label>
            <select
              id={`clearance-${record.id}`}
              className="h360-select w-full"
              value={clearanceType}
              onChange={(event) => setClearanceType(event.target.value)}
            >
              {CLEARANCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CLEARANCE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`authority-${record.id}`}>Authority</Label>
            <Input
              id={`authority-${record.id}`}
              name="authority"
              defaultValue={record.authority ?? ""}
              placeholder="Issuing authority"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`ref-${record.id}`}>Reference number</Label>
            <Input
              id={`ref-${record.id}`}
              name="referenceNumber"
              defaultValue={record.referenceNumber ?? ""}
              placeholder="Permit / license no."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`issue-${record.id}`}>Issue date</Label>
            <Input
              id={`issue-${record.id}`}
              name="issueDate"
              type="date"
              defaultValue={record.issueDate ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`expiry-${record.id}`}>New expiry date</Label>
            <Input
              id={`expiry-${record.id}`}
              name="expiryDate"
              type="date"
              required
              defaultValue={record.expiryDate ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`cycle-${record.id}`}>Renewal cycle</Label>
            <Input
              id={`cycle-${record.id}`}
              name="renewalCycle"
              defaultValue={record.renewalCycle ?? ""}
              placeholder="e.g. Annual"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id={`mandatory-${record.id}`}
              checked={isMandatory}
              onCheckedChange={setIsMandatory}
            />
            <Label htmlFor={`mandatory-${record.id}`}>Mandatory for marketplace</Label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`file-${record.id}`}>Renewed permit document</Label>
            <Input
              id={`file-${record.id}`}
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
            />
            <p className="text-xs text-muted-foreground">Optional · PDF, image, or Word · max 20 MB.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`notes-${record.id}`}>Notes</Label>
            <Textarea id={`notes-${record.id}`} name="notes" rows={2} defaultValue={record.notes ?? ""} />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : `Save ${label.toLowerCase()}`}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
