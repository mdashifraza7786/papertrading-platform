"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCryptoName } from "@/util/getCryptoName";
import { useWebSocket } from "@/components/WebSocketProvider";

export interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
    change?: string | number;
}

export interface HoldingData {
    symbol: string;
    totalQuantity: string;
    totalPrice: string;
}

interface DashboardClientProps {
    initialWalletBalance: number;
    initialHoldings: HoldingData[];
}

const DashboardClient = ({ initialWalletBalance, initialHoldings }: DashboardClientProps) => {
    const { cryptoData, loaded } = useWebSocket();
    const [holdingsData] = useState<HoldingData[]>(initialHoldings);
    const [walletBalance] = useState<number>(initialWalletBalance);

    const calculateTotalInvestment = () =>
        holdingsData.reduce((sum, h) => sum + parseFloat(h.totalPrice), 0);

    const calculateCurrentValue = () =>
        holdingsData.reduce((sum, h) => {
            const symbol = h.symbol.toLowerCase() + "usdt";
            const crypto = cryptoData.get(symbol);
            if (crypto && crypto.price) {
                return sum + parseFloat(crypto.price as string) * parseFloat(h.totalQuantity);
            }
            return sum;
        }, 0);

    const totalInvestment = calculateTotalInvestment();
    const currentValue = calculateCurrentValue();
    const profitLoss = currentValue - totalInvestment;
    const profitLossPercent = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;
    const isProfitable = profitLoss >= 0;
    const cryptoDataArray = Array.from(cryptoData.values());
    const totalBalance = currentValue + walletBalance;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "rgb(var(--text-primary))" }}>Dashboard</h1>
                    <p className="text-sm mt-0.5" style={{ color: "rgb(var(--text-secondary))" }}>
                        Your trading overview at a glance
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "rgb(var(--profit-soft))", color: "rgb(var(--profit))" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgb(var(--profit))" }} />
                    Live Markets
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Total Equity — hero card */}
                <div className="card md:col-span-1 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, rgb(var(--accent-primary)), rgb(var(--accent-glow)))" }}>
                    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10" style={{ background: "#fff" }} />
                    <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10" style={{ background: "#fff" }} />
                    <p className="text-sm font-medium text-white/80 mb-2">Total Equity</p>
                    {loaded ? (
                        <p className="text-3xl font-bold text-white font-mono tabular-nums">
                            ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    ) : (
                        <div className="h-9 w-44 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.25)" }} />
                    )}
                    <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2">
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isProfitable ? "bg-white/20 text-white" : "bg-red-100 text-red-700"}`}>
                            {isProfitable ? "▲" : "▼"} {Math.abs(profitLossPercent).toFixed(2)}%
                        </div>
                        <span className="text-xs text-white/70">
                            {isProfitable ? "+" : "-"}${Math.abs(profitLoss).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total return
                        </span>
                    </div>
                </div>

                {/* Current value */}
                <div className="card flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium" style={{ color: "rgb(var(--text-secondary))" }}>Current Value</p>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgb(var(--accent-light))" }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--accent-primary))" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        {loaded ? (
                            <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: "rgb(var(--text-primary))" }}>
                                ${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        ) : (
                            <div className="h-8 w-32 skeleton" />
                        )}
                    </div>
                    <div className="mt-4 pt-3 border-t" style={{ borderColor: "rgb(var(--border))" }}>
                        <p className="text-xs mb-1" style={{ color: "rgb(var(--text-muted))" }}>Invested Capital</p>
                        {loaded ? (
                            <p className="text-sm font-semibold font-mono" style={{ color: "rgb(var(--text-secondary))" }}>
                                ${totalInvestment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        ) : (
                            <div className="h-5 w-24 skeleton" />
                        )}
                    </div>
                </div>

                {/* Purchasing Power */}
                <div className="card flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium" style={{ color: "rgb(var(--text-secondary))" }}>Purchasing Power</p>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgb(var(--accent-light))" }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--accent-primary))" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        {loaded ? (
                            <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: "rgb(var(--text-primary))" }}>
                                ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        ) : (
                            <div className="h-8 w-32 skeleton" />
                        )}
                    </div>
                    <Link href="/market/BTC" className="mt-4 btn-primary w-full text-center text-sm">
                        Trade Markets →
                    </Link>
                </div>
            </div>

            {/* Holdings + Market Movers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-base" style={{ color: "rgb(var(--text-primary))" }}>Active Holdings</h2>
                            <Link href="/investment" className="text-sm font-semibold flex items-center gap-1"
                                style={{ color: "rgb(var(--accent-primary))" }}>
                                View Portfolio →
                            </Link>
                        </div>

                        {!loaded ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton" />)}
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
                                description="Start building your portfolio by buying some crypto."
                                actionLabel="Browse Markets"
                                actionHref="/market/BTC"
                            />
                        )}
                    </div>
                </div>

                {/* Market Movers */}
                <div className="lg:col-span-1">
                    <div className="card h-full">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-base" style={{ color: "rgb(var(--text-primary))" }}>Market Movers</h2>
                        </div>
                        {!loaded ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 skeleton" />)}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {cryptoDataArray.slice(0, 7).map((crypto) => (
                                    <Link
                                        key={crypto.id}
                                        href={`/market/${crypto.symbol.replace("usdt", "").toUpperCase()}`}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                                        style={{ color: "inherit" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgb(var(--bg-tertiary))")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="crypto-icon">{crypto.symbol.replace("usdt", "").toUpperCase().slice(0, 2)}</div>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>{crypto.name}</p>
                                                <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                                                    {crypto.symbol.replace("usdt", "").toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold font-mono" style={{ color: "rgb(var(--text-primary))" }}>
                                            ${crypto.price || "---"}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HoldingRow = ({ holding, cryptoData }: { holding: HoldingData; cryptoData: Map<string, CryptoData> }) => {
    const symbol = holding.symbol.toLowerCase() + "usdt";
    const crypto = cryptoData.get(symbol);
    const currentPrice = crypto && crypto.price ? parseFloat(crypto.price as string) : null;
    const quantity = parseFloat(holding.totalQuantity);
    const investment = parseFloat(holding.totalPrice);
    const currentValue = currentPrice ? currentPrice * quantity : 0;
    const profitLoss = currentValue - investment;
    const profitLossPercent = investment > 0 ? (profitLoss / investment) * 100 : 0;
    const isProfitable = profitLoss >= 0;

    return (
        <Link
            href={`/market/${holding.symbol}`}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-150 group"
            style={{ border: "1px solid rgb(var(--border))" }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgb(var(--bg-tertiary))";
                e.currentTarget.style.borderColor = "rgba(0,176,80,0.25)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.borderColor = "rgb(var(--border))";
            }}
        >
            <div className="flex items-center gap-3">
                <div className="crypto-icon-lg">{holding.symbol.slice(0, 2)}</div>
                <div>
                    <p className="font-semibold text-sm" style={{ color: "rgb(var(--text-primary))" }}>
                        {getCryptoName(holding.symbol)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>
                        {quantity.toFixed(4)} {holding.symbol}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-sm font-mono tabular-nums" style={{ color: "rgb(var(--text-primary))" }}>
                    ${currentValue.toFixed(2)}
                </p>
                <div className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 ${isProfitable ? "text-profit" : "text-loss"}`}>
                    {isProfitable ? "▲" : "▼"} {Math.abs(profitLossPercent).toFixed(2)}%
                </div>
            </div>
        </Link>
    );
};

const EmptyState = ({ title, description, actionLabel, actionHref }: {
    title: string; description: string; actionLabel: string; actionHref: string;
}) => (
    <div className="text-center py-12 px-4 rounded-2xl" style={{ background: "rgb(var(--bg-tertiary))", border: "1.5px dashed rgb(var(--border-hover))" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgb(var(--accent-light))" }}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: "rgb(var(--accent-primary))" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        </div>
        <h3 className="font-bold mb-1" style={{ color: "rgb(var(--text-primary))" }}>{title}</h3>
        <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: "rgb(var(--text-muted))" }}>{description}</p>
        <Link href={actionHref} className="btn-primary text-sm">
            {actionLabel}
        </Link>
    </div>
);

export default DashboardClient;
