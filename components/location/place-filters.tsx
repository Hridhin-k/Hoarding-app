"use client";

import { useMemo, useState } from "react";
import { KERALA_DISTRICT_NAMES, citiesInDistrict, isCatalogCity } from "@/lib/geo/kerala";

const selectClass = "h-8 rounded-lg border bg-background px-2 text-sm";

export function PlaceFilters({
  district = "",
  city = "",
  locality,
  showLocality = false,
  districtName = "district",
  cityName = "city",
  localityName = "locality",
  districtAllLabel = "All districts",
  cityAllLabel = "All cities",
  className,
}: {
  district?: string;
  city?: string;
  locality?: string;
  showLocality?: boolean;
  districtName?: string;
  cityName?: string;
  localityName?: string;
  districtAllLabel?: string;
  cityAllLabel?: string;
  className?: string;
}) {
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const [selectedCity, setSelectedCity] = useState(city);
  const cities = useMemo(() => citiesInDistrict(selectedDistrict), [selectedDistrict]);
  const widthClass = className ?? "w-44";

  return (
    <>
      <select
        name={districtName}
        aria-label="District"
        className={`${selectClass} ${widthClass}`}
        value={selectedDistrict}
        onChange={(event) => {
          const next = event.target.value;
          setSelectedDistrict(next);
          if (!isCatalogCity(next, selectedCity)) setSelectedCity("");
        }}
      >
        <option value="">{districtAllLabel}</option>
        {KERALA_DISTRICT_NAMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <select
        name={cityName}
        aria-label="City"
        className={`${selectClass} ${widthClass}`}
        value={selectedCity}
        disabled={!selectedDistrict}
        onChange={(event) => setSelectedCity(event.target.value)}
      >
        <option value="">{selectedDistrict ? cityAllLabel : "Choose district"}</option>
        {cities.map((item) => (
          <option key={item.name} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
      {showLocality ? (
        <input
          name={localityName}
          aria-label="Locality"
          defaultValue={locality ?? ""}
          placeholder="Locality (optional)"
          className="h-8 w-40 rounded-lg border px-2 text-sm"
        />
      ) : null}
    </>
  );
}
