"use client"

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Time } from "lightweight-charts";
import { getCryptoName } from "@/util/getCryptoName";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProChart, { OHLCData } from "@/components/charts/ProChart";

interface Investment {
    uniqueid: number;
    quantity: { $numberDecimal: string };
    price: { $numberDecimal: string };
    actiontype: string;
    symbol: string;
}

const InvestmentDetailPage = () => {
    const { uniqueid } = useParams();
    const router = useRouter();
    const [investment, setInvestment] = useState<Investment | null>(null);
    const [price, setPrice] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [selling, setSelling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<OHLCData[]>([]);
    const [timeframe, setTimeframe] = useState("1m");

    useEffect(() => {
        const fetchInvestment = async () => {
            try {
                const res = await axios.get(`/api/investment?investment=${uniqueid}`);
                if (!res.data || res.data.length === 0) {
                    setError("Investment not found");
                    setTimeout(() => router.push("/investment"), 2000);
                    return;
                }
                setInvestment(res.data[0]);
            } catch {
                setError("Failed to load investment");
            }
        };

        const fetchWallet = async () => {
            try {
                const res = await axios.get("/api/getWallet");
                setWalletBalance(res.data);
            } catch {}
        };

        if (uniqueid) {
            fetchInvestment();
            fetchWallet();
        }
    }, [uniqueid, router]);

    const fetchChartData = useCallback(async () => {
        if (!investment) return;
        
        const symbol = `${investment.symbol}USDT`;
        
        try {
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=300`);
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                const formatted: OHLCData[] = data.map((d: number[]) => ({
                    time: Math.floor(d[0] / 1000) as Time,
                    open: Number(d[1]),
                    high: Number(d[2]),
                    low: Number(d[3]),
                    close: Number(d[4]),
                    volume: Number(d[5]),
                }));

                setChartData(formatted);
                setPrice(formatted[formatted.length - 1].close);
                setLoaded(true);
            }
        } catch {
            setLoaded(true);
        }
    }, [investment, timeframe]);

    useEffect(() => {
        if (investment) {
            fetchChartData();
        }
    }, [investment, fetchChartData]);

    useEffect(() => {
        if (!investment || chartData.length === 0) return;

        const symbol = `${investment.symbol}USDT`;
        const ws = new WebSocket("wss://fstream.binance.com/market/ws");

        ws.onopen = () => {
            const subscribeMsg = {
                method: "SUBSCRIBE",
                params: [`${symbol.toLowerCase()}@kline_${timeframe}`],
                id: 1,
            };
            ws.send(JSON.stringify(subscribeMsg));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.k) {
                    const newCandle: OHLCData = {
                        time: Math.floor(msg.k.t / 1000) as Time,
                        open: parseFloat(msg.k.o),
                        high: parseFloat(msg.k.h),
                        low: parseFloat(msg.k.l),
                        close: parseFloat(msg.k.c),
                        volume: parseFloat(msg.k.v),
                    };

                    setChartData((prev) => {
                        const lastCandle = prev[prev.length - 1];
                        if (lastCandle && lastCandle.time === newCandle.time) {
                            return [...prev.slice(0, -1), newCandle];
                        } else if (!lastCandle || newCandle.time > lastCandle.time) {
                            return [...prev, newCandle];
                        }
                        return prev;
                    });
                    setPrice(newCandle.close);
                }
            } catch {}
        };

        return () => ws.close();
    }, [investment, timeframe, chartData.length]);

    const handleTimeframeChange = (tf: string) => {
        setTimeframe(tf);
        setChartData([]);
    };

    const handleSell = async () => {
        if (!investment) return;

        setSelling(true);
        try {
            await axios.post("/api/sellStock", {
                id: uniqueid,
                priceat: price,
            });
            toast.success(`Successfully sold ${investment.symbol}`);
            setTimeout(() => router.push("/investment"), 1500);
        } catch {
            toast.error("Transaction failed");
        } finally {
            setSelling(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-loss/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-loss" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-text-primary font-medium mb-2">{error}</p>
                    <p className="text-text-muted text-sm">Redirecting...</p>
                </div>
            </div>
        );
    }

    if (!investment) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const quantity = parseFloat(investment.quantity.$numberDecimal);
    const buyPrice = parseFloat(investment.price.$numberDecimal);
    const investmentValue = buyPrice * quantity;
    const currentValue = price * quantity;
    const pnl = currentValue - investmentValue;
    const pnlPercent = investmentValue > 0 ? (pnl / investmentValue) * 100 : 0;
    const isProfitable = pnl >= 0;
    const symbol = `${investment.symbol}USDT`;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push("/investment")} className="btn-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-3">
                    <div className="crypto-icon-lg">{investment.symbol.slice(0, 2)}</div>
                    <div>
                        <h1 className="text-h2 text-text-primary">{getCryptoName(investment.symbol)} ({investment.symbol})</h1>
                        <p className="text-text-muted">Investment Details</p>
                    </div>
                </div>
                <div className="ml-auto flex items-baseline gap-3">
                    <span className="price-lg text-text-primary">${price.toFixed(2)}</span>
                    <span className={`text-sm font-medium ${isProfitable ? "text-profit" : "text-loss"}`}>
                        {isProfitable ? "▲" : "▼"} {Math.abs(pnlPercent).toFixed(2)}%
                    </span>
                    <div className={`px-3 py-1 rounded-lg text-sm ${isProfitable ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                        P&L: {isProfitable ? "+" : ""}${pnl.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 space-y-6">
                    {loaded && chartData.length > 0 ? (
                        <ProChart
                            symbol={symbol}
                            data={chartData}
                            height={500}
                            showToolbar={true}
                            showVolume={true}
                            defaultTimeframe={timeframe}
                            onTimeframeChange={handleTimeframeChange}
                        />
                    ) : (
                        <div className="bg-background-tertiary rounded-xl border border-border h-[500px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                                <span className="text-text-muted text-sm">Loading chart...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h2 className="section-title">Position Summary</h2>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-muted text-sm">Quantity</span>
                                <span className="price-sm text-text-primary">{quantity.toFixed(4)} {investment.symbol}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-muted text-sm">Buy Price</span>
                                <span className="price-sm text-text-primary">${buyPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-muted text-sm">Current Price</span>
                                <span className="price-sm text-text-primary">${price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-muted text-sm">Investment</span>
                                <span className="price-sm text-text-primary">${investmentValue.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <span className="text-text-muted text-sm">Current Value</span>
                                <span className="price-sm text-text-primary">${currentValue.toFixed(2)}</span>
                            </div>
                            <div className={`flex items-center justify-between p-3 rounded-lg ${isProfitable ? "bg-profit/10" : "bg-loss/10"}`}>
                                <span className="text-text-muted text-sm">Profit / Loss</span>
                                <span className={`price-sm ${isProfitable ? "text-profit" : "text-loss"}`}>
                                    {isProfitable ? "+" : ""}${pnl.toFixed(2)} ({isProfitable ? "+" : ""}{pnlPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-text-muted text-sm">Wallet Balance</span>
                            <span className="price-sm text-text-primary">${walletBalance.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleSell}
                            disabled={selling}
                            className="btn-danger w-full h-12 text-base"
                        >
                            {selling ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                `Sell ${investment.symbol}`
                            )}
                        </button>

                        <p className="text-center text-text-muted text-xs mt-3">
                            You will receive ${currentValue.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <ToastContainer position="bottom-right" theme="dark" />
        </div>
    );
};

export default InvestmentDetailPage;
