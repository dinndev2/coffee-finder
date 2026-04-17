import { GoogleRoute } from "../(tabs)";

export async function cofee_shops(lat: number, lng: number, km: number) {
  const url = "https://api.mapbox.com/search/searchbox";
  const response = await fetch(`${url}places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": `${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.photos,places.location,places.userRatingCount,places.regularOpeningHours",
    },
    body: JSON.stringify({
      includedTypes: ["coffee_shop"],
      maxResultCount: 1,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: km,
        },
      },
    }),
  });
  return await response.json();
}

export async function getRoutes<T>(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<GoogleRoute> {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": `${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: originLat, longitude: originLng },
          },
        },
        destination: {
          location: { latLng: { latitude: destLat, longitude: destLng } },
        },
        routingPreference: "TRAFFIC_AWARE",
      }),
    },
  );

  return await response.json();
}

export const getCoffeeShopInfo = async <T>(shop: string): Promise<T> => {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${shop.id}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": `${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        "X-Goog-FieldMask": "reviews,editorialSummary,googleMapsUri",
      },
    },
  );
  return await response.json();
};
