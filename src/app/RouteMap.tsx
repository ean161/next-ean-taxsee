"use client";

import { useEffect, useState, Fragment, useRef } from "react";
import {
  Map as MapView,
  MapMarker,
  MarkerContent,
  MapRoute,
  MarkerLabel,
} from "@/components/ui/map";
import { Loader2, Clock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ===================== TYPES ===================== */

interface Point {
  name: string;
  lat: number;
  lng: number;
}

interface RouteData {
  coordinates: [number, number][];
  duration: number; // seconds
  distance: number; // meters
}

interface RoutePair {
  id: string;
  color: string;
  start: Point;
  end: Point;
  routes: RouteData[];
  selectedIndex: number;
}

/* ===================== HELPERS ===================== */

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function RouteMap({ orders }: {
  orders: RoutePair[]
}) {
  const [pairs, setPairs] = useState<RoutePair[]>(orders);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCache = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    setPairs(orders);
  }, [orders]);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const updated = await Promise.all(
          pairs.map(async (pair) => {
            const url = `https://router.project-osrm.org/route/v1/driving/${pair.start.lng},${pair.start.lat};${pair.end.lng},${pair.end.lat}?overview=full&geometries=geojson&alternatives=true`;

            console.log(url);
            // return;


            var data;
            if (fetchCache.current.has(url)) {
              console.log("Use cache fetch", url);
              data = fetchCache.current.get(url);
            } else {
              console.log("Add cache fetch", url);
              const res = await fetch(url);
              data = await res.json();
              fetchCache.current.set(url, data);
            }

            const routes: RouteData[] =
              data.routes?.map((r: any) => ({
                coordinates: r.geometry.coordinates,
                duration: r.duration,
                distance: r.distance,
              })) ?? [];

            return { ...pair, routes };
          })
        );

        setPairs(updated);
      } catch (e) {
        console.error("OSRM fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoutes();
  }, [pairs]);

  return (
    <div className="h-[800px] w-full relative">
      <MapView center={[105.766412, 10.02667]} zoom={12.3}>
        {/* ===== ROUTES ===== */}
        {pairs.map((pair) =>
          pair.routes.map((route, index) => {
            const isSelected = index === pair.selectedIndex;

            if (index != pair.selectedIndex) {
              return;
            }

            return (
              <MapRoute
                key={`${pair.id}-${index}`}
                coordinates={route.coordinates}
                color={pair.color}
                width={isSelected ? 7 : 4}
                opacity={isSelected ? 1 : 0.35}
                onClick={() =>
                  setPairs((prev) =>
                    prev.map((p) =>
                      p.id === pair.id
                        ? { ...p, selectedIndex: index }
                        : p
                    )
                  )
                }
              />
            );
          })
        )}

        {pairs.map((pair) => (
          <Fragment key={pair.id}>
            <MapMarker
              longitude={pair.start.lng}
              latitude={pair.start.lat}
            >
              <MarkerContent>
                <div
                  className="size-5 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: "blue" }}
                />
                <MarkerLabel position="top">
                  {pair.start.name}
                </MarkerLabel>
              </MarkerContent>
            </MapMarker>

            <MapMarker longitude={pair.end.lng} latitude={pair.end.lat}>
              <MarkerContent>
                <div
                  className="size-5 rounded-full border-2 border-white shadow-lg opacity-90"
                  style={{ backgroundColor: "grey" }}
                />
                <MarkerLabel position="bottom">
                  {pair.end.name}
                </MarkerLabel>
              </MarkerContent>
            </MapMarker>
          </Fragment>
        ))}
      </MapView>

      <div className="absolute top-3 left-3 flex flex-col gap-3">
        {pairs.map((pair) =>
          pair.routes.map((route, index) => {
            const isActive = index === pair.selectedIndex;
            if (!isActive) {
              return;
            }

            return (
              <Button
                key={`${pair.id}-btn-${index}`}
                size="sm"
                variant="secondary"
                className="justify-start gap-3"
                onClick={() =>
                  setPairs((prev) =>
                    prev.map((p) =>
                      p.id === pair.id
                        ? { ...p, selectedIndex: index }
                        : p
                    )
                  )
                }
              >
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: pair.color }}
                />

                <span className="text-xs font-semibold">
                  {pair.start.name} → {pair.end.name}
                </span>

                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {formatDuration(route.duration)}
                </div>

                <div className="flex items-center gap-1.5 text-xs opacity-80">
                  <Route className="size-3" />
                  {formatDistance(route.distance)}
                </div>
              </Button>
            );
          })
        )}
      </div>

      {/* ===== LOADING ===== */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
