"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getCryptoName } from "@/util/getCryptoName";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
}

interface HoldingData {
    uniqueid: number;
    quantity: { $numberDecimal: string };
    price: { $numberDecimal: string };
    actiontype: string;
    symbol: string;
    sellat?: { $numberDecimal: string };
}

const Investment = () => {
    const [cryptoData, setCryptoData] = useState<Map<string, CryptoData>>(new Map());
    const [holdingsData, setHoldingsData] = useState<HoldingData[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<"holdings" | "history">("holdings");
    const router = useRouter();

    const initialCryptoList = [
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

        const ws = new WebSocket("wss://fstream.binance.com/ws");

        const timeout = setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) setLoaded(true);
        }, 5000);

        ws.onopen = () => {
            clearTimeout(timeout);
            setLoaded(true);
            const symbols = initialCryptoList.map((c) => `${c.symbol.toLowerCase()}usdt@kline_1m`);
            ws.send(JSON.stringify({ method: "SUBSCRIBE", params: symbols, id: 1 }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.k && msg.k.c) {
                    const symbol = msg.s.toLowerCase();
                    const price = parseFloat(msg.k.c);
                    setCryptoData((prev) => {
                        const updated = new Map(prev);
                        if (updated.has(symbol)) {
                            const existing = updated.get(symbol)!;
                            updated.set(symbol, { ...existing, price: price.toFixed(2) });
                        }
                        return updated;
                    });
                }
            } catch {}
        };

        ws.onerror = () => setLoaded(true);
        ws.onclose = () => setLoaded(true);

        return () => {
            clearTimeout(timeout);
            ws.close();
        };
    }, []);

    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                const response = await axios.get("/api/investment");
                setHoldingsData(response.data);
            } catch {}
        };
        fetchHoldings();
    }, []);

    const holdings = holdingsData.filter((h) => h.actiontype === "hold");
    const transactions = holdingsData.filter((h) => h.actiontype === "sold");

    const calculateTotalInvestment = () => {
        return holdings.reduce((sum, h) => {
            const price = parseFloat(h.price.$numberDecimal);
            const qty = parseFloat(h.quantity.$numberDecimal);
            return sum + price * qty;
        }, 0);
    };

    const calculateCurrentValue = () => {
        return holdings.reduce((sum, h) => {
            const symbol = h.symbol.toLowerCase() + "usdt";
            const crypto = cryptoData.get(symbol);
            if (crypto && crypto.price) {
                const qty = parseFloat(h.quantity.$numberDecimal);
                return sum + parseFloat(crypto.price as string) * qty;
            }
            return sum;
        }, 0);
    };

    const totalInvestment = calculateTotalInvestment();
    const currentValue = calculateCurrentValue();
    const profitLoss = currentValue - totalInvestment;
    const profitLossPercent = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;
    const isProfitable = profitLoss >= 0;

    const handleSell = async (holding: HoldingData) => {
        const symbol = holding.symbol.toLowerCase() + "usdt";
        const crypto = cryptoData.get(symbol);
        const currentPrice = crypto && crypto.price ? parseFloat(crypto.price as string) : null;

        if (!currentPrice) {
            toast.error("Unable to get current price");
            return;
        }

        try {
            await axios.post("/api/sellStock", {
                id: holding.uniqueid,
                priceat: currentPrice,
            });
            toast.success(`Sold ${holding.symbol} successfully`);
            setTimeout(() => router.refresh(), 1000);
            window.location.reload();
        } catch {
            toast.error("Failed to sell");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary">Portfolio</h1>
                    <p className="text-text-secondary mt-1">Manage your investments and track performance</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-text-muted text-sm mb-1">Total Investment</p>
                            {loaded ? (
                                <p className="price-md text-text-primary">${totalInvestment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            ) : (
                                <div className="h-7 w-32 skeleton" />
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-text-muted text-sm mb-1">Current Value</p>
                            {loaded ? (
                                <p className="price-md text-text-primary">${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            ) : (
                                <div className="h-7 w-32 skeleton" />
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-text-muted text-sm mb-1">Total P&L</p>
                            {loaded ? (
                                <>
                                    <p className={`price-md ${isProfitable ? "text-profit" : "text-loss"}`}>
                                        {isProfitable ? "+" : ""}${Math.abs(profitLoss).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                                        {isProfitable ? "+" : ""}{profitLossPercent.toFixed(2)}%
                                    </p>
                                </>
                            ) : (
                                <div className="h-7 w-32 skeleton" />
                            )}
                        </div>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isProfitable ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isProfitable ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab("holdings")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "holdings" ? "bg-dark-tertiary text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
                    >
                        Holdings ({holdings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "history" ? "bg-dark-tertiary text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
                    >
                        Transaction History ({transactions.length})
                    </button>
                </div>

                {activeTab === "holdings" && (
                    <>
                        {!loaded ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 skeleton" />
                                ))}
                            </div>
                        ) : holdings.length > 0 ? (
                            <div className="space-y-3">
                                {holdings.map((holding) => (
                                    <HoldingCard key={holding.uniqueid} holding={holding} cryptoData={cryptoData} onSell={() => handleSell(holding)} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon="wallet" title="No holdings yet" description="Start investing to build your portfolio" actionLabel="Browse Markets" actionHref="/market/BTC" />
                        )}
                    </>
                )}

                {activeTab === "history" && (
                    <>
                        {!loaded ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 skeleton" />
                                ))}
                            </div>
                        ) : transactions.length > 0 ? (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <TransactionCard key={tx.uniqueid} transaction={tx} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon="history" title="No transactions yet" description="Your completed trades will appear here" />
                        )}
                    </>
                )}
            </div>

            <ToastContainer position="bottom-right" theme="dark" />
        </div>
    );
};

const HoldingCard = ({
    holding,
    cryptoData,
    onSell,
}: {
    holding: HoldingData;
    cryptoData: Map<string, CryptoData>;
    onSell: () => void;
}) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [selling, setSelling] = useState(false);

    const symbol = holding.symbol.toLowerCase() + "usdt";
    const crypto = cryptoData.get(symbol);
    const currentPrice = crypto && crypto.price ? parseFloat(crypto.price as string) : null;
    const buyPrice = parseFloat(holding.price.$numberDecimal);
    const quantity = parseFloat(holding.quantity.$numberDecimal);
    const investment = buyPrice * quantity;
    const currentValue = currentPrice ? currentPrice * quantity : 0;
    const pnl = currentValue - investment;
    const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0;
    const isProfitable = pnl >= 0;

    const handleSellClick = async () => {
        setSelling(true);
        await onSell();
        setSelling(false);
        setShowConfirm(false);
    };

    return (
        <div className="relative p-4 rounded-lg bg-dark-tertiary/50 hover:bg-dark-tertiary transition-colors">
            <div className="flex items-center justify-between">
                <Link href={`/investment/${holding.uniqueid}`} className="flex items-center gap-4 flex-1">
                    <div className="crypto-icon-lg">{holding.symbol.slice(0, 2)}</div>
                    <div>
                        <p className="font-semibold text-text-primary">{getCryptoName(holding.symbol)}</p>
                        <p className="text-sm text-text-muted">{quantity.toFixed(4)} {holding.symbol}</p>
                    </div>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="price-sm text-text-primary">${currentValue.toFixed(2)}</p>
                        <p className={`text-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                            {isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/investment/${holding.uniqueid}`} className="btn-ghost h-9 px-3 text-sm">
                            Details
                        </Link>
                        <button onClick={() => setShowConfirm(true)} className="btn-danger h-9 px-3 text-sm">
                            Sell
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#1F2937]">
                <div>
                    <p className="text-xs text-text-muted">Buy Price</p>
                    <p className="price-sm text-text-secondary">${buyPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted">Current Price</p>
                    <p className="price-sm text-text-secondary">${currentPrice?.toFixed(2) || "---"}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted">P&L</p>
                    <p className={`price-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                        {isProfitable ? "+" : ""}${pnl.toFixed(2)}
                    </p>
                </div>
            </div>

            {showConfirm && (
                <div className="absolute inset-0 bg-dark-secondary/95 backdrop-blur-sm rounded-lg flex items-center justify-center p-4 z-10">
                    <div className="text-center">
                        <p className="text-text-primary font-medium mb-2">Sell {quantity.toFixed(4)} {holding.symbol}?</p>
                        <p className="text-sm text-text-muted mb-4">
                            Current value: ${currentValue.toFixed(2)} ({isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%)
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={() => setShowConfirm(false)} className="btn-ghost h-9 px-4" disabled={selling}>
                                Cancel
                            </button>
                            <button onClick={handleSellClick} className="btn-danger h-9 px-4" disabled={selling}>
                                {selling ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Confirm Sell"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TransactionCard = ({ transaction }: { transaction: HoldingData }) => {
    const buyPrice = parseFloat(transaction.price.$numberDecimal);
    const quantity = parseFloat(transaction.quantity.$numberDecimal);
    const sellPrice = transaction.sellat ? parseFloat(transaction.sellat.$numberDecimal) : 0;
    const investment = buyPrice * quantity;
    const saleValue = sellPrice * quantity;
    const pnl = saleValue - investment;
    const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0;
    const isProfitable = pnl >= 0;

    const date = new Date(transaction.uniqueid).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <div className="p-4 rounded-lg bg-dark-tertiary/50">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="crypto-icon-lg">{transaction.symbol.slice(0, 2)}</div>
                    <div>
                        <p className="font-semibold text-text-primary">{getCryptoName(transaction.symbol)}</p>
                        <p className="text-sm text-text-muted">{date}</p>
                    </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-dark-elevated text-text-secondary">Sold</span>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-3 border-t border-[#1F2937]">
                <div>
                    <p className="text-xs text-text-muted">Quantity</p>
                    <p className="text-sm text-text-secondary">{quantity.toFixed(4)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted">Buy Price</p>
                    <p className="price-sm text-text-secondary">${buyPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted">Sell Price</p>
                    <p className="price-sm text-text-secondary">${sellPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted">P&L</p>
                    <p className={`price-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                        {isProfitable ? "+" : ""}${pnl.toFixed(2)} ({isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%)
                    </p>
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({
    icon,
    title,
    description,
    actionLabel,
    actionHref,
}: {
    icon: "wallet" | "history";
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}) => (
    <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-dark-tertiary flex items-center justify-center mx-auto mb-4">
            {icon === "wallet" ? (
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ) : (
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
        </div>
        <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-text-muted text-sm mb-4">{description}</p>
        {actionLabel && actionHref && (
            <Link href={actionHref} className="btn-primary">
                {actionLabel}
            </Link>
        )}
    </div>
);

export default Investment;
