"use client"
import { useEffect, useState, Suspense } from "react";
import Loader from "@/app/loding";
import { usePathname } from "next/navigation";
import axios from "axios";
import HoldingPageCard from "@/components/HoldingPageCard";
import SoldStockCard from "@/components/SoldStockCard";

export interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
    change?: string | number;
}

interface HoldingData {
    uniqueid: number;
    quantity: { $numberDecimal: string };
    price: { $numberDecimal: string };
    actiontype: string;
    symbol: string;
    __v: number;
}

const Investment = () => {
    const [cryptoData, setCryptoData] = useState<Map<string, CryptoData>>(new Map());
    const [holdingsData, setHoldingsData] = useState<HoldingData[]>([]); 
    const [loaded, setLoaded] = useState<boolean>(false);
    const paths = usePathname();
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        const wsURL = 'wss://fstream.binance.com/ws/btcusdt@kline_1m';
        const newWs = new WebSocket(wsURL);
        setWs(newWs);

        newWs.onopen = () => {
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
                newWs.send(JSON.stringify({
                    method: 'SUBSCRIBE',
                    params: [`${symbol}`],
                    id: 1,
                }));
            });
        };

        newWs.onmessage = (event) => {
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

        newWs.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            newWs.close();
        };
    }, [paths]);

    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                const response = await axios.get("/api/investment");
                setHoldingsData(response.data);
            } catch (error) {
                console.error("Error fetching holdings:", error);
            }
        };

        fetchHoldings();

    }, []);

    const calculateHoldingInvestment = () => {
        let totalInvestment = 0;
        holdingsData.filter(holding => holding.actiontype === "hold").forEach(holding => {
            const totalPrice = parseFloat(holding.price.$numberDecimal);
            const totalQuantity = parseFloat(holding.quantity.$numberDecimal);
            totalInvestment += totalPrice * totalQuantity;
        });
        return totalInvestment.toFixed(2);
    };

    const calculateCurrentValue = () => {
        let currentValue = 0;
        holdingsData.filter(holding => holding.actiontype === "hold").forEach(holding => {
            const symbol = holding.symbol.toUpperCase() + "usdt";
            const crypto = cryptoData.get(symbol.toLowerCase());
            if (crypto) {
                const price = parseFloat(crypto.price as string);
                const totalQuantity = parseFloat(holding.quantity.$numberDecimal);
                currentValue += price * totalQuantity;
            }
        });
        return currentValue.toFixed(2);
    };

    const cryptoDataArray: CryptoData[] = Array.from(cryptoData.values());
    return (
        <Suspense fallback={<Loader />}>
            <h1 className="pagetitle  py-3 px-5 md:px-0 mb-10 md:mb-0">Investment</h1>
            <div className="md:grid md:grid-cols-5 md:gap-10 flex flex-col-reverse">
                <div className="col-span-3 px-5 md:px-0 mt-10 flex flex-col gap-10">
                    {loaded ? (
                        <>
                            <HoldingPageCard holdingsData={holdingsData} cryptoData={cryptoDataArray} />
                            <SoldStockCard holdingsData={holdingsData} cryptoData={cryptoDataArray} />
                        </>
                    ) : (
                        <Loader />
                    )}
                </div>
                <div className="w-[100%] col-span-2 md:pl-20 px-5">
                    <h1 className="text-black font-medium text-2xl tracking-widest mb-10">Investment</h1>
                    {loaded ? (
                        <>
                            <div className="flex justify-between bg-white shadow-[0_0_3px_1px_#ddd] w-[100%] py-5 px-5 rounded-lg">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-2xl font-semibold">${calculateHoldingInvestment()}</h2>
                                    <h4 className="text-gray-500">Holding Investment</h4>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-2xl font-semibold">${calculateCurrentValue()}</h2>
                                    <h4 className="text-gray-500">Current Value</h4>
                                </div>
                            </div>
                        </>
                    ) : (
                        <h1 className="text-xl text-center">Loading...</h1>
                    )}


                </div>
            </div>
        </Suspense>
    );
};

export default Investment;
