"use client"
import { useEffect, useState, Suspense } from "react";
import Loader from "@/app/loding";
import axios from "axios";
import { usePathname } from "next/navigation";
import InvestmentSummary from "@/components/investment/InvestmentSummary";
import HoldingsList from "@/components/investment/HoldingsList";
import TransactionHistory from "@/components/investment/TransactionHistory";
import Link from "next/link";

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
    sellat?: { $numberDecimal: string };
    __v: number;
}

const Investment = () => {
    const [cryptoData, setCryptoData] = useState<Map<string, CryptoData>>(new Map());
    const [holdingsData, setHoldingsData] = useState<HoldingData[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const pathname = usePathname();
    const [refreshKey, setRefreshKey] = useState<number>(0);

    useEffect(() => {
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

        const initialMap = new Map<string, CryptoData>();
        initialCryptoList.forEach(crypto => {
            initialMap.set(`${crypto.symbol.toLowerCase()}usdt`, {
                id: crypto.id,
                name: crypto.name,
                symbol: `${crypto.symbol.toLowerCase()}usdt`,
                price: null
            });
        });
        setCryptoData(initialMap);

        const wsURL = 'wss://fstream.binance.com/ws';
        const newWs = new WebSocket(wsURL);
        setWs(newWs);

        const connectionTimeout = setTimeout(() => {
            if (newWs.readyState !== WebSocket.OPEN) {
                console.warn('WebSocket connection timeout');
                setLoaded(true);
            }
        }, 5000);

        newWs.onopen = () => {
            clearTimeout(connectionTimeout);
            setLoaded(true);

            const symbols = initialCryptoList.map(crypto => `${crypto.symbol.toLowerCase()}usdt@kline_1m`);
            newWs.send(JSON.stringify({
                method: 'SUBSCRIBE',
                params: symbols,
                id: 1,
            }));
        };

        newWs.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.result === undefined && message.k && message.k.c) {
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
            } catch (err) {
                console.error('Error processing WebSocket message:', err);
            }
        };

        newWs.onerror = (error) => {
            console.error('WebSocket error:', error);
            setLoaded(true);
        };

        newWs.onclose = () => {
            console.log('WebSocket connection closed');
            setLoaded(true);
        };

        return () => {
            clearTimeout(connectionTimeout);
            if (newWs.readyState === WebSocket.OPEN || newWs.readyState === WebSocket.CONNECTING) {
                newWs.close();
            }
        };
    }, [pathname]);

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
    }, [refreshKey]); 

    const refreshHoldings = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };

    const calculateHoldingInvestment = () => {
        let totalInvestment = 0;
        holdingsData.filter(holding => holding.actiontype === "hold").forEach(holding => {
            const price = parseFloat(holding.price.$numberDecimal);
            const quantity = parseFloat(holding.quantity.$numberDecimal);
            totalInvestment += price * quantity;
        });
        return totalInvestment.toFixed(2);
    };

    const calculateCurrentValue = () => {
        let currentValue = 0;
        holdingsData.filter(holding => holding.actiontype === "hold").forEach(holding => {
            const symbol = holding.symbol.toLowerCase() + "usdt";
            const crypto = cryptoData.get(symbol);
            if (crypto && crypto.price) {
                const price = parseFloat(crypto.price as string);
                const quantity = parseFloat(holding.quantity.$numberDecimal);
                currentValue += price * quantity;
            }
        });
        return currentValue.toFixed(2);
    };

    const cryptoDataArray: CryptoData[] = Array.from(cryptoData.values());

    return (
        <Suspense fallback={<Loader />}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <h1 className="pagetitle">Investment Portfolio</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <HoldingsList
                            holdingsData={holdingsData}
                            cryptoData={cryptoDataArray}
                            loaded={loaded}
                        />

                        <TransactionHistory
                            holdingsData={holdingsData}
                            cryptoData={cryptoDataArray}
                            loaded={loaded}
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <InvestmentSummary
                            holdingInvestment={calculateHoldingInvestment()}
                            currentValue={calculateCurrentValue()}
                            loaded={loaded}
                        />

                        <div className="card p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <Link href="/market/BTC" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-green-50 rounded-full mr-3">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Buy Crypto</h3>
                                        <p className="text-sm text-gray-500">Invest in cryptocurrencies</p>
                                    </div>
                                </Link>

                                <Link href="/dashboard" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-blue-50 rounded-full mr-3">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Dashboard</h3>
                                        <p className="text-sm text-gray-500">View your portfolio overview</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>
    );
};

export default Investment;