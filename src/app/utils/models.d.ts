import type { DirectionsResponseData, LatLngLiteral, TravelMode } from "@googlemaps/google-maps-services-js";

export type Route = {
    id: string;
    name: string;
    origin: { name: string; location: { lat: number; lng: number; } };
    destination: { name: string; location: { lat: number; lng: number; } };
    distance: number;
    duration: number;
    directions: DirectionsResponseData & { request: Directions };
    created_at: Date;
    updated_at: Date;
};

export type Place = {
    place_id: string;
    location: LatLngLiteral;
}

export type Directions = {
    mode: TravelMode;
    origin: Place;
    destination: Place;
}
