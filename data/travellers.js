/** Where every arc on the globe ends by default. */
export const almatyPoint = { lat: 43.24, lng: 76.89 };

/**
 * One pin per country of origin on the welcome globe, placed on its capital or largest city.
 * Ordered east to west so stepping through the pins keeps turning the globe one way.
 */
export const travellers = [
  { country: "JP", lat: 35.68, lng: 139.69 },
  { country: "KR", lat: 37.57, lng: 126.98 },
  { country: "CN", lat: 39.9, lng: 116.4 },
  { country: "IN", lat: 28.61, lng: 77.21 },
  { country: "KZ", lat: 51.17, lng: 71.43 },
  { country: "KG", lat: 42.87, lng: 74.59 },
  { country: "UZ", lat: 41.31, lng: 69.24 },
  { country: "RU", lat: 55.76, lng: 37.62 },
  { country: "TR", lat: 41.01, lng: 28.98 },
  { country: "DE", lat: 52.52, lng: 13.4 },
  { country: "FR", lat: 48.86, lng: 2.35 },
  { country: "GB", lat: 51.51, lng: -0.13 },
  { country: "US", lat: 40.71, lng: -74.01 },
];

export const travellerByCountry = Object.fromEntries(travellers.map((item) => [item.country, item]));
