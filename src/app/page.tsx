"use client"

import { MapRoute } from "@/components/ui/map";
import RouteMap from "./RouteMap";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ROUTE_COLORS = [
    "#6366f1",
    "#22c55e",
    "#f97316",
    "#ed5e5e",
    "#06b6d4",
    "#0f12a0",
    "#065924",
    "#451f05",
    "#830a0a",
    "#1b5d68",
];

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

interface Address {
    Index: number;
    MainAddress: string;
    Latitude: number,
    Longitude: number
}

interface Order {
    Id: string;
    Addresses: Address[],
    PriceInfo: {
        PriceString: string
    }
}

export default function Home() {
    const [log, setLog] = useState<JSON | any>();
    const [ping, setPing] = useState<number>(1000);
    const [orders, setOrders] = useState<RoutePair[]>([]);

    const scan = useCallback(async () => {
        let startPfm = performance.now();
        let fetchRes = await fetch("https://taxsee.ean.vn/orders.php");
        let res: Order[] = await fetchRes.json();
        setPing(Math.floor(performance.now() - startPfm));

        if (res.length == 0) {
            setLog("Not found");
            setOrders([]);
            return;
        }

        const newOrders: RoutePair[] = [];

        res.map((o: Order) => {
            if (o.Addresses.length > 2)
                return;

            newOrders.push({
                id: o.Id.toString(),
                color: ROUTE_COLORS[parseInt(o.Id.toString().slice(-1))],
                start: {
                    name: o.PriceInfo.PriceString,
                    lat: o.Addresses[0].Latitude,
                    lng: o.Addresses[0].Longitude
                },
                end: {
                    name: "",
                    lat: o.Addresses[1].Latitude,
                    lng: o.Addresses[1].Longitude
                },
                routes: [],
                selectedIndex: 0
            });
        });

        setLog(newOrders.length)

        if (newOrders != orders) {
            setOrders(newOrders);
        }
    }, []);

    useEffect(() => {
        // setInterval(() => {
        //     scan();
        // }, 1000);
        const sleep = (ms: number) =>
            new Promise(resolve => setTimeout(resolve, ms));

        const scanJob = async () => {
            while (true) {
                await scan();
                await sleep(((ping / 2) < 1000 ? 1000 : (ping / 2)));
            }
        }

        scanJob();
    }, []);

    return (
        <>
            <div>
                <p className={`z-2 absolute top-5 right-10 text-${ping <= 2000 ? `green` : (ping <= 6000 ? `blue` : `red`)}-500`}>{ping} m/s</p>
                <p className="z-1 absolute bottom-0">LOG: {JSON.stringify(log)}</p>
                {/* <Button onClick={() => {
                    scan();
                }}>SCAN</Button> */}
                <RouteMap orders={orders} />
            </div>
        </>
    );
}