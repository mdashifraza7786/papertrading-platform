"use client"

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getCryptoName } from "@/util/getCryptoName";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWebSocket } from "@/components/WebSocketProvider";

export interface TransactionData {
    uniqueid: number;
    quantity: string;
    price: string;
    actiontype: string;
    symbol: string;
    sellat?: string;
}

interface InvestmentClientProps {
    initialTransactions: TransactionData[];
}

const InvestmentClient = ({ initialTransactions }: InvestmentClientProps) => {
    const { cryptoData, loaded } = useWebSocket();
    const [activeTab, setActiveTab] = useState<"holdings" | "history">("holdings");
    const router = useRouter();

    const holdings = initialTransactions.filter((h) => h.actiontype === "hold");
    const transactions = initialTransactions.filter((h) => h.actiontype === "sold");

    const calculateTotalInvestment = () => {
        return holdings.reduce((sum, h) => {
            const price = parseFloat(h.price);
            const qty = parseFloat(h.quantity);
            return sum + price * qty;
        }, 0);
    };

    const calculateCurrentValue = () => {
        return holdings.reduce((sum, h) => {
            const symbol = h.symbol.toLowerCase() + "usdt";
            const crypto = cryptoData.get(symbol);
            if (crypto && crypto.price) {
                const qty = parseFloat(h.quantity);
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

    const handleSell = async (holding: TransactionData) => {
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-text-muted text-sm mb-1 font-medium">Total Investment</p>
                            {loaded ? (
                                <p className="price-lg text-text-primary tracking-tight">${totalInvestment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            ) : (
                                <div className="h-10 w-40 skeleton mt-1" />
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shadow-inner">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-text-muted text-sm mb-1 font-medium">Current Value</p>
                            {loaded ? (
                                <p className="price-lg text-text-primary tracking-tight">${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            ) : (
                                <div className="h-10 w-40 skeleton mt-1" />
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-info/10 border border-info/20 flex items-center justify-center text-info shadow-inner">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-text-muted text-sm mb-1 font-medium">Total P&L</p>
                            {loaded ? (
                                <>
                                    <p className={`price-lg tracking-tight ${isProfitable ? "text-profit" : "text-loss"}`}>
                                        {isProfitable ? "+$" : "-$"}{Math.abs(profitLoss).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-sm font-medium mt-1 ${isProfitable ? "text-profit" : "text-loss"}`}>
                                        {isProfitable ? "+" : ""}{profitLossPercent.toFixed(2)}%
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="h-10 w-40 skeleton mt-1" />
                                    <div className="h-5 w-20 skeleton mt-2" />
                                </>
                            )}
                        </div>
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner ${isProfitable ? "bg-profit/10 border-profit/20 text-profit" : "bg-loss/10 border-loss/20 text-loss"}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isProfitable ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card !p-0 overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border bg-background-tertiary/30">
                    <button
                        onClick={() => setActiveTab("holdings")}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === "holdings" ? "bg-background-elevated text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary hover:bg-background-elevated/50"}`}
                    >
                        Active Holdings <span className="ml-2 px-2 py-0.5 rounded-full bg-background-tertiary text-xs">{holdings.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === "history" ? "bg-background-elevated text-text-primary shadow-sm border border-border" : "text-text-muted hover:text-text-secondary hover:bg-background-elevated/50"}`}
                    >
                        Transaction History <span className="ml-2 px-2 py-0.5 rounded-full bg-background-tertiary text-xs">{transactions.length}</span>
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === "holdings" && (
                        <>
                            {!loaded ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 skeleton" />
                                    ))}
                                </div>
                            ) : holdings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {holdings.map((holding) => (
                                        <HoldingCard key={holding.uniqueid} holding={holding} cryptoData={cryptoData} onSell={() => handleSell(holding)} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState icon="wallet" title="No active holdings" description="Start investing to build your portfolio" actionLabel="Browse Markets" actionHref="/market/BTC" />
                            )}
                        </>
                    )}

                    {activeTab === "history" && (
                        <>
                            {!loaded ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 skeleton" />
                                    ))}
                                </div>
                            ) : transactions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    holding: TransactionData;
    cryptoData: Map<string, any>;
    onSell: () => void;
}) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [selling, setSelling] = useState(false);

    const symbol = holding.symbol.toLowerCase() + "usdt";
    const crypto = cryptoData.get(symbol);
    const currentPrice = crypto && crypto.price ? parseFloat(crypto.price as string) : null;
    const buyPrice = parseFloat(holding.price);
    const quantity = parseFloat(holding.quantity);
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
        <div className="relative p-5 rounded-xl bg-background-tertiary border border-border hover:border-border-hover transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <Link href={`/investment/${holding.uniqueid}`} className="flex items-center gap-4">
                    <div className="crypto-icon-lg bg-background-elevated">{holding.symbol.slice(0, 2)}</div>
                    <div>
                        <p className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{getCryptoName(holding.symbol)}</p>
                        <p className="text-sm font-medium text-text-muted">{quantity.toFixed(4)} {holding.symbol}</p>
                    </div>
                </Link>

                <div className="text-right">
                    <p className="price-md text-text-primary">${currentValue.toFixed(2)}</p>
                    <p className={`text-sm font-medium flex items-center justify-end gap-1 ${isProfitable ? "text-profit" : "text-loss"}`}>
                        {isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                <div>
                    <p className="text-xs text-text-muted mb-1">Buy Price</p>
                    <p className="price-sm text-text-secondary">${buyPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted mb-1">Current Price</p>
                    <p className="price-sm text-text-secondary">${currentPrice?.toFixed(2) || "---"}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted mb-1">Return</p>
                    <p className={`price-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                        {isProfitable ? "+$" : "-$"}{Math.abs(pnl).toFixed(2)}
                    </p>
                </div>
            </div>
            
            <div className="mt-4 flex gap-2">
                <Link href={`/investment/${holding.uniqueid}`} className="btn-ghost flex-1 h-9 text-sm">
                    View Details
                </Link>
                <button onClick={() => setShowConfirm(true)} className="btn-danger flex-1 h-9 text-sm">
                    Sell Asset
                </button>
            </div>

            {showConfirm && (
                <div className="absolute inset-0 bg-background-secondary/95 backdrop-blur-sm rounded-xl flex items-center justify-center p-6 z-10 border border-border shadow-lg">
                    <div className="text-center w-full">
                        <p className="text-text-primary font-semibold mb-2 text-lg">Sell {quantity.toFixed(4)} {holding.symbol}?</p>
                        <div className="p-3 bg-background-tertiary rounded-lg mb-4">
                            <p className="text-sm text-text-muted mb-1">Estimated Value</p>
                            <p className="price-md text-text-primary">${currentValue.toFixed(2)}</p>
                            <p className={`text-sm font-medium ${isProfitable ? "text-profit" : "text-loss"}`}>
                                {isProfitable ? "+$" : "-$"}{Math.abs(pnl).toFixed(2)} ({isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%)
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="btn-ghost flex-1 h-10" disabled={selling}>
                                Cancel
                            </button>
                            <button onClick={handleSellClick} className="btn-danger flex-1 h-10" disabled={selling}>
                                {selling ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : (
                                    "Confirm"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TransactionCard = ({ transaction }: { transaction: TransactionData }) => {
    const buyPrice = parseFloat(transaction.price);
    const quantity = parseFloat(transaction.quantity);
    const sellPrice = transaction.sellat ? parseFloat(transaction.sellat) : 0;
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
        <div className="p-5 rounded-xl bg-background-tertiary border border-border">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="crypto-icon-lg bg-background-elevated">{transaction.symbol.slice(0, 2)}</div>
                    <div>
                        <p className="font-semibold text-text-primary">{getCryptoName(transaction.symbol)}</p>
                        <p className="text-sm font-medium text-text-muted">{date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-background-elevated text-text-secondary border border-border">Closed Trade</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border/50">
                <div>
                    <p className="text-xs text-text-muted mb-1">Quantity</p>
                    <p className="text-sm font-medium text-text-secondary">{quantity.toFixed(4)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted mb-1">Buy Price</p>
                    <p className="price-sm text-text-secondary">${buyPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted mb-1">Sell Price</p>
                    <p className="price-sm text-text-secondary">${sellPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-muted mb-1">Total Return</p>
                    <p className={`price-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                        {isProfitable ? "+$" : "-$"}{Math.abs(pnl).toFixed(2)}
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
    <div className="text-center py-16 px-4 rounded-xl bg-background-tertiary/30 border border-dashed border-border">
        <div className="w-20 h-20 rounded-full bg-background-elevated flex items-center justify-center mx-auto mb-5 shadow-sm">
            {icon === "wallet" ? (
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ) : (
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
        </div>
        <h3 className="font-semibold text-text-primary text-lg mb-2">{title}</h3>
        <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">{description}</p>
        {actionLabel && actionHref && (
            <Link href={actionHref} className="btn-primary shadow-sm hover:shadow-md transition-shadow">
                {actionLabel}
            </Link>
        )}
    </div>
);

export default InvestmentClient;
