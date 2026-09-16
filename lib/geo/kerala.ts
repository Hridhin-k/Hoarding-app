export type GeoPoint = { lat: number; lng: number };

export type KeralaCity = {
  name: string;
  lat: number;
  lng: number;
  localities?: string[];
};

export type KeralaDistrict = {
  name: string;
  lat: number;
  lng: number;
  cities: KeralaCity[];
};

export const KERALA_STATE = "Kerala";
export const OTHER_VALUE = "__other__";

/** Official 14 districts with municipal / census towns used in OOH inventory. */
export const KERALA_DISTRICTS: KeralaDistrict[] = [
  {
    name: "Thiruvananthapuram",
    lat: 8.5241,
    lng: 76.9366,
    cities: [
      {
        name: "Thiruvananthapuram",
        lat: 8.5241,
        lng: 76.9366,
        localities: ["Statue", "Palayam", "East Fort", "Kesavadasapuram", "Pattom", "Kazhakkoottam", "Technopark", "Kovalam", "Neyyattinkara road"],
      },
      { name: "Neyyattinkara", lat: 8.4, lng: 77.0869 },
      { name: "Attingal", lat: 8.698, lng: 76.815 },
      { name: "Varkala", lat: 8.7379, lng: 76.7163 },
      { name: "Nedumangad", lat: 8.6026, lng: 77.0028 },
      { name: "Kattakada", lat: 8.512, lng: 77.083 },
    ],
  },
  {
    name: "Kollam",
    lat: 8.8932,
    lng: 76.6141,
    cities: [
      {
        name: "Kollam",
        lat: 8.8932,
        lng: 76.6141,
        localities: ["Chinnakada", "Kadappakada", "Kottiyam", "Thankassery"],
      },
      { name: "Punalur", lat: 9.019, lng: 76.925 },
      { name: "Karunagappally", lat: 9.0546, lng: 76.5356 },
      { name: "Kottarakkara", lat: 8.994, lng: 76.775 },
      { name: "Paravur", lat: 8.811, lng: 76.669 },
    ],
  },
  {
    name: "Pathanamthitta",
    lat: 9.2648,
    lng: 76.787,
    cities: [
      { name: "Pathanamthitta", lat: 9.2648, lng: 76.787 },
      { name: "Tiruvalla", lat: 9.385, lng: 76.575 },
      { name: "Adoor", lat: 9.155, lng: 76.736 },
      { name: "Pandalam", lat: 9.225, lng: 76.679 },
      { name: "Kozhencherry", lat: 9.342, lng: 76.71 },
    ],
  },
  {
    name: "Alappuzha",
    lat: 9.4981,
    lng: 76.3388,
    cities: [
      {
        name: "Alappuzha",
        lat: 9.4981,
        lng: 76.3388,
        localities: ["Alappuzha Beach", "Iron Bridge", "Boat Jetty"],
      },
      { name: "Cherthala", lat: 9.684, lng: 76.336 },
      { name: "Kayamkulam", lat: 9.174, lng: 76.501 },
      { name: "Mavelikkara", lat: 9.267, lng: 76.556 },
      { name: "Haripad", lat: 9.28, lng: 76.458 },
      { name: "Chengannur", lat: 9.318, lng: 76.615 },
    ],
  },
  {
    name: "Kottayam",
    lat: 9.5916,
    lng: 76.5222,
    cities: [
      {
        name: "Kottayam",
        lat: 9.5916,
        lng: 76.5222,
        localities: ["Gandhinagar", "Baker Junction", "MC Road"],
      },
      { name: "Changanassery", lat: 9.442, lng: 76.541 },
      { name: "Pala", lat: 9.713, lng: 76.683 },
      { name: "Ettumanoor", lat: 9.67, lng: 76.56 },
      { name: "Vaikom", lat: 9.754, lng: 76.396 },
      { name: "Kanjirappally", lat: 9.559, lng: 76.787 },
    ],
  },
  {
    name: "Idukki",
    lat: 9.85,
    lng: 76.97,
    cities: [
      { name: "Thodupuzha", lat: 9.8959, lng: 76.718 },
      { name: "Kattappana", lat: 9.7548, lng: 77.1166 },
      { name: "Munnar", lat: 10.0889, lng: 77.0595 },
      { name: "Adimali", lat: 10.011, lng: 76.951 },
      { name: "Kumily", lat: 9.603, lng: 77.166 },
    ],
  },
  {
    name: "Ernakulam",
    lat: 9.9816,
    lng: 76.2999,
    cities: [
      {
        name: "Kochi",
        lat: 9.9312,
        lng: 76.2673,
        localities: [
          "Marine Drive",
          "Edappally",
          "Palarivattom",
          "Vyttila",
          "Kakkanad",
          "MG Road",
          "Fort Kochi",
          "Kaloor",
          "Infopark",
          "Lulu Mall approach",
        ],
      },
      { name: "Aluva", lat: 10.1076, lng: 76.3516 },
      { name: "Perumbavoor", lat: 10.115, lng: 76.476 },
      { name: "Muvattupuzha", lat: 9.99, lng: 76.58 },
      { name: "Kothamangalam", lat: 10.06, lng: 76.628 },
      { name: "Angamaly", lat: 10.196, lng: 76.386 },
      { name: "Tripunithura", lat: 9.944, lng: 76.349 },
      { name: "Kalamassery", lat: 10.053, lng: 76.328 },
      { name: "North Paravur", lat: 10.149, lng: 76.227 },
    ],
  },
  {
    name: "Thrissur",
    lat: 10.5276,
    lng: 76.2144,
    cities: [
      {
        name: "Thrissur",
        lat: 10.5276,
        lng: 76.2144,
        localities: ["Swaraj Round", "Punkunnam", "East Fort", "Sakthan Thampuran Nagar"],
      },
      { name: "Chalakudy", lat: 10.307, lng: 76.334 },
      { name: "Kodungallur", lat: 10.222, lng: 76.199 },
      { name: "Guruvayur", lat: 10.594, lng: 76.041 },
      { name: "Irinjalakuda", lat: 10.342, lng: 76.211 },
      { name: "Kunnamkulam", lat: 10.65, lng: 76.073 },
    ],
  },
  {
    name: "Palakkad",
    lat: 10.7867,
    lng: 76.6548,
    cities: [
      {
        name: "Palakkad",
        lat: 10.7867,
        lng: 76.6548,
        localities: ["Shoranur Road", "Stadium Bus Stand", "Olavakkode"],
      },
      { name: "Ottapalam", lat: 10.77, lng: 76.378 },
      { name: "Shoranur", lat: 10.761, lng: 76.27 },
      { name: "Mannarkkad", lat: 10.992, lng: 76.464 },
      { name: "Pattambi", lat: 10.806, lng: 76.196 },
      { name: "Chittur", lat: 10.7, lng: 76.747 },
    ],
  },
  {
    name: "Malappuram",
    lat: 11.073,
    lng: 76.074,
    cities: [
      { name: "Malappuram", lat: 11.073, lng: 76.074 },
      { name: "Manjeri", lat: 11.12, lng: 76.12 },
      { name: "Perinthalmanna", lat: 10.9765, lng: 76.226 },
      { name: "Tirur", lat: 10.914, lng: 75.925 },
      { name: "Ponnani", lat: 10.767, lng: 75.925 },
      { name: "Kottakkal", lat: 10.995, lng: 76.002 },
      { name: "Nilambur", lat: 11.277, lng: 76.226 },
      { name: "Kondotty", lat: 11.144, lng: 75.966, localities: ["Karipur", "Airport approach"] },
    ],
  },
  {
    name: "Kozhikode",
    lat: 11.2588,
    lng: 75.7804,
    cities: [
      {
        name: "Kozhikode",
        lat: 11.2588,
        lng: 75.7804,
        localities: ["Mavoor Road", "Palayam", "Ramanattukara", "Focus Mall", "Beach Road"],
      },
      { name: "Vadakara", lat: 11.608, lng: 75.591 },
      { name: "Koyilandy", lat: 11.439, lng: 75.695 },
      { name: "Ramanattukara", lat: 11.176, lng: 75.827 },
      { name: "Feroke", lat: 11.18, lng: 75.827 },
    ],
  },
  {
    name: "Wayanad",
    lat: 11.6854,
    lng: 76.132,
    cities: [
      { name: "Kalpetta", lat: 11.610, lng: 76.083, localities: ["Main market"] },
      { name: "Sultan Bathery", lat: 11.665, lng: 76.263 },
      { name: "Mananthavady", lat: 11.801, lng: 76.004 },
    ],
  },
  {
    name: "Kannur",
    lat: 11.8745,
    lng: 75.3704,
    cities: [
      {
        name: "Kannur",
        lat: 11.8745,
        lng: 75.3704,
        localities: ["Fort Road", "Payyambalam", "Thavakkara"],
      },
      { name: "Thalassery", lat: 11.748, lng: 75.5476, localities: ["New bus stand"] },
      { name: "Payyanur", lat: 12.093, lng: 75.202 },
      { name: "Taliparamba", lat: 12.041, lng: 75.36 },
      { name: "Iritty", lat: 11.983, lng: 75.67 },
    ],
  },
  {
    name: "Kasaragod",
    lat: 12.4996,
    lng: 74.9869,
    cities: [
      { name: "Kasaragod", lat: 12.4996, lng: 74.9869 },
      { name: "Kanhangad", lat: 12.308, lng: 75.095 },
      { name: "Nileshwar", lat: 12.259, lng: 75.13 },
    ],
  },
];

