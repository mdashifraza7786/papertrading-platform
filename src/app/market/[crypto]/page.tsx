"use client"

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Time } from "lightweight-charts";
import axios from "axios";
import { getCryptoName } from "@/util/getCryptoName";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProChart, { OHLCData } from "@/components/charts/ProChart";

type PositionType = "call" | "put";

const leverageOptions = [1, 2, 5, 10, 20, 50, 100];

const MarketPage = () => {
    const { crypto } = useParams();
    const router = useRouter();

    const [price, setPrice] = useState(0);
    const [priceChange, setPriceChange] = useState(0);
    const [high24h, setHigh24h] = useState(0);
    const [low24h, setLow24h] = useState(0);
    const [volume, setVolume] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [quantity, setQuantity] = useState<number | string>(1);
    const [timeframe, setTimeframe] = useState("1m");
    const [loaded, setLoaded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [chartData, setChartData] = useState<OHLCData[]>([]);

    const [positionType, setPositionType] = useState<PositionType>("call");
    const [leverage, setLeverage] = useState(1);
    const [showLeverageSlider, setShowLeverageSlider] = useState(false);
    const [takeProfitPercent, setTakeProfitPercent] = useState<number | string>(2);
    const [stopLossPercent, setStopLossPercent] = useState<number | string>(1);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const symbol = crypto ? `${(crypto as string).toUpperCase()}USDT` : "";
    const cryptoName = getCryptoName(crypto as string);
    
    const margin = price * (typeof quantity === "number" ? quantity : 0);
    const positionSize = margin * leverage;
    const insufficientBalance = margin > walletBalance;

    const tpPrice = positionType === "call" 
        ? price * (1 + (typeof takeProfitPercent === "number" ? takeProfitPercent : 0) / 100)
        : price * (1 - (typeof takeProfitPercent === "number" ? takeProfitPercent : 0) / 100);
    
    const slPrice = positionType === "call"
        ? price * (1 - (typeof stopLossPercent === "number" ? stopLossPercent : 0) / 100)
        : price * (1 + (typeof stopLossPercent === "number" ? stopLossPercent : 0) / 100);

    const potentialProfit = positionSize * (typeof takeProfitPercent === "number" ? takeProfitPercent : 0) / 100;
    const potentialLoss = positionSize * (typeof stopLossPercent === "number" ? stopLossPercent : 0) / 100;
    const riskReward = potentialLoss > 0 ? (potentialProfit / potentialLoss).toFixed(2) : "∞";

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const res = await axios.get("/api/getWallet");
                setWalletBalance(res.data);
            } catch {}
        };

        const fetch24hData = async () => {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
                const data = await res.json();
                if (data) {
                    setPriceChange(parseFloat(data.priceChangePercent) || 0);
                    setHigh24h(parseFloat(data.highPrice) || 0);
                    setLow24h(parseFloat(data.lowPrice) || 0);
                    setVolume(parseFloat(data.volume) || 0);
                }
            } catch {}
        };

        fetchWallet();
        fetch24hData();

        const interval = setInterval(fetch24hData, 60000);
        return () => clearInterval(interval);
    }, [symbol]);

    const fetchChartData = useCallback(async () => {
        if (!symbol) return;
        
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
    }, [symbol, timeframe]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    useEffect(() => {
        if (!symbol || chartData.length === 0) return;

        const ws = new WebSocket("wss://fstream.binance.com/ws");

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
    }, [symbol, timeframe, chartData.length]);

    const handleTimeframeChange = (tf: string) => {
        setTimeframe(tf);
        setChartData([]);
    };

    const handleOpenPosition = async () => {
        if (typeof quantity !== "number" || quantity <= 0) {
            toast.error("Enter a valid quantity");
            return;
        }

        if (insufficientBalance) {
            toast.error("Insufficient margin balance");
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post("/api/buyStock", {
                quantity,
                price: price.toFixed(2),
                symbol: crypto,
                positionType,
                leverage,
                takeProfit: typeof takeProfitPercent === "number" ? tpPrice.toFixed(2) : null,
                stopLoss: typeof stopLossPercent === "number" ? slPrice.toFixed(2) : null,
            });
            
            const action = positionType === "call" ? "Call" : "Put";
            toast.success(`Opened ${action} position: ${quantity} ${crypto} @ ${leverage}x`);
            setWalletBalance(res.data);
            setTimeout(() => router.push("/investment"), 1500);
        } catch {
            toast.error("Failed to open position");
        } finally {
            setSubmitting(false);
        }
    };

    const incrementQuantity = () => {
        setQuantity((prev) => (typeof prev === "number" ? Number((prev + 0.1).toFixed(2)) : 0.1));
    };

    const decrementQuantity = () => {
        setQuantity((prev) => (typeof prev === "number" && prev > 0.1 ? Number((prev - 0.1).toFixed(2)) : 0.1));
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
        if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
        if (num >= 1000) return (num / 1000).toFixed(2) + "K";
        return num.toFixed(2);
    };

    const formatPrice = (p: number) => {
        return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: p < 1 ? 6 : 2 });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="btn-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-3">
                    <div className="crypto-icon-lg">{(crypto as string)?.slice(0, 2)}</div>
                    <div>
                        <h1 className="text-h2 text-text-primary">{cryptoName}</h1>
                        <p className="text-text-muted">{crypto}/USDT Perpetual</p>
                    </div>
                </div>
                <div className="ml-auto flex items-baseline gap-3">
                    <span className="price-lg text-text-primary">${formatPrice(price)}</span>
                    <span className={`text-sm font-medium ${priceChange >= 0 ? "text-profit" : "text-loss"}`}>
                        {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
                    </span>
                </div>
            </div>
              
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 space-y-4">
                    {loaded && chartData.length > 0 ? (
                        <ProChart
                            symbol={symbol}
                            data={chartData}
                            height={550}
                            showToolbar={true}
                            showVolume={true}
                            defaultTimeframe={timeframe}
                            onTimeframeChange={handleTimeframeChange}
                        />
                    ) : (
                        <div className="bg-[#0D1117] rounded-xl border border-[#1F2937] h-[550px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                                <span className="text-text-muted text-sm">Loading chart...</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-4">
                        <div className="card p-4">
                            <p className="text-text-muted text-xs mb-1">24h High</p>
                            <p className="price-sm text-profit">${formatPrice(high24h)}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-text-muted text-xs mb-1">24h Low</p>
                            <p className="price-sm text-loss">${formatPrice(low24h)}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-text-muted text-xs mb-1">24h Volume</p>
                            <p className="price-sm text-text-primary">{formatNumber(volume)} {crypto}</p>
                        </div>
                        <div className="card p-4">
                            <p className="text-text-muted text-xs mb-1">24h Change</p>
                            <p className={`price-sm ${priceChange >= 0 ? "text-profit" : "text-loss"}`}>
                                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="card sticky top-6">
                        <div className="flex items-center gap-2 p-1 bg-dark-tertiary rounded-lg mb-6">
                            <button
                                onClick={() => setPositionType("call")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                                    positionType === "call"
                                        ? "bg-profit text-white shadow-lg shadow-profit/20"
                                        : "text-text-muted hover:text-text-primary"
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Call
                            </button>
                            <button
                                onClick={() => setPositionType("put")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                                    positionType === "put"
                                        ? "bg-loss text-white shadow-lg shadow-loss/20"
                                        : "text-text-muted hover:text-text-primary"
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                </svg>
                                Put
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${positionType === "call" ? "bg-profit" : "bg-loss"}`} />
                                <span className="text-xs text-text-muted">Live Price</span>
                            </div>
                            <span className="price-md text-text-primary">${formatPrice(price)}</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-text-muted">Leverage</label>
                                    <button
                                        onClick={() => setShowLeverageSlider(!showLeverageSlider)}
                                        className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${
                                            leverage > 1 ? "bg-warning/20 text-warning" : "bg-dark-tertiary text-text-primary"
                                        }`}
                                    >
                                        {leverage}x
                                    </button>
                                </div>
                                
                                {showLeverageSlider && (
                                    <div className="p-3 bg-dark-tertiary rounded-lg space-y-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {leverageOptions.map((lev) => (
                                                <button
                                                    key={lev}
                                                    onClick={() => setLeverage(lev)}
                                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                                        leverage === lev
                                                            ? "bg-accent-primary text-white"
                                                            : "bg-dark-elevated text-text-muted hover:text-text-primary"
                                                    }`}
                                                >
                                                    {lev}x
                                                </button>
                                            ))}
                                        </div>
                                        {leverage >= 10 && (
                                            <div className="flex items-center gap-2 text-xs text-warning">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                High leverage increases liquidation risk
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-sm text-text-muted mb-2 block">Margin ({crypto})</label>
                                <div className="flex items-center bg-dark-tertiary rounded-lg overflow-hidden">
                                    <button onClick={decrementQuantity} className="px-4 py-3 text-xl text-text-secondary hover:text-text-primary hover:bg-dark-elevated transition-colors">
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setQuantity(val === "" ? "" : parseFloat(val));
                                        }}
                                        className="flex-1 bg-transparent text-center text-text-primary text-lg font-mono outline-none py-3"
                                    />
                                    <button onClick={incrementQuantity} className="px-4 py-3 text-xl text-text-secondary hover:text-text-primary hover:bg-dark-elevated transition-colors">
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full flex items-center justify-between py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                            >
                                <span>TP/SL Settings</span>
                                <svg className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showAdvanced && (
                                <div className="p-4 bg-dark-tertiary rounded-lg space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-profit">Take Profit %</label>
                                            <span className="text-xs text-text-muted">Price: ${formatPrice(tpPrice)}</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.1"
                                            value={takeProfitPercent}
                                            onChange={(e) => setTakeProfitPercent(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="w-full bg-dark-elevated rounded-lg px-4 py-2.5 text-text-primary font-mono outline-none focus:ring-2 focus:ring-profit/50"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-loss">Stop Loss %</label>
                                            <span className="text-xs text-text-muted">Price: ${formatPrice(slPrice)}</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.1"
                                            value={stopLossPercent}
                                            onChange={(e) => setStopLossPercent(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="w-full bg-dark-elevated rounded-lg px-4 py-2.5 text-text-primary font-mono outline-none focus:ring-2 focus:ring-loss/50"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-[#374151]">
                                        <span className="text-xs text-text-muted">Risk/Reward Ratio</span>
                                        <span className={`text-sm font-bold ${parseFloat(riskReward) >= 2 ? "text-profit" : parseFloat(riskReward) >= 1 ? "text-warning" : "text-loss"}`}>
                                            1:{riskReward}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-dark-tertiary rounded-lg space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Position Size</span>
                                    <span className="price-sm text-text-primary">${formatPrice(positionSize)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Required Margin</span>
                                    <span className="price-sm text-text-primary">${formatPrice(margin)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-muted">Available Balance</span>
                                    <span className="price-sm text-text-primary">${formatPrice(walletBalance)}</span>
                                </div>
                                <div className="h-px bg-[#374151]" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-profit">Potential Profit</span>
                                    <span className="price-sm text-profit">+${formatPrice(potentialProfit)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-loss">Max Loss</span>
                                    <span className="price-sm text-loss">-${formatPrice(potentialLoss)}</span>
                                </div>
                            </div>

                            {insufficientBalance && (
                                <div className="flex items-center gap-2 p-3 bg-loss/10 rounded-lg">
                                    <svg className="w-5 h-5 text-loss flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-sm text-loss">Insufficient margin</span>
                                </div>
                            )}

                            <button
                                onClick={handleOpenPosition}
                                disabled={submitting || insufficientBalance || typeof quantity !== "number" || quantity <= 0}
                                className={`w-full h-14 text-base font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    positionType === "call"
                                        ? "bg-profit hover:bg-profit/90 text-white shadow-lg shadow-profit/20"
                                        : "bg-loss hover:bg-loss/90 text-white shadow-lg shadow-loss/20"
                                }`}
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {positionType === "call" ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                            </svg>
                                        )}
                                        {positionType === "call" ? "Call" : "Put"} {leverage}x
                                    </>
                                )}
                            </button>
                        </div>
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
                                <p className="text-sm text-text-secondary">Practice futures trading with virtual funds. No real money involved.</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-sm font-semibold text-text-primary mb-3">Position Guide</h3>
                        <div className="space-y-3 text-xs text-text-muted">
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-profit mt-1.5 flex-shrink-0" />
                                <p><span className="text-profit font-medium">Call:</span> Profit when price goes up. Bullish position.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-loss mt-1.5 flex-shrink-0" />
                                <p><span className="text-loss font-medium">Put:</span> Profit when price goes down. Bearish position.</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                                <p><span className="text-warning font-medium">Leverage:</span> Amplifies gains and losses. Use with caution.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
      
            <ToastContainer position="bottom-right" theme="dark" />
        </div>
    );
};

export default MarketPage;

