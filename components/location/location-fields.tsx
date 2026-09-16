"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  KERALA_DISTRICT_NAMES,
  KERALA_STATE,
  OTHER_VALUE,
  citiesInDistrict,
  isCatalogCity,
  localitiesForCity,
  placeCenter,
} from "@/lib/geo/kerala";
import type { GeoPoint } from "@/lib/maps/types";

export type PlaceValue = {
  state: string;
  district: string;
  city: string;
  locality: string;
  address: string;
  landmark: string;
  pincode: string;
};

const selectClass = "h360-select w-full";

export function LocationFields({
  value,
  onChange,
  names = true,
  showOptionalText = true,
}: {
  value: PlaceValue;
  onChange: (next: PlaceValue, meta?: { flyTo?: GeoPoint; zoom?: number }) => void;
  names?: boolean;
  showOptionalText?: boolean;
}) {
  const localityListId = useId();
  const cities = citiesInDistrict(value.district);
  const cityInCatalog = isCatalogCity(value.district, value.city);
  const [otherCity, setOtherCity] = useState(Boolean(value.district && value.city && !cityInCatalog));
  const usingOtherCity = otherCity || Boolean(value.district && value.city && !cityInCatalog);
  const citySelectValue = usingOtherCity ? OTHER_VALUE : value.city;
  const localities = localitiesForCity(value.district, cityInCatalog ? value.city : "");

  function patch(partial: Partial<PlaceValue>, meta?: { flyTo?: GeoPoint; zoom?: number }) {
    onChange({ ...value, ...partial }, meta);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="loc-state">State</Label>
        <select
          id="loc-state"
          name={names ? "state" : undefined}
          className={selectClass}
          value={value.state || KERALA_STATE}
          onChange={(event) => patch({ state: event.target.value, district: "", city: "" })}
        >
          <option value={KERALA_STATE}>{KERALA_STATE}</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-district">District</Label>
        <select
          id="loc-district"
          name={names ? "district" : undefined}
          className={selectClass}
          value={value.district}
          required
          onChange={(event) => {
            const district = event.target.value;
            const center = placeCenter(district);
            setOtherCity(false);
            patch({ district, city: "", locality: "" }, center ? { flyTo: center, zoom: 10 } : undefined);
          }}
        >
          <option value="">Choose district</option>
          {KERALA_DISTRICT_NAMES.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc-city">City / town</Label>
        <select
          id="loc-city"
          className={selectClass}
          value={citySelectValue}
          disabled={!value.district}
          onChange={(event) => {
            const selected = event.target.value;
            if (selected === OTHER_VALUE) {
              setOtherCity(true);
              patch({ city: "" });
              return;
            }
            setOtherCity(false);
            const center = placeCenter(value.district, selected);
            patch({ city: selected }, center ? { flyTo: center, zoom: 14 } : undefined);
          }}
        >
          <option value="">{value.district ? "Choose city" : "Choose a district first"}</option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other (type below)</option>
        </select>
        {names ? <input type="hidden" name="city" value={value.city.trim()} /> : null}
      </div>
      {usingOtherCity ? (
        <div className="space-y-1.5">
          <Label htmlFor="loc-city-other">City name</Label>
          <Input
            id="loc-city-other"
            value={value.city.trim()}
            onChange={(event) => patch({ city: event.target.value })}
            placeholder="Type the town name"
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="loc-locality">Locality / junction</Label>
        <Input
          id="loc-locality"
          name={names ? "locality" : undefined}
          list={localityListId}
          value={value.locality}
          onChange={(event) => patch({ locality: event.target.value })}
          placeholder="Optional — junction, stretch, road"
        />
        {localities.length ? (
          <datalist id={localityListId}>
            {localities.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        ) : null}
      </div>
      {showOptionalText ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="loc-pincode">Pincode</Label>
            <Input
              id="loc-pincode"
              name={names ? "pincode" : undefined}
              value={value.pincode}
              onChange={(event) => patch({ pincode: event.target.value })}
              placeholder="Optional"
              inputMode="numeric"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="loc-address">Address</Label>
            <Input
              id="loc-address"
              name={names ? "address" : undefined}
              value={value.address}
              onChange={(event) => patch({ address: event.target.value })}
              placeholder="Optional street address"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="loc-landmark">Landmark</Label>
            <Input
              id="loc-landmark"
              name={names ? "landmark" : undefined}
              value={value.landmark}
              onChange={(event) => patch({ landmark: event.target.value })}
              placeholder="Optional — bus stand, mall, junction"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
