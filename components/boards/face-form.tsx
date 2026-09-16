"use client";

import { useState } from "react";
import { archiveFaceAction, restoreFaceAction, upsertFaceAction } from "@/lib/boards/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IlluminationType } from "@/lib/types/enums";

export type FaceFormValues = {
  id?: string;
  face_label: string;
  direction: string | null;
  width: number;
  height: number;
  illumination: IlluminationType;
  card_rate: number | null;
  floor_rate: number | null;
  publishable: boolean;
  marketplace_visible: boolean;
  archived_at?: string | null;
};

export function FaceForm({
  boardId,
  face,
  canEdit,
  canArchive,
}: {
  boardId: string;
  face?: FaceFormValues;
  canEdit: boolean;
  canArchive: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const editing = Boolean(face?.id);
  const archived = Boolean(face?.archived_at);

  if (!canEdit && !editing) return null;

  return (
    <form
      className="grid gap-3 rounded-md border p-4 sm:grid-cols-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canEdit) return;
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        setMessage(null);
        const result = await upsertFaceAction(boardId, {
          id: face?.id,
          faceLabel: form.get("faceLabel"),
          direction: form.get("direction"),
          width: Number(form.get("width")),
          height: Number(form.get("height")),
          unit: "ft",
          illumination: form.get("illumination"),
          cardRate: form.get("cardRate") ? Number(form.get("cardRate")) : null,
          floorRate: form.get("floorRate") ? Number(form.get("floorRate")) : null,
          publishable: form.get("publishable") === "on",
          marketplaceVisible: form.get("marketplaceVisible") === "on",
        });
        setPending(false);
        if (result.error) setError(result.error);
        else {
          setMessage(editing ? "Face updated." : "Face added.");
          if (!editing) event.currentTarget.reset();
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`faceLabel-${face?.id ?? "new"}`}>Face label</Label>
        <Input
          id={`faceLabel-${face?.id ?? "new"}`}
          name="faceLabel"
          defaultValue={face?.face_label ?? ""}
          placeholder="Face B"
          required
          disabled={!canEdit || archived}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`direction-${face?.id ?? "new"}`}>Direction</Label>
        <Input
          id={`direction-${face?.id ?? "new"}`}
          name="direction"
          defaultValue={face?.direction ?? ""}
          placeholder="South"
          disabled={!canEdit || archived}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`width-${face?.id ?? "new"}`}>Width (ft)</Label>
        <Input
          id={`width-${face?.id ?? "new"}`}
          name="width"
          type="number"
          step="0.1"
          defaultValue={face?.width ?? ""}
          required
          disabled={!canEdit || archived}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`height-${face?.id ?? "new"}`}>Height (ft)</Label>
        <Input
          id={`height-${face?.id ?? "new"}`}
          name="height"
          type="number"
          step="0.1"
          defaultValue={face?.height ?? ""}
          required
          disabled={!canEdit || archived}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`illumination-${face?.id ?? "new"}`}>Illumination</Label>
        <select
          id={`illumination-${face?.id ?? "new"}`}
          name="illumination"
          className="h360-select w-full"
          defaultValue={face?.illumination ?? "front_lit"}
          disabled={!canEdit || archived}
        >
          <option value="none">None</option>
          <option value="front_lit">Front-lit</option>
          <option value="back_lit">Back-lit</option>
          <option value="led">LED</option>
          <option value="digital">Digital</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`cardRate-${face?.id ?? "new"}`}>Card rate</Label>
        <Input
          id={`cardRate-${face?.id ?? "new"}`}
          name="cardRate"
          type="number"
          defaultValue={face?.card_rate ?? ""}
          disabled={!canEdit || archived}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`floorRate-${face?.id ?? "new"}`}>Floor rate</Label>
        <Input
          id={`floorRate-${face?.id ?? "new"}`}
          name="floorRate"
          type="number"
          defaultValue={face?.floor_rate ?? ""}
          disabled={!canEdit || archived}
        />
      </div>
      {editing ? (
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="publishable" defaultChecked={face?.publishable} disabled={!canEdit || archived} />
            Publishable
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="marketplaceVisible"
              defaultChecked={face?.marketplace_visible}
              disabled={!canEdit || archived}
            />
            Marketplace visible
          </label>
        </div>
      ) : (
        <input type="hidden" name="publishable" value="off" />
      )}

      <div className="flex flex-wrap items-end gap-2 sm:col-span-4">
        {canEdit && !archived ? (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save face" : "Add face"}
          </Button>
        ) : null}
        {canArchive && face?.id && !archived ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await archiveFaceAction(face.id!);
              setPending(false);
              if (result.error) setError(result.error);
              else setMessage("Face archived.");
            }}
          >
            Archive face
          </Button>
        ) : null}
        {canArchive && face?.id && archived ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await restoreFaceAction(face.id!);
              setPending(false);
              if (result.error) setError(result.error);
              else setMessage("Face restored.");
            }}
          >
            Restore face
          </Button>
        ) : null}
      </div>
      {error ? <p className="sm:col-span-4 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="sm:col-span-4 text-sm text-muted-foreground">{message}</p> : null}
      {archived ? <p className="sm:col-span-4 text-sm text-muted-foreground">This face is archived and hidden from selling workflows.</p> : null}
    </form>
  );
}
