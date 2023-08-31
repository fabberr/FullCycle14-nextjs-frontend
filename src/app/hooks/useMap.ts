import { Loader as GoogleMapsApiLoader } from "@googlemaps/js-api-loader";
import { useEffect, useState } from "react";
import { getCurrentPositionAsync } from "../utils/geolocation";
import { Map } from "../utils/map";

export function useMap(mapContainerRef: React.RefObject<HTMLDivElement>) {

    const [map, setMap] = useState<Map>();

    useEffect(() => {
        (async () => {
            const geolocationGetPositionOptions = {
                enableHighAccuracy: true,
                timeout: 2500,
            };
            const defaultPosition = { lat: -22.128336370741454, lng: -51.400940115297274 }; // pdp

            const googleMapsApiLoader = new GoogleMapsApiLoader({
                apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string, 
                libraries: [
                    'routes',
                    'geometry'
                ],
            });
            
            const [ , , currentPositionFromBrowserGeolocation] = await Promise.all([
                googleMapsApiLoader.importLibrary('routes')
                    .catch((error) => console.error(error)),
                googleMapsApiLoader.importLibrary('geometry')
                    .catch((error) => console.error(error)),
                getCurrentPositionAsync(geolocationGetPositionOptions)
                    .catch((error) => { console.error(error) }),
            ]);

            setMap(new Map(mapContainerRef.current!, {
                zoom: 15,
                center: currentPositionFromBrowserGeolocation ?? defaultPosition,
            }));
        })();
    }, [mapContainerRef]);

    return map;
}
export default useMap;
