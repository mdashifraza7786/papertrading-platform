"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react";

export interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
    change?: string | number;
}

interface WebSocketContextType {
    cryptoData: Map<string, CryptoData>;
    loaded: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
    cryptoData: new Map(),
    loaded: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [cryptoData, setCryptoData] = useState<Map<string, CryptoData>>(new Map());
    const [loaded, setLoaded] = useState(false);
    const lastUpdateTimes = useRef<Record<string, number>>({});
    const isInitialized = useRef(false);

    const initialCryptoList: CryptoData[] = [
        { id: 1, name: "Bitcoin", symbol: "BTC", price: null },
        { id: 2, name: "Ethereum", symbol: "ETH", price: null },
        { id: 3, name: "Ripple", symbol: "XRP", price: null },
        { id: 4, name: "Litecoin", symbol: "LTC", price: null },
        { id: 5, name: "Cardano", symbol: "ADA", price: null },
        { id: 6, name: "Polkadot", symbol: "DOT", price: null },
        { id: 7, name: "Solana", symbol: "SOL", price: null },
        { id: 8, name: "Chainlink", symbol: "LINK", price: null },
        { id: 9, name: "Avalanche", symbol: "AVAX", price: null },
        { id: 10, name: "Bitcoin Cash", symbol: "BCH", price: null },
    ];

    useEffect(() => {
        if (!isInitialized.current) {
            const initialMap = new Map<string, CryptoData>();
            initialCryptoList.forEach((crypto) => {
                initialMap.set(`${crypto.symbol.toLowerCase()}usdt`, {
                    id: crypto.id,
                    name: crypto.name,
                    symbol: `${crypto.symbol.toLowerCase()}usdt`,
                    price: null,
                });
            });
            setCryptoData(initialMap);
            isInitialized.current = true;
        }

        const wsURL = "wss://fstream.binance.com/market/ws";
        const ws = new WebSocket(wsURL);

        const connectionTimeout = setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                setLoaded(true);
                fetchPricesViaREST();
            }
        }, 5000);

        ws.onopen = () => {
            clearTimeout(connectionTimeout);
            setLoaded(true);
            const symbols = initialCryptoList.map((crypto) => `${crypto.symbol.toLowerCase()}usdt@kline_1m`);
            ws.send(JSON.stringify({ method: "SUBSCRIBE", params: symbols, id: 1 }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.result === undefined && message.k && message.k.c) {
                    const symbol = message.s.toLowerCase();
                    const price = parseFloat(message.k.c);
                    const now = Date.now();

                    if (!lastUpdateTimes.current[symbol] || now - lastUpdateTimes.current[symbol] > 2000) {
                        lastUpdateTimes.current[symbol] = now;
                        setCryptoData((prev) => {
                            const updated = new Map(prev);
                            if (updated.has(symbol)) {
                                const existing = updated.get(symbol)!;
                                updated.set(symbol, { ...existing, price: price.toFixed(2) });
                            }
                            return updated;
                        });
                    }
                }
            } catch (err) {
                console.error("WebSocket error:", err);
            }
        };

        ws.onerror = () => fetchPricesViaREST();
        ws.onclose = () => fetchPricesViaREST();

        const fetchPricesViaREST = async () => {
            try {
                const promises = initialCryptoList.map(async (crypto) => {
                    const symbol = `${crypto.symbol}USDT`;
                    try {
                        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
                        if (response.ok) {
                            const data = await response.json();
                            return { symbol: crypto.symbol.toLowerCase() + "usdt", price: parseFloat(data.price).toFixed(2), id: crypto.id, name: crypto.name };
                        }
                    } catch {}
                    return null;
                });

                const results = await Promise.all(promises);
                setCryptoData((prev) => {
                    const updated = new Map(prev);
                    results.forEach((result) => {
                        if (result) {
                            updated.set(result.symbol, { id: result.id, name: result.name, symbol: result.symbol, price: result.price });
                        }
                    });
                    return updated;
                });
            } catch {}
        };

        return () => {
            clearTimeout(connectionTimeout);
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ cryptoData, loaded }}>
            {children}
        </WebSocketContext.Provider>
    );
};
