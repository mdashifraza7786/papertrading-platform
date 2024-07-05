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
    const paths = usePathname();

    useEffect(() => {
        const wsURL = 'wss://fstream.binance.com/ws/btcusdt@kline_1m';
        const ws = new WebSocket(wsURL);

        ws.onopen = () => {
            setLoaded(true);
            const initialCryptoList: CryptoData[] = [
                { id: 1, name: "Bitcoin", symbol: "BTC", price: null },
                { id: 2, name: "Ethereum", symbol: "ETH", price: null },
                { id: 3, name: "Ripple", symbol: "XRP", price: null },
                { id: 4, name: "Litecoin", symbol: "LTC", price: null },
                { id: 5, name: "Cardano", symbol: "ADA", price: null },
                { id: 6, name: "Polkadot", symbol: "DOT", price: null },
                { id: 7, name: "Bitcoin Cash", symbol: "BCH", price: null },
                { id: 8, name: "Chainlink", symbol: "LINK", price: null },
                { id: 9, name: "Stellar", symbol: "XLM", price: null },
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

    const calculateTotalInvestment = () => {
        let totalInvestment = 0;
        holdingsData.forEach(holding => {
            const totalPrice = parseFloat(holding.totalPrice.$numberDecimal);
            totalInvestment += totalPrice;
        });
        return totalInvestment.toFixed(2);
    };

    const calculateCurrentValue = () => {
        let currentValue = 0;
        holdingsData.forEach(holding => {
            const symbol = holding.symbol.toUpperCase()+"usdt";
            const crypto = cryptoData.get(symbol.toLowerCase());
            if (crypto) {
                const price = parseFloat(crypto.price as string);
                const totalQuantity = parseFloat(holding.totalQuantity.$numberDecimal);
                currentValue += price * totalQuantity;
            }
        });
        return currentValue.toFixed(2);
    };

    const cryptoDataArray: CryptoData[] = Array.from(cryptoData.values());

    return (
        <Suspense fallback={<Loader />}>
            <h1 className="pagetitle">Dashboard</h1>
            <div className="grid grid-cols-5 gap-10">
                <div className="col-span-3 mt-10 flex flex-col gap-10">
                    {loaded ? (
                        <>
                            <HoldingStock holdingsData={holdingsData} cryptoData={cryptoDataArray} />
                            <Stocks data={cryptoDataArray as StocksCryptoData[]} />
                        </>
                    ) : (
                        <Loader />
                    )}
                </div>
                <div className="w-[100%] col-span-2 pl-20">
                    <div className="flex justify-between bg-white shadow-[0_0_3px_1px_#ddd] w-[100%] py-5 px-5 rounded-lg">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-semibold">${calculateTotalInvestment()}</h2>
                            <h4 className="text-gray-500">Total Investment</h4>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-semibold">${calculateCurrentValue()}</h2>
                            <h4 className="text-gray-500">Current Value</h4>
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>
    );
};

export default Dashboard;