const CITY_ALIASES: Record<string, string> = {
  cochin: "Kochi",
  ernakulam: "Kochi",
  trivandrum: "Thiruvananthapuram",
  calicut: "Kozhikode",
  alleppey: "Alappuzha",
  allepey: "Alappuzha",
  quilon: "Kollam",
  cannore: "Kannur",
  kannanore: "Kannur",
  palghat: "Palakkad",
  trichur: "Thrissur",
  thiruvalla: "Tiruvalla",
  casargod: "Kasaragod",
  kasaragode: "Kasaragod",
};

export function normalizePlaceName(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function key(value: string | null | undefined) {
  return normalizePlaceName(value).toLowerCase();
}

export function canonicalCityName(value: string | null | undefined) {
  const raw = normalizePlaceName(value);
  if (!raw) return "";
  return CITY_ALIASES[key(raw)] ?? raw;
}

export function findDistrict(name: string | null | undefined) {
  const wanted = key(name);
  if (!wanted) return undefined;
  return KERALA_DISTRICTS.find((district) => key(district.name) === wanted);
}

export function citiesInDistrict(districtName: string | null | undefined): KeralaCity[] {
  return findDistrict(districtName)?.cities ?? [];
}

export function findCity(districtName: string | null | undefined, cityName: string | null | undefined) {
  const wanted = key(canonicalCityName(cityName));
  if (!wanted) return undefined;
  return citiesInDistrict(districtName).find((city) => key(city.name) === wanted);
}

export function isCatalogCity(districtName: string | null | undefined, cityName: string | null | undefined) {
  return Boolean(findCity(districtName, cityName));
}

export function placeCenter(districtName?: string | null, cityName?: string | null): GeoPoint | null {
  const city = findCity(districtName, cityName);
  if (city) return { lat: city.lat, lng: city.lng };
  const district = findDistrict(districtName);
  if (district) return { lat: district.lat, lng: district.lng };
  return null;
}

export function localitiesForCity(districtName: string | null | undefined, cityName: string | null | undefined) {
  return findCity(districtName, cityName)?.localities ?? [];
}

export function matchDistrictFromAddress(parts: Array<string | undefined | null>) {
  for (const part of parts) {
    const found = findDistrict(part);
    if (found) return found.name;
  }
  return "";
}

export function matchCityInDistrict(districtName: string, parts: Array<string | undefined | null>) {
  for (const part of parts) {
    const found = findCity(districtName, part);
    if (found) return found.name;
  }
  return canonicalCityName(parts.find(Boolean) ?? "");
}

export const KERALA_DISTRICT_NAMES = KERALA_DISTRICTS.map((district) => district.name);
