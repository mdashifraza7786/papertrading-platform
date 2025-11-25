"use client"

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import { getCryptoName } from "@/util/getCryptoName";

export interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
    change?: string | number;
}

interface HoldingData {
    symbol: string;
    totalQuantity: { $numberDecimal: string };
    totalPrice: { $numberDecimal: string };
}

const Dashboard = () => {
    const [cryptoData, setCryptoData] = useState<Map<string, CryptoData>>(new Map());
    const [holdingsData, setHoldingsData] = useState<HoldingData[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number>(0);
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

        const wsURL = "wss://fstream.binance.com/ws";
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

    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                const response = await axios.get("/api/getHoldings");
                setHoldingsData(response.data);
            } catch {}
        };

        const fetchWallet = async () => {
            try {
                const response = await axios.get("/api/getWallet");
                setWalletBalance(response.data);
            } catch {}
        };

        fetchHoldings();
        fetchWallet();
    }, []);

    const calculateTotalInvestment = () => {
        return holdingsData.reduce((sum, h) => sum + parseFloat(h.totalPrice.$numberDecimal), 0);
    };

    const calculateCurrentValue = () => {
        return holdingsData.reduce((sum, h) => {
            const symbol = h.symbol.toLowerCase() + "usdt";
            const crypto = cryptoData.get(symbol);
            if (crypto && crypto.price) {
                return sum + parseFloat(crypto.price as string) * parseFloat(h.totalQuantity.$numberDecimal);
            }
            return sum;
        }, 0);
    };

    const totalInvestment = calculateTotalInvestment();
    const currentValue = calculateCurrentValue();
    const profitLoss = currentValue - totalInvestment;
    const profitLossPercent = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;
    const isProfitable = profitLoss >= 0;
    const cryptoDataArray = Array.from(cryptoData.values());

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary mt-1">Welcome back! Here&apos;s your portfolio overview.</p>
                </div>
                <div className="flex items-center gap-2 text-text-muted text-sm">
                    <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                    <span>Live</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Portfolio Value"
                    value={`$${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue={`${isProfitable ? "+" : ""}${profitLossPercent.toFixed(2)}% all time`}
                    subValueColor={isProfitable ? "profit" : "loss"}
                    icon={<TrendingIcon />}
                    loaded={loaded}
                />
                <StatCard
                    label="Total Investment"
                    value={`$${totalInvestment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue="Capital deployed"
                    icon={<WalletIcon />}
                    loaded={loaded}
                />
                <StatCard
                    label="Profit / Loss"
                    value={`${isProfitable ? "+" : ""}$${Math.abs(profitLoss).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue={`${isProfitable ? "+" : ""}${profitLossPercent.toFixed(2)}%`}
                    subValueColor={isProfitable ? "profit" : "loss"}
                    valueColor={isProfitable ? "profit" : "loss"}
                    icon={isProfitable ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    iconColor={isProfitable ? "profit" : "loss"}
                    loaded={loaded}
                />
                <StatCard
                    label="Available Balance"
                    value={`$${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue="Ready to invest"
                    icon={<CashIcon />}
                    loaded={loaded}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-title mb-0">Your Holdings</h2>
                            <Link href="/investment" className="text-accent-primary hover:text-accent-glow text-sm font-medium flex items-center gap-1 transition-colors">
                                View All
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        {!loaded ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 skeleton" />
                                ))}
                            </div>
                        ) : holdingsData.length > 0 ? (
                            <div className="space-y-2">
                                {holdingsData.slice(0, 5).map((holding, index) => (
                                    <HoldingRow key={index} holding={holding} cryptoData={cryptoData} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="No holdings yet"
                                description="Start building your portfolio by buying some crypto"
                                actionLabel="Start Trading"
                                actionHref="/market/BTC"
                            />
                        )}
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-title mb-0">Market Overview</h2>
                            <div className="flex items-center gap-2">
                                <button className="btn-icon h-8 w-8">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {!loaded ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-14 skeleton" />
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="table-header">
                                            <th className="text-left py-3 px-4 rounded-l-lg">Asset</th>
                                            <th className="text-right py-3 px-4">Price</th>
                                            <th className="text-right py-3 px-4 rounded-r-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cryptoDataArray.map((crypto) => (
                                            <MarketRow key={crypto.id} crypto={crypto} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h2 className="section-title">Quick Actions</h2>
                        <div className="space-y-2">
                            <Link href="/market/BTC" className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-tertiary transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-profit/10 flex items-center justify-center group-hover:bg-profit/20 transition-colors">
                                    <svg className="w-5 h-5 text-profit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary">Buy Crypto</p>
                                    <p className="text-sm text-text-muted">Invest in top cryptocurrencies</p>
                                </div>
                            </Link>
                            <Link href="/investment" className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-tertiary transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center group-hover:bg-accent-primary/20 transition-colors">
                                    <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary">View Portfolio</p>
                                    <p className="text-sm text-text-muted">Manage your investments</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="section-title">Top Movers</h2>
                        {!loaded ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 skeleton" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cryptoDataArray.slice(0, 4).map((crypto) => (
                                    <Link key={crypto.id} href={`/market/${crypto.symbol.replace("usdt", "").toUpperCase()}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-tertiary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="crypto-icon">{crypto.symbol.replace("usdt", "").toUpperCase().slice(0, 2)}</div>
                                            <div>
                                                <p className="font-medium text-text-primary text-sm">{crypto.name}</p>
                                                <p className="text-xs text-text-muted">{crypto.symbol.replace("usdt", "").toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="price-sm text-text-primary">${crypto.price || "---"}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card bg-gradient-to-br from-accent-primary/10 to-dark-secondary border-accent-primary/20">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-primary mb-1">Paper Trading</h3>
                                <p className="text-sm text-text-secondary">This is a simulated trading environment. No real money is at risk.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({
    label,
    value,
    subValue,
    subValueColor,
    valueColor,
    icon,
    iconColor,
    loaded,
}: {
    label: string;
    value: string;
    subValue: string;
    subValueColor?: "profit" | "loss";
    valueColor?: "profit" | "loss";
    icon: React.ReactNode;
    iconColor?: "profit" | "loss";
    loaded: boolean;
}) => {
    const getValueColorClass = () => {
        if (valueColor === "profit") return "text-profit";
        if (valueColor === "loss") return "text-loss";
        return "text-text-primary";
    };

    const getSubValueColorClass = () => {
        if (subValueColor === "profit") return "text-profit";
        if (subValueColor === "loss") return "text-loss";
        return "text-text-muted";
    };

    const getIconBgClass = () => {
        if (iconColor === "profit") return "bg-profit/10";
        if (iconColor === "loss") return "bg-loss/10";
        return "bg-accent-primary/10";
    };

    const getIconColorClass = () => {
        if (iconColor === "profit") return "text-profit";
        if (iconColor === "loss") return "text-loss";
        return "text-accent-primary";
    };

    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-text-muted text-sm mb-1">{label}</p>
                    {loaded ? (
                        <>
                            <p className={`price-md ${getValueColorClass()}`}>{value}</p>
                            <p className={`text-sm mt-1 ${getSubValueColorClass()}`}>{subValue}</p>
                        </>
                    ) : (
                        <>
                            <div className="h-7 w-32 skeleton mt-1" />
                            <div className="h-4 w-20 skeleton mt-2" />
                        </>
                    )}
                </div>
                <div className={`w-10 h-10 rounded-lg ${getIconBgClass()} flex items-center justify-center ${getIconColorClass()}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const HoldingRow = ({ holding, cryptoData }: { holding: HoldingData; cryptoData: Map<string, CryptoData> }) => {
    const symbol = holding.symbol.toLowerCase() + "usdt";
    const crypto = cryptoData.get(symbol);
    const currentPrice = crypto && crypto.price ? parseFloat(crypto.price as string) : null;
    const quantity = parseFloat(holding.totalQuantity.$numberDecimal);
    const investment = parseFloat(holding.totalPrice.$numberDecimal);
    const currentValue = currentPrice ? currentPrice * quantity : 0;
    const profitLoss = currentValue - investment;
    const profitLossPercent = investment > 0 ? (profitLoss / investment) * 100 : 0;
    const isProfitable = profitLoss >= 0;

    return (
        <Link href={`/market/${holding.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-tertiary transition-colors">
            <div className="flex items-center gap-3">
                <div className="crypto-icon-lg">{holding.symbol.slice(0, 2)}</div>
                <div>
                    <p className="font-medium text-text-primary">{getCryptoName(holding.symbol)}</p>
                    <p className="text-sm text-text-muted">{quantity.toFixed(4)} {holding.symbol}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="price-sm text-text-primary">${currentValue.toFixed(2)}</p>
                <p className={`text-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                    {isProfitable ? "+" : ""}{profitLossPercent.toFixed(2)}%
                </p>
            </div>
        </Link>
    );
};

const MarketRow = ({ crypto }: { crypto: CryptoData }) => {
    const symbolClean = crypto.symbol.replace("usdt", "").toUpperCase();

    return (
        <tr className="table-row">
            <td className="py-3 px-4">
                <Link href={`/market/${symbolClean}`} className="flex items-center gap-3">
                    <div className="crypto-icon">{symbolClean.slice(0, 2)}</div>
                    <div>
                        <p className="font-medium text-text-primary">{crypto.name}</p>
                        <p className="text-xs text-text-muted">{symbolClean}</p>
                    </div>
                </Link>
            </td>
            <td className="py-3 px-4 text-right">
                <span className="price-sm text-text-primary">${crypto.price || "---"}</span>
            </td>
            <td className="py-3 px-4 text-right">
                <Link href={`/market/${symbolClean}`} className="btn-ghost h-8 px-3 text-sm">
                    Trade
                </Link>
            </td>
        </tr>
    );
};

const EmptyState = ({ title, description, actionLabel, actionHref }: { title: string; description: string; actionLabel: string; actionHref: string }) => (
    <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-dark-tertiary flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        </div>
        <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-text-muted text-sm mb-4">{description}</p>
        <Link href={actionHref} className="btn-primary">
            {actionLabel}
        </Link>
    </div>
);

const TrendingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const WalletIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
);

const CashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

export default Dashboard;
