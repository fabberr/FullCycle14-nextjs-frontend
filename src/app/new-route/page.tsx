'use client';

import type { DirectionsResponseData, FindPlaceFromTextResponseData, LatLngLiteral } from "@googlemaps/google-maps-services-js";
import { FormEvent, useRef, useState } from "react";
import useMap from "../hooks/useMap";

export function NewRoutePage() {

    /********** Hooks **********/
    
    const originRef = useRef<HTMLInputElement>(null);
    const destinationRef = useRef<HTMLInputElement>(null);

    const mapContainerRef = useRef<HTMLDivElement>(null);

    const map = useMap(mapContainerRef);

    const [directions, setDirections] = useState<DirectionsResponseData & { request : any }>();
    
    const [startAddress, setStartAddress] = useState<string>();
    const [endAddress, setEndAddress] = useState<string>();

    /********** Functions **********/
    
    /**
     * Finds the origin and destination places and calculates a route between 
     * them using Google Maps API, then renders a map with the route drawn onto it.
    */
    async function findPlacesAndRenderRouteToMap() {
        const baseUrl = 'http://localhost:3000';

        //==========================================================================================
        
        const findPlaceUrl = `${baseUrl}/places`;

        const origin = originRef.current!.value;
        const destination = destinationRef.current!.value;

        const [
            originPlaceData,
            destinationPlaceData,
        ]: FindPlaceFromTextResponseData[] = await Promise.all([
            fetch(`${findPlaceUrl}?text=${origin}`).then((res) => res.json()),
            fetch(`${findPlaceUrl}?text=${destination}`).then((res) => res.json())
        ]);

        if (originPlaceData.status !== 'OK') {
            console.error(originPlaceData);
            alert('Não foi possível encontrar o local de origem.');
            return;
        }

        if (destinationPlaceData.status !== 'OK') {
            console.error(destinationPlaceData);
            alert('Não foi possível encontrar o local de destino.');
            return;
        }

        //==========================================================================================
        
        const getDirectionsUrl = `${baseUrl}/directions`;

        const queryParams = Object.entries({
            origin: originPlaceData.candidates.at(0)?.place_id ?? null,
            destination: destinationPlaceData.candidates.at(0)?.place_id ?? null,
        }).map(([key, value]) => `${key}=${value}`).join('&');
 
        const directionsData: DirectionsResponseData & { request: any } = 
            await fetch(`${getDirectionsUrl}?${queryParams}`).then((res) => res.json());
        const firstLeg = directionsData.routes.at(0)?.legs.at(0);
        const lastLeg = directionsData.routes.at(0)?.legs.at(-1);
        setDirections(directionsData);

        setStartAddress(firstLeg?.start_address); setEndAddress(lastLeg?.end_address);
        
        //==========================================================================================
        
        map?.removeAllRoutes();
        
        const startLocation = firstLeg?.start_location;
        const endLocation = lastLeg?.end_location;
        await map?.addRouteWithIcons({
            routeId: '0',
            startMarkerOptions: {
                position: startLocation,
            },
            endMarkerOptions: {
                position: endLocation,
            },
            carMarkerOptions: {
                position: startLocation,
            },
        });
    }

    /**
     * Persists the new route onto the database.
    */
    async function createRoute() {
        const baseUrl = 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/routes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `${startAddress} >> ${endAddress}`,
                origin_id: directions!.request.origin.place_id.replace('place_id:', ''),
                destination_id: directions!.request.destination.place_id.replace('place_id:', ''),
            }),
        }).then((res) => res.json());
    }

    /********** Event Handlers **********/
    
    function handleFindRoutesFormSubmit(event: FormEvent){
        event.preventDefault();
        findPlacesAndRenderRouteToMap();
    };

    function handleCreateRouteClick() {
        createRoute();
    }

    /********** Page **********/
    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>
            <div>
                <h1>Nova rota</h1>
                <form style={{ display: 'flex', flexDirection: 'column' }} onSubmit={handleFindRoutesFormSubmit}>
                    <div>
                        <input
                            ref={originRef}
                            type="text"
                            placeholder="Origem"
                            name="Origin"
                            title="Local de origem"
                        />
                    </div>
                    <div>
                        <input
                            ref={destinationRef}
                            type="text"
                            placeholder="Destino"
                            name="Destination"
                            title="Local de destino"
                        />
                    </div>
                    <button type="submit">Pesquisar</button>
                </form>
                {directions && (
                    <div>
                        <ul>
                            <li>Origem: {directions.routes.at(0)?.legs.at(0)?.start_address}</li>
                            <li>Destino: {directions.routes.at(0)?.legs.at(-1)?.end_address}</li>
                        </ul>
                        <button onClick={handleCreateRouteClick}>Criar Rota</button>
                    </div>
                )}
            </div>
            <div id="map" style={{ height: '100%', width: '100%' }} ref={mapContainerRef}>
            </div>
        </div>
    );
};
export default NewRoutePage;
