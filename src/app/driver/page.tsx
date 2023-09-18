'use client';

import type * as googleMapsServicesJs from "@googlemaps/google-maps-services-js";
import react, { ChangeEvent, MouseEvent } from "react";
import useMap from "../hooks/useMap";
import useSwr from "swr";
import * as http from "../utils/http";
import * as models from "../utils/models";
import * as internalApi from "../utils/internal-api";

export function DriverPage() {

    /********** Hooks **********/
    
    const selectedRouteRef = react.useRef<HTMLSelectElement>(null);
    
    const mapContainerRef = react.useRef<HTMLDivElement>(null);
    const map = useMap(mapContainerRef);

    const [currentRoute, updateRoute] = react.useState<models.Route | null>(null);

    const { data: routes, error: fetchRoutesError, isLoading: isRoutesLoading } 
        = useSwr<models.Route[]>('http://localhost:3000/routes', http.fetcher, { fallbackData: [] });

    /** Renders the current route on the map every time it changes. */
    react.useEffect(() => {
        (async () => {
            if (!currentRoute) return;
            
            map?.removeAllRoutes();
            
            const firstLeg = currentRoute.directions.routes.at(0)?.legs.at(0);
            const lastLeg = currentRoute.directions.routes.at(0)?.legs.at(-1);
    
            const startLocation = firstLeg?.start_location;
            const endLocation = lastLeg?.end_location;

            await map?.addRouteWithIcons({
                routeId: currentRoute.id,
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
        })();
    }, [currentRoute, map]);
    
    /********** Functions **********/

    /**
     * Fetches the selected route from the back-end API and renders it on the map.
    */
    const renderCurrentRouteToMap = async () => {
        const selectedRouteId = selectedRouteRef.current!.value;

        if (!selectedRouteId) {
            console.error('Erro ao renderizar rota.', 'Nenhum Rota selecionada.');
            map?.removeAllRoutes();
            return;
        }

        const findRouteResponseData = await internalApi.RoutesClient.instance.get(selectedRouteId);
        const route = (findRouteResponseData as internalApi.ErrorType).statusCode !== 500 
            ? findRouteResponseData as models.Route : null;

        // trigers the useEffect hook that renders `currentRoute` on the map
        updateRoute(route);
    }

    /**
     * Simulates a driver travelling down the current route by updating the car 
     * marker's position on the map every few seconds.
     * 
     * The amount of time waited between each update is based on the typical 
     * duration for a given step of the journey as found by Google's API, 
     * scaled down by a given time scale factor.
     * 
     * @param timeScale Time scale factor between updates. Higher numbers will 
     *                  shorten the time between updates based on the typical 
     *                  duration between two steps returned by Google's API, 
     *                  if any. If no duration data is found, the default value 
     *                  of 10 minutes is used.
     * 
     *                  Optional, default scale is 100x. If a negative value is 
     *                  passed, its absolute value is taken as the scale.
    */
    const simulateTravelOnCurrentRoute = async (timeScale: number = 100) => {
        if (!currentRoute) {
            console.error('Erro ao simular viagem.', 'Nenhuma Rota selecionada.');
            return;
        }

        const _fnLogStepInfo = (step: googleMapsServicesJs.DirectionsStep, timeScale: number, durationMilliseconds: number, durationMillisecondsScaled: number) => {
            const latlng2Str = (latlng: googleMapsServicesJs.LatLngLiteral) => `(${latlng.lat}, ${latlng.lng})`;
            console.log(
                `step: ${step.html_instructions}\n`,
                `├── duration / (${timeScale}x): ${durationMilliseconds} ms / (${durationMillisecondsScaled} ms)\n`,
                `├── start_location: ${latlng2Str(step.start_location)}\n`,
                `└── end_location:   ${latlng2Str(step.end_location)}`,
            );
        };

        // a pior coisa que inventaram foi entrada do usuário
        timeScale = Math.abs(timeScale);
        if (timeScale == 0) { timeScale = 1; } /** https://www.youtube.com/watch?v=asDlYjJqzWE */

        // Reset car marker to first step of first leg.
        map?.moveCar(currentRoute.id, currentRoute.directions.routes.at(0)?.legs.at(0)?.start_location!);

        // Simulate travel through all steps of all legs of the current route.
        const defaultDurationSeconds = 10 * 60; // Assume 10 minutes if no duration data is found.
        for (const leg of currentRoute.directions.routes.at(0)?.legs ?? []) {
            for (const step of leg?.steps ?? []) {
                // Apply time scale to current or default duration.
                const durationMilliseconds = (step?.duration?.value ?? defaultDurationSeconds) * 1000;
                const durationMillisecondsScaled =  durationMilliseconds / timeScale;

                _fnLogStepInfo(step, timeScale, durationMilliseconds, durationMillisecondsScaled);

                await sleep(durationMillisecondsScaled);
                map?.moveCar(currentRoute.id, step.start_location);

                await sleep(durationMillisecondsScaled);
                map?.moveCar(currentRoute.id, step.end_location);                
            }
        }
    };
    
    /********** Event Handlers **********/
    
    function handleSelectedRouteChanged(event: ChangeEvent<HTMLSelectElement>): void {
        renderCurrentRouteToMap();
    }

    function handleStartTripClick(event: MouseEvent<HTMLButtonElement>): void {
        try {
            simulateTravelOnCurrentRoute(1000);
        } catch (error) {
            console.error('Não foi possível iniciar a rota.', error);
        }
    }

    /********** Page **********/
    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>
            <div>
                <h1>Minha viagem</h1>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div>
                        <select id="route" ref={selectedRouteRef} onChange={handleSelectedRouteChanged}>
                            <option value="">Selecione uma Rota</option>
                            {isRoutesLoading && <option>Carregando rotas...</option>}
                            {
                                routes!.map((route) => (
                                    <option key={route.id} value={route.id}>{route.name}</option>
                                ))
                            }
                        </select>
                    </div>
                    <button type="button" onClick={handleStartTripClick}>Iniciar</button>
                </div>
            </div>
            <div id="map" style={{ height: '100%', width: '100%' }} ref={mapContainerRef}></div>
        </div>
    );
};
export default DriverPage;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
