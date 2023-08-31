'use client';

import type { FindPlaceFromTextResponseData } from "@googlemaps/google-maps-services-js";
import { FormEvent, useRef } from "react";
import useMap from "../hooks/useMap";

export function NewRoutePage() {

    /********** Hooks **********/
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const map = useMap(mapContainerRef);

    /********** Event Handlers **********/
    
    const handleFindPlacesSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const baseUrl = 'http://localhost:3000';

        //======================================================================
        const findPlaceUrl = `${baseUrl}/places`;

        const origin = (document.getElementById('txtOrigin') as HTMLInputElement).value;
        const destination = (document.getElementById('txtDestination') as HTMLInputElement).value;

        const [
            originPlaceResponseData,
            destinationPlaceResponseData,
        ]: FindPlaceFromTextResponseData[] = await Promise.all([
            fetch(`${findPlaceUrl}?text=${origin}`).then((res) => res.json()),
            fetch(`${findPlaceUrl}?text=${destination}`).then((res) => res.json())
        ]);

        if (originPlaceResponseData.status !== 'OK') {
            console.error(originPlaceResponseData);
            alert('Não foi possível encontrar o local de origem.');
            return;
        }

        if (destinationPlaceResponseData.status !== 'OK') {
            console.error(destinationPlaceResponseData);
            alert('Não foi possível encontrar o local de destino.');
            return;
        }

        console.log(originPlaceResponseData, destinationPlaceResponseData);

        //======================================================================
        const getDirecrionsUrl = `${baseUrl}/directions`;

        const queryParams = Object.entries({
            origin: originPlaceResponseData.candidates.at(0)?.place_id ?? null,
            destination: destinationPlaceResponseData.candidates.at(0)?.place_id ?? null,
        }).map(([key, value]) => `${key}=${value}`).join('&');

        const getDirectionsResponseData = await fetch(`${getDirecrionsUrl}?${queryParams}`)
            .then((res) => res.json());
        console.log(getDirectionsResponseData);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>
            <div>
                <h1>Nova rota</h1>
                <form id="findPlaces" style={{ display: 'flex', flexDirection: 'column' }} onSubmit={handleFindPlacesSubmit}>
                    <div>
                        <input id="txtOrigin" type="text" placeholder="Origem" name="Origin" title="Origem" />
                    </div>
                    <div>
                        <input id="txtDestination" type="text" placeholder="Destino" name="Destination" title="Destino" />
                    </div>
                    <button type="submit">Pesquisar</button>
                </form>
            </div>
            <div id="map" style={{ height: '100%', width: '100%' }} ref={mapContainerRef}>
            </div>
        </div>
    );
};

export default NewRoutePage;
