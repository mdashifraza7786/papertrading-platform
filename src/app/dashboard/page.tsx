"use client"
import { useEffect, useState, useRef, Suspense } from "react";
import Loader from "@/app/loding";
import HoldingStock from "@/components/HoldingStock";
import Stocks, { CryptoData as StocksCryptoData } from "@/components/Stocks";
import { usePathname } from "next/navigation";
import axios from "axios";
import Link from "next/link";

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
    const [ws, setWs] = useState<WebSocket | null>(null); // State to hold the WebSocket instance

    // Use a ref to track the last update time for each symbol
    const lastUpdateTimes = useRef<Record<string, number>>({});
    // Use a ref to track if we've initialized the data
    const isInitialized = useRef(false);

    useEffect(() => {
        // Define the initial crypto list
            const initialCryptoList: CryptoData[] = [
                { id: 1, name: "Bitcoin", symbol: "BTC", price: null },
                { id: 2, name: "Ethereum", symbol: "ETH", price: null },
                { id: 3, name: "Ripple", symbol: "XRP", price: null },
                { id: 4, name: "Litecoin", symbol: "LTC", price: null },
                { id: 5, name: "Cardano", symbol: "ADA", price: null },
            // Reduce the number of connections to prevent errors
            // { id: 6, name: "Polkadot", symbol: "DOT", price: null },
            // { id: 7, name: "Bitcoin Cash", symbol: "BCH", price: null },
            // { id: 8, name: "Chainlink", symbol: "LINK", price: null },
            // { id: 9, name: "Stellar", symbol: "XLM", price: null },
        ];
        
        // Initialize crypto data with the initial list if not already initialized
        if (!isInitialized.current) {
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
            isInitialized.current = true;
        }
        
        // Use a combined WebSocket connection instead of multiple connections
        // Binance allows subscribing to multiple streams in one connection
        const wsURL = 'wss://fstream.binance.com/ws';
        const newWs = new WebSocket(wsURL);
        setWs(newWs);
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
            if (newWs.readyState !== WebSocket.OPEN) {
                console.warn('WebSocket connection timeout');
                setLoaded(true); // Show UI even if connection fails
                // Fall back to REST API
                fetchPricesViaREST(initialCryptoList);
            }
        }, 5000);
        
        newWs.onopen = () => {
            clearTimeout(connectionTimeout);
            setLoaded(true);
            
            // Create a list of symbols to subscribe to
            const symbols = initialCryptoList.map(crypto => `${crypto.symbol.toLowerCase()}usdt@kline_1m`);

            // Subscribe to all symbols in a single message
                newWs.send(JSON.stringify({
                    method: 'SUBSCRIBE',
                params: symbols,
                    id: 1,
                }));
        };
        
        // Throttle updates to prevent UI flickering
        const updateThrottleMs = 2000; // Update UI at most once every 2 seconds

        newWs.onmessage = (event) => {
            try {
            const message = JSON.parse(event.data);

                // Handle subscription response
                if (message.result === undefined && message.k && message.k.c) {
                const symbol = message.s.toLowerCase();
                const price = parseFloat(message.k.c);
                    const now = Date.now();
                    
                    // Only update if enough time has passed since last update for this symbol
                    if (!lastUpdateTimes.current[symbol] || now - lastUpdateTimes.current[symbol] > updateThrottleMs) {
                        lastUpdateTimes.current[symbol] = now;

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
                }
            } catch (err) {
                console.error('Error processing WebSocket message:', err);
            }
        };

        // Handle WebSocket errors gracefully
        newWs.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Fall back to REST API
            fetchPricesViaREST(initialCryptoList);
        };
        
        // Handle WebSocket closure gracefully
        newWs.onclose = () => {
            console.log('WebSocket connection closed');
            // Fall back to REST API
            fetchPricesViaREST(initialCryptoList);
        };
        
        // Fallback function to fetch prices via REST API
        const fetchPricesViaREST = async (cryptoList: CryptoData[]) => {
            try {
                // Fetch prices for each crypto in the list
                const promises = cryptoList.map(async (crypto) => {
                    const symbol = `${crypto.symbol}USDT`;
                    try {
                        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
                        if (response.ok) {
                            const data = await response.json();
                            return {
                                symbol: crypto.symbol.toLowerCase() + 'usdt',
                                price: parseFloat(data.price).toFixed(2),
                                id: crypto.id,
                                name: crypto.name
                            };
                        }
                    } catch (err) {
                        console.error(`Error fetching price for ${symbol}:`, err);
                    }
                    return null;
                });
                
                // Wait for all requests to complete
                const results = await Promise.all(promises);
                
                // Update crypto data with the results
                setCryptoData(prevCryptoData => {
                    const updatedCryptoData = new Map(prevCryptoData);
                    
                    results.forEach(result => {
                        if (result) {
                            updatedCryptoData.set(result.symbol, {
                                id: result.id,
                                name: result.name,
                                symbol: result.symbol,
                                price: result.price,
                            });
                        }
                    });
                    
                    return updatedCryptoData;
                });
            } catch (err) {
                console.error('Error fetching prices via REST:', err);
            }
        };
        
        // Clean up function
        return () => {
            clearTimeout(connectionTimeout);
            if (newWs.readyState === WebSocket.OPEN || newWs.readyState === WebSocket.CONNECTING) {
            newWs.close();
            }
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
            const symbol = holding.symbol.toUpperCase() + "usdt";
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

    // Calculate profit/loss percentage
    const calculateProfitLossPercentage = () => {
        const investment = parseFloat(calculateTotalInvestment());
        const currentValue = parseFloat(calculateCurrentValue());
        if (investment === 0) return 0;
        return ((currentValue - investment) / investment) * 100;
    };

    const profitLossPercentage = calculateProfitLossPercentage();
    const isProfitable = profitLossPercentage >= 0;

    return (
        <Suspense fallback={<Loader />}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <h1 className="pagetitle">Dashboard</h1>
                    <div className="mt-4 md:mt-0">
                        {loaded && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Last updated:</span>
                                <span className="text-sm font-medium">{new Date().toLocaleTimeString()}</span>
                                <button className="p-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Investment Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-700">Total Investment</h2>
                            <div className="p-2 bg-green-50 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        {loaded ? (
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">${calculateTotalInvestment()}</h3>
                                <p className="text-sm text-gray-500 mt-1">Initial capital invested</p>
                            </div>
                        ) : (
                            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                        )}
                    </div>
                    
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-700">Current Value</h2>
                            <div className="p-2 bg-blue-50 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                </svg>
                            </div>
                        </div>
                        {loaded ? (
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">${calculateCurrentValue()}</h3>
                                <p className="text-sm text-gray-500 mt-1">Live portfolio valuation</p>
                            </div>
                        ) : (
                            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                        )}
                    </div>
                    
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-700">Profit/Loss</h2>
                            <div className={`p-2 ${isProfitable ? 'bg-green-50' : 'bg-red-50'} rounded-full`}>
                                <svg className={`w-6 h-6 ${isProfitable ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isProfitable 
                                        ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                                        : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}>
                                    </path>
                                </svg>
                            </div>
                        </div>
                        {loaded ? (
                            <div>
                                <div className="flex items-baseline">
                                    <h3 className={`text-3xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                        {isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                                    </h3>
                                    <span className="ml-2 text-gray-500">
                                        (${(parseFloat(calculateCurrentValue()) - parseFloat(calculateTotalInvestment())).toFixed(2)})
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Overall performance</p>
                            </div>
                        ) : (
                            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Holdings Section */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Your Holdings</h2>
                                <Link href="/investment" className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center">
                                    View All
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </Link>
                            </div>
                            
                    {loaded ? (
                                holdingsData.length > 0 ? (
                                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                                        <HoldingStock holdingsData={holdingsData} cryptoData={cryptoDataArray} />
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No holdings yet</h3>
                                        <p className="text-gray-500 mb-4">Start investing to build your portfolio</p>
                                        <Link href="/market/BTC" className="button-primary inline-flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                            </svg>
                                            Start Trading
                                        </Link>
                                    </div>
                                )
                            ) : (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                </div>
                            )}
                        </section>
                        
                        {/* Market Overview */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Market Overview</h2>
                                <div className="flex items-center space-x-2">
                                    <button className="p-1.5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                                        </svg>
                                    </button>
                                    <button className="p-1.5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {loaded ? (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                                    <Stocks data={cryptoDataArray as StocksCryptoData[]} />
                                </div>
                            ) : (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                </div>
                            )}
                        </section>
                    </div>
                    
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Quick Actions */}
                        <div className="card p-6 mb-8">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
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
                                
                                <Link href="/investment" className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-blue-50 rounded-full mr-3">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">View Portfolio</h3>
                                        <p className="text-sm text-gray-500">Check your investments</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                        
                        {/* Top Performers */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Performers</h2>
                            {loaded ? (
                                <div className="space-y-4">
                                    {cryptoDataArray.slice(0, 3).map((crypto, index) => (
                                        <Link key={crypto.id} href={`/market/${crypto.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-mono text-sm">
                                                    {crypto.symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{crypto.name}</h3>
                                                    <p className="text-sm text-gray-500">{crypto.symbol}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">${typeof crypto.price === 'number' ? crypto.price.toFixed(2) : crypto.price}</div>
                                                {crypto.change && (
                                                    <div className={`text-sm ${parseFloat(crypto.change as string) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {parseFloat(crypto.change as string) >= 0 ? '+' : ''}{crypto.change}%
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-12 bg-gray-200 rounded"></div>
                                    <div className="h-12 bg-gray-200 rounded"></div>
                                    <div className="h-12 bg-gray-200 rounded"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>
    );
};

export default Dashboard;
