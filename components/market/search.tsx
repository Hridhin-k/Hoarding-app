"use client";

import {
  ILLUMINATION_LABELS,
  STRUCTURE_TYPE_LABELS,
  type IlluminationType,
  type StructureType,
} from "@/lib/types/enums";
import type { MarketplaceSearchParams } from "@/lib/marketplace/public";
import { MARKETPLACE_FILTER_KEYS } from "@/lib/marketplace/filters";
import { PlaceFilters } from "@/components/location/place-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

function FilterFields({ values, idPrefix }: { values?: MarketplaceSearchParams; idPrefix: string }) {
  return (
    <>
      <Field id={`${idPrefix}-q`} label="Search">
        <Input
          id={`${idPrefix}-q`}
          name="q"
          defaultValue={values?.q ?? ""}
          placeholder="Board, locality, or city"
        />
      </Field>
      <Field id={`${idPrefix}-place`} label="District, city, locality">
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
      <Field id={`${idPrefix}-type`} label="Board type">
        <select
          id={`${idPrefix}-type`}
          name="type"
          className="h360-select w-full"
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
      <Field id={`${idPrefix}-illumination`} label="Illumination">
        <select
          id={`${idPrefix}-illumination`}
          name="illumination"
          className="h360-select w-full"
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
      <Field id={`${idPrefix}-direction`} label="Direction">
        <Input
          id={`${idPrefix}-direction`}
          name="direction"
          defaultValue={values?.direction ?? ""}
          placeholder="e.g. North"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field id={`${idPrefix}-min-price`} label="Min ₹ / month">
          <Input
            id={`${idPrefix}-min-price`}
            name="minPrice"
            type="number"
            min={0}
            defaultValue={values?.minPrice ?? ""}
          />
        </Field>
        <Field id={`${idPrefix}-max-price`} label="Max ₹ / month">
          <Input
            id={`${idPrefix}-max-price`}
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={values?.maxPrice ?? ""}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field id={`${idPrefix}-min-width`} label="Min width (ft)">
          <Input
            id={`${idPrefix}-min-width`}
            name="minWidth"
            type="number"
            min={0}
            step="0.1"
            defaultValue={values?.minWidth ?? ""}
          />
        </Field>
        <Field id={`${idPrefix}-min-height`} label="Min height (ft)">
          <Input
            id={`${idPrefix}-min-height`}
            name="minHeight"
            type="number"
            min={0}
            step="0.1"
            defaultValue={values?.minHeight ?? ""}
          />
        </Field>
      </div>
      <Field id={`${idPrefix}-availability`} label="Availability">
        <select
          id={`${idPrefix}-availability`}
          name="availability"
          className="h360-select w-full"
          defaultValue={values?.availability ?? ""}
        >
          <option value="">Any availability</option>
          <option value="now">Available now</option>
          <option value="upcoming">Becoming vacant</option>
          <option value="future">Future availability</option>
        </select>
      </Field>
    </>
  );
}

export function MarketSearch({
  values,
  activeCount = 0,
}: {
  values?: MarketplaceSearchParams;
  activeCount?: number;
}) {
  return (
    <>
      <form method="get" className="h360-panel sticky top-16 hidden space-y-3 p-4 lg:block">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Find a face</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Published outdoor inventory across Kerala. Filter by place, size, and availability.
          </p>
        </div>
        <FilterFields values={values} idPrefix="desk" />
        <Button type="submit" className="w-full">
          Search inventory
        </Button>
      </form>

      <div className="lg:hidden">
        <form method="get" className="flex gap-2">
          {MARKETPLACE_FILTER_KEYS.filter((key) => key !== "q").map((key) =>
            values?.[key] ? <input key={key} type="hidden" name={key} value={values[key]} /> : null,
          )}
          <Input
            name="q"
            defaultValue={values?.q ?? ""}
            placeholder="Search locality or board"
            aria-label="Search"
            className="h-10"
          />
          <Sheet>
            <SheetTrigger
              render={<Button type="button" variant="outline" className="h-10 shrink-0" />}
            >
              Filters{activeCount ? ` (${activeCount})` : ""}
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto sm:max-w-full">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow published faces by place, size, lighting, and dates.</SheetDescription>
              </SheetHeader>
              <form method="get" className="space-y-3 px-4 pb-6">
                <FilterFields values={values} idPrefix="mobile" />
                <Button type="submit" className="w-full">
                  Show matching inventory
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        </form>
      </div>
    </>
  );
}
