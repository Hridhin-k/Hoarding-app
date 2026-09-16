"use client";

import { useState } from "react";
import { updateBoardAction, retireBoardAction } from "@/lib/boards/actions";
import { LocationPicker } from "@/components/maps/location-picker";
import { LocationFields, type PlaceValue } from "@/components/location/location-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KERALA_STATE } from "@/lib/geo/kerala";
import { STRUCTURE_TYPE_LABELS, type BoardLifecycle, type OwnershipType, type StructureType } from "@/lib/types/enums";
import type { GeocodeResult } from "@/lib/maps/types";

export type BoardEditValues = {
  id: string;
  board_code: string;
  name: string;
  description: string | null;
  structure_type: StructureType;
  ownership_type: OwnershipType;
  lifecycle_status: BoardLifecycle;
  address: string | null;
  locality: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function BoardEditForm({ board, canRetire }: { board: BoardEditValues; canRetire: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [latitude, setLatitude] = useState(board.latitude != null ? String(board.latitude) : "");
  const [longitude, setLongitude] = useState(board.longitude != null ? String(board.longitude) : "");
  const [place, setPlace] = useState<PlaceValue>({
    state: board.state || KERALA_STATE,
    district: board.district ?? "",
    city: board.city ?? "",
    locality: board.locality ?? "",
    address: board.address ?? "",
    landmark: board.landmark ?? "",
    pincode: board.pincode ?? "",
  });

  function applyPlace(next: PlaceValue, meta?: { flyTo?: { lat: number; lng: number } }) {
    setPlace(next);
    if (meta?.flyTo) {
      setLatitude(String(meta.flyTo.lat));
      setLongitude(String(meta.flyTo.lng));
    }
  }

  function applyResolvedAddress(row: GeocodeResult) {
    setPlace((current) => ({
      ...current,
      state: current.state || row.state || KERALA_STATE,
      district: current.district || row.district || "",
      city: current.city || row.city || "",
      locality: current.locality || row.locality || "",
      pincode: current.pincode || row.pincode || "",
    }));
  }

  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        form.set("latitude", latitude);
        form.set("longitude", longitude);
        form.set("state", place.state);
        form.set("district", place.district);
        form.set("city", place.city.trim());
        form.set("locality", place.locality);
        form.set("address", place.address);
        form.set("landmark", place.landmark);
        form.set("pincode", place.pincode);
        setPending(true);
        setError(null);
        setMessage(null);
        const result = await updateBoardAction(board.id, form);
        setPending(false);
        if (result.error) setError(result.error);
        else setMessage("Board saved.");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="boardCode" label="Board code" defaultValue={board.board_code} required />
        <Field name="name" label="Name" defaultValue={board.name} required />
        <div className="space-y-1.5">
          <Label htmlFor="structureType">Structure type</Label>
          <select id="structureType" name="structureType" className="h-8 w-full rounded-lg border px-2 text-sm" defaultValue={board.structure_type}>
            {Object.entries(STRUCTURE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownershipType">Ownership</Label>
          <select id="ownershipType" name="ownershipType" className="h-8 w-full rounded-lg border px-2 text-sm" defaultValue={board.ownership_type}>
            <option value="owned">Owned</option>
            <option value="leased">Leased</option>
            <option value="managed">Managed</option>
            <option value="joint">Joint</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lifecycleStatus">Lifecycle</Label>
          <select
            id="lifecycleStatus"
            name="lifecycleStatus"
            className="h-8 w-full rounded-lg border px-2 text-sm"
            defaultValue={board.lifecycle_status}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="blocked">Blocked</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={board.description ?? ""} />
        </div>
      </div>

      <LocationFields names={false} value={place} onChange={applyPlace} />

      <LocationPicker
        latitude={latitude ? Number(latitude) : null}
        longitude={longitude ? Number(longitude) : null}
        onChange={({ lat, lng }) => {
          setLatitude(String(lat));
          setLongitude(String(lng));
        }}
        onResolvedAddress={applyResolvedAddress}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save board"}
        </Button>
        {canRetire && board.lifecycle_status !== "retired" ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await retireBoardAction(board.id);
              setPending(false);
              if (result.error) setError(result.error);
              else setMessage("Board retired.");
            }}
          >
            Retire board
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} />
    </div>
  );
}
