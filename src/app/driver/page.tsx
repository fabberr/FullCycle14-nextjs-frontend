'use client';

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
    }, [currentRoute]);
    
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
     * @param sleepSeconds Number of seconds between each update. Optional, 2.5 
     *                     seconds by default.
    */
    const simulateTravelOnCurrentRoute = async (sleepSeconds: number = 2.5) => {
        if (!currentRoute) {
            console.error('Erro ao renderizar rota.', 'Nenhuma Rota selecionada.');
            return;
        }

        const ms = (sleepSeconds / 2) * 1000;
        for (const leg of currentRoute.directions.routes.at(0)?.legs ?? []) {
            for (const step of leg?.steps ?? []) {
                await sleep(ms);
                map?.moveCar(currentRoute.id, step.start_location);

                await sleep(ms);
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
            simulateTravelOnCurrentRoute();
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
