"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBoardAction, upsertFaceAction } from "@/lib/boards/actions";
import { LocationPicker } from "@/components/maps/location-picker";
import { LocationFields, type PlaceValue } from "@/components/location/location-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KERALA_STATE } from "@/lib/geo/kerala";
import { STRUCTURE_TYPE_LABELS } from "@/lib/types/enums";
import { boardBasicsSchema, boardLocationSchema, faceSchema } from "@/lib/validation/schemas";
import type { GeocodeResult } from "@/lib/maps/types";

const STEPS = ["Basic information", "Location", "Faces", "Review"] as const;

type WizardFace = {
  faceLabel: string;
  direction: string;
  width: string;
  height: string;
  illumination: string;
  cardRate: string;
  floorRate: string;
};

const emptyFace = (): WizardFace => ({
  faceLabel: "Face A",
  direction: "North",
  width: "12",
  height: "8",
  illumination: "front_lit",
  cardRate: "",
  floorRate: "",
});

export function BoardWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [form, setForm] = useState({
    boardCode: "",
    name: "",
    description: "",
    structureType: "hoarding",
    ownershipType: "owned",
    city: "",
    state: KERALA_STATE,
    locality: "",
    address: "",
    district: "",
    pincode: "",
    landmark: "",
    latitude: "",
    longitude: "",
  });
  const [faces, setFaces] = useState<WizardFace[]>([emptyFace()]);

  const lat = form.latitude ? Number(form.latitude) : null;
  const lng = form.longitude ? Number(form.longitude) : null;

  const review = useMemo(
    () => ({
      board: `${form.boardCode || "—"} · ${form.name || "Untitled"}`,
      place: [form.locality, form.city, form.state].filter(Boolean).join(", ") || "No address yet",
      coords: lat != null && lng != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "No map pin",
      faces: faces.map((face) => `${face.faceLabel} · ${face.width}×${face.height} ft`).join("; "),
    }),
    [faces, form, lat, lng],
  );

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setPlace(next: PlaceValue, meta?: { flyTo?: { lat: number; lng: number }; zoom?: number }) {
    setForm((current) => ({
      ...current,
      ...next,
      ...(meta?.flyTo
        ? { latitude: String(meta.flyTo.lat), longitude: String(meta.flyTo.lng) }
        : {}),
    }));
  }

  function applyResolvedAddress(row: GeocodeResult) {
    setForm((current) => ({
      ...current,
      state: current.state || row.state || KERALA_STATE,
      district: current.district || row.district || "",
      city: current.city || row.city || "",
      locality: current.locality || row.locality || "",
      pincode: current.pincode || row.pincode || "",
    }));
  }

  function updateFace(index: number, patch: Partial<WizardFace>) {
    setFaces((current) => current.map((face, i) => (i === index ? { ...face, ...patch } : face)));
  }

  function validateBasics() {
    const parsed = boardBasicsSchema.safeParse({
      boardCode: form.boardCode,
      name: form.name,
      description: form.description,
      structureType: form.structureType,
      ownershipType: form.ownershipType,
      lifecycleStatus: "draft",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the basic details.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateLocation() {
    const parsed = boardLocationSchema.safeParse({
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
      address: form.address,
      locality: form.locality,
      city: form.city,
      district: form.district,
      state: form.state,
      pincode: form.pincode,
      landmark: form.landmark,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the location details.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateFaces() {
    for (const face of faces) {
      const parsed = faceSchema.safeParse({
        faceLabel: face.faceLabel,
        direction: face.direction,
        width: face.width,
        height: face.height,
        unit: "ft",
        illumination: face.illumination,
        cardRate: face.cardRate || null,
        floorRate: face.floorRate || null,
        publishable: false,
        marketplaceVisible: false,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Check face details.");
        return false;
      }
    }
    setError(null);
    return true;
  }

  async function saveBoardAndFaces() {
    if (!validateBasics() || !validateLocation() || !validateFaces()) return;
    setPending(true);
    setError(null);

    const data = new FormData();
    data.set("boardCode", form.boardCode);
    data.set("name", form.name);
    data.set("description", form.description);
    data.set("structureType", form.structureType);
    data.set("ownershipType", form.ownershipType);
    data.set("lifecycleStatus", "draft");
    data.set("city", form.city);
    data.set("state", form.state);
    data.set("locality", form.locality);
    data.set("address", form.address);
    data.set("district", form.district);
    data.set("pincode", form.pincode);
    data.set("landmark", form.landmark);
    if (form.latitude) data.set("latitude", form.latitude);
    if (form.longitude) data.set("longitude", form.longitude);

    const created = await createBoardAction(data);
    if ("error" in created && created.error) {
      setPending(false);
      setError(created.error);
      return;
    }
    const id = "id" in created ? created.id : null;
    if (!id) {
      setPending(false);
      setError("Board was created without an id.");
      return;
    }
    setBoardId(id);

    for (const face of faces) {
      const result = await upsertFaceAction(id, {
        faceLabel: face.faceLabel,
        direction: face.direction,
        width: Number(face.width),
        height: Number(face.height),
        unit: "ft",
        illumination: face.illumination,
        cardRate: face.cardRate ? Number(face.cardRate) : null,
        floorRate: face.floorRate ? Number(face.floorRate) : null,
        publishable: false,
        marketplaceVisible: false,
      });
      if (result.error) {
        setPending(false);
        setError(result.error);
        setStep(3);
        router.push(`/manage/boards/${id}`);
        return;
      }
    }

    setPending(false);
    setStep(3);
  }

  return (
    <div className="space-y-6 rounded-md border bg-card p-5">
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={
              index === step
                ? "rounded-md bg-foreground px-2.5 py-1 text-background"
                : index < step
                  ? "rounded-md bg-muted px-2.5 py-1 text-foreground"
                  : "rounded-md bg-muted px-2.5 py-1 text-muted-foreground"
            }
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Board code" value={form.boardCode} onChange={(v) => setField("boardCode", v)} placeholder="H360-HZN-020" />
          <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
          <div className="space-y-1.5">
            <Label htmlFor="structureType">Structure type</Label>
            <select
              id="structureType"
              className="h360-select w-full"
              value={form.structureType}
              onChange={(e) => setField("structureType", e.target.value)}
            >
              {Object.entries(STRUCTURE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownershipType">Ownership</Label>
            <select
              id="ownershipType"
              className="h360-select w-full"
              value={form.ownershipType}
              onChange={(e) => setField("ownershipType", e.target.value)}
            >
              <option value="owned">Owned</option>
              <option value="leased">Leased</option>
              <option value="managed">Managed</option>
              <option value="joint">Joint</option>
            </select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <LocationFields
            names={false}
            value={{
              state: form.state,
              district: form.district,
              city: form.city,
              locality: form.locality,
              address: form.address,
              landmark: form.landmark,
              pincode: form.pincode,
            }}
            onChange={setPlace}
          />
          <LocationPicker
            latitude={lat}
            longitude={lng}
            onChange={({ lat: nextLat, lng: nextLng }) => {
              setField("latitude", String(nextLat));
              setField("longitude", String(nextLng));
            }}
            onResolvedAddress={applyResolvedAddress}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude" value={form.latitude} onChange={(v) => setField("latitude", v)} />
            <Field label="Longitude" value={form.longitude} onChange={(v) => setField("longitude", v)} />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          {faces.map((face, index) => (
            <div key={index} className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Face {index + 1}</h3>
                {faces.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFaces((current) => current.filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <Field label="Face label" value={face.faceLabel} onChange={(v) => updateFace(index, { faceLabel: v })} />
              <Field label="Direction" value={face.direction} onChange={(v) => updateFace(index, { direction: v })} />
              <Field label="Width (ft)" value={face.width} onChange={(v) => updateFace(index, { width: v })} />
              <Field label="Height (ft)" value={face.height} onChange={(v) => updateFace(index, { height: v })} />
              <Field label="Card rate / month" value={face.cardRate} onChange={(v) => updateFace(index, { cardRate: v })} />
              <Field label="Floor rate / month" value={face.floorRate} onChange={(v) => updateFace(index, { floorRate: v })} />
              <div className="space-y-1.5">
                <Label>Illumination</Label>
                <select
                  className="h360-select w-full"
                  value={face.illumination}
                  onChange={(e) => updateFace(index, { illumination: e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="front_lit">Front-lit</option>
                  <option value="back_lit">Back-lit</option>
                  <option value="led">LED</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setFaces((current) => [
                ...current,
                { ...emptyFace(), faceLabel: `Face ${String.fromCharCode(65 + current.length)}` },
              ])
            }
          >
            Add another face
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Board:</span> {review.board}
          </p>
          <p>
            <span className="text-muted-foreground">Location:</span> {review.place}
          </p>
          <p>
            <span className="text-muted-foreground">Coordinates:</span> {review.coords}
          </p>
          <p>
            <span className="text-muted-foreground">Faces:</span> {review.faces}
          </p>
          <p className="text-muted-foreground">Lifecycle starts as draft. Activate after you confirm location and inventory.</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {step > 0 && step < 3 ? (
          <Button variant="outline" type="button" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
        {step === 0 ? (
          <Button
            type="button"
            onClick={() => {
              if (validateBasics()) setStep(1);
            }}
          >
            Continue
          </Button>
        ) : null}
        {step === 1 ? (
          <Button
            type="button"
            onClick={() => {
              if (validateLocation()) setStep(2);
            }}
          >
            Continue
          </Button>
        ) : null}
        {step === 2 ? (
          <Button type="button" disabled={pending} onClick={saveBoardAndFaces}>
            {pending ? "Saving…" : "Save and review"}
          </Button>
        ) : null}
        {step === 3 && boardId ? (
          <Button type="button" onClick={() => router.push(`/manage/boards/${boardId}`)}>
            Open board
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
