"use client"
import { useEffect, useState, Suspense } from "react";
import Loader from "@/app/loding";
import HoldingStock from "@/components/HoldingStock";
import Stocks, { CryptoData as StocksCryptoData } from "@/components/Stocks";
import { usePathname } from "next/navigation";
import axios from "axios";

export interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
    change?: string | number;
}

const Dashboard = () => {
    const [cryptoData, setCryptoData] = useState<Map<string, CryptoData>>(new Map());
    const [holdingsData, setHoldingsData] = useState<any[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const paths = usePathname()
    useEffect(() => {
        const wsURL = 'wss://fstream.binance.com/ws/btcusdt@kline_1m';
        const ws = new WebSocket(wsURL);

        ws.onopen = () => {
            setLoaded(true);
            const initialCryptoList: CryptoData[] = [
                { id: 1, name: "Bitcoin", symbol: "BTC", price: null },
                { id: 2, name: "Ethereum", symbol: "ETH", price: null },
            ];

            const symbols = initialCryptoList.map(crypto => `${crypto.symbol.toLowerCase()}usdt@kline_1m`);

            symbols.forEach(symbol => {
                ws.send(JSON.stringify({
                    method: 'SUBSCRIBE',
                    params: [`${symbol}`],
                    id: 1,
                }));
            });
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message && message.k && message.k.c) {
                const symbol = message.s.toLowerCase();
                const price = parseFloat(message.k.c);

                setCryptoData(prevCryptoData => {
                    const updatedCryptoData = new Map(prevCryptoData);

                    if (updatedCryptoData.has(symbol)) {
                        const existingData = updatedCryptoData.get(symbol)!;
                        updatedCryptoData.set(symbol, {
                            ...existingData,
                            price: price.toFixed(2),
                        });
                    } else {
                        updatedCryptoData.set(symbol, {
                            id: prevCryptoData.size + 1,
                            name: symbol.toUpperCase(),
                            symbol: symbol,
                            price: price.toFixed(2),
                        });
                    }

                    return updatedCryptoData;
                });
            }
        };



        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        

        return () => {
            ws.close();
        };
    }, []);
    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                const response = await axios.get("/api/getHoldings");
                setHoldingsData(response.data);
            } catch (error) {
                console.error("Error fetching holdings:", error);
            }
        };

        fetchHoldings();
        
    }, []);
   
    const cryptoDataArray: CryptoData[] = Array.from(cryptoData.values());


    return (
        <Suspense fallback={<Loader />}>
            <h1 className="pagetitle">Dashboard</h1>
            <div className="grid grid-cols-5">
                <div className="col-span-3 mt-10 flex flex-col gap-10">
                    {loaded ? (
                        <>
                             <HoldingStock holdingsData={holdingsData} cryptoData={cryptoDataArray} />
                            <Stocks data={cryptoDataArray as StocksCryptoData[]} />
                        </>
                    ):(
                        <Loader/>
                    )}

                </div>
            </div>
        </Suspense>
    );
};

export default Dashboard;
