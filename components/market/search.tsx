import {
  ILLUMINATION_LABELS,
  STRUCTURE_TYPE_LABELS,
  type IlluminationType,
  type StructureType,
} from "@/lib/types/enums";
import type { MarketplaceSearchParams } from "@/lib/marketplace/public";
import { PlaceFilters } from "@/components/location/place-filters";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function MarketSearch({ values }: { values?: MarketplaceSearchParams }) {
  return (
    <form className="h360-panel space-y-3 p-4" method="get">
      <h1 className="text-lg font-semibold">Find outdoor inventory</h1>
      <p className="text-sm text-muted-foreground">Search published faces across Kerala. Pan-India coverage comes later.</p>
      <Field id="market-q" label="Search">
        <input
          id="market-q"
          name="q"
          defaultValue={values?.q ?? ""}
          placeholder="Locality or board"
          className="h-9 w-full rounded-lg border px-3 text-sm"
        />
      </Field>
      <Field id="market-city" label="District and city">
        <div className="flex flex-col gap-2">
          <PlaceFilters
            district={values?.district ?? ""}
            city={values?.city ?? ""}
            locality={values?.locality ?? ""}
            showLocality
            className="w-full"
          />
        </div>
      </Field>
      <Field id="market-type" label="Board type">
        <select
          id="market-type"
          name="type"
          className="h-9 w-full rounded-lg border px-3 text-sm"
          defaultValue={values?.type ?? ""}
        >
          <option value="">All board types</option>
          {(Object.keys(STRUCTURE_TYPE_LABELS) as StructureType[]).map((key) => (
            <option key={key} value={key}>
              {STRUCTURE_TYPE_LABELS[key]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="market-illumination" label="Illumination">
        <select
          id="market-illumination"
          name="illumination"
          className="h-9 w-full rounded-lg border px-3 text-sm"
          defaultValue={values?.illumination ?? ""}
        >
          <option value="">Any illumination</option>
          {(Object.keys(ILLUMINATION_LABELS) as IlluminationType[]).map((key) => (
            <option key={key} value={key}>
              {ILLUMINATION_LABELS[key]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="market-direction" label="Direction">
        <input
          id="market-direction"
          name="direction"
          defaultValue={values?.direction ?? ""}
          placeholder="e.g. North"
          className="h-9 w-full rounded-lg border px-3 text-sm"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field id="market-min-price" label="Min ₹">
          <input
            id="market-min-price"
            name="minPrice"
            type="number"
            min={0}
            defaultValue={values?.minPrice ?? ""}
            className="h-9 w-full rounded-lg border px-3 text-sm"
          />
        </Field>
        <Field id="market-max-price" label="Max ₹">
          <input
            id="market-max-price"
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={values?.maxPrice ?? ""}
            className="h-9 w-full rounded-lg border px-3 text-sm"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field id="market-min-width" label="Min width">
          <input
            id="market-min-width"
            name="minWidth"
            type="number"
            min={0}
            step="0.1"
            defaultValue={values?.minWidth ?? ""}
            className="h-9 w-full rounded-lg border px-3 text-sm"
          />
        </Field>
        <Field id="market-min-height" label="Min height">
          <input
            id="market-min-height"
            name="minHeight"
            type="number"
            min={0}
            step="0.1"
            defaultValue={values?.minHeight ?? ""}
            className="h-9 w-full rounded-lg border px-3 text-sm"
          />
        </Field>
      </div>
      <Field id="market-availability" label="Availability">
        <select
          id="market-availability"
          name="availability"
          className="h-9 w-full rounded-lg border px-3 text-sm"
          defaultValue={values?.availability ?? ""}
        >
          <option value="">Any availability</option>
          <option value="now">Available now</option>
          <option value="upcoming">Becoming vacant</option>
          <option value="future">Future availability</option>
        </select>
      </Field>
      <button type="submit" className="h-9 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-[#174ea6]">
        Search
      </button>
    </form>
  );
}
