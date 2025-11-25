"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    createChart,
    IChartApi,
    ISeriesApi,
    Time,
    CandlestickData,
    LineData,
    HistogramData,
    CrosshairMode,
    ColorType,
    LineStyle,
} from "lightweight-charts";
import { SMA, EMA, RSI, MACD, BollingerBands, Stochastic, ATR } from "technicalindicators";

export interface OHLCData {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

type ChartType = "candlestick" | "line" | "area" | "bars" | "heikin-ashi";
type DrawingTool = "none" | "trendline" | "horizontal" | "vertical" | "rectangle" | "fibonacci" | "position-call" | "position-put";

interface Drawing {
    id: string;
    type: DrawingTool;
    points: { time: Time; price: number }[];
    color: string;
}

interface IndicatorConfig {
    id: string;
    type: string;
    params: Record<string, number>;
    color: string;
    visible: boolean;
}

interface ProChartProps {
    symbol: string;
    data: OHLCData[];
    onDataUpdate?: (candle: OHLCData) => void;
    height?: number;
    showToolbar?: boolean;
    showVolume?: boolean;
    defaultTimeframe?: string;
    onTimeframeChange?: (timeframe: string) => void;
}

const INDICATOR_COLORS = [
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#06B6D4",
];

const DEFAULT_INDICATORS: IndicatorConfig[] = [];

const timeframes = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "1H", value: "1h" },
    { label: "4H", value: "4h" },
    { label: "1D", value: "1d" },
];

const chartTypes: { type: ChartType; label: string; icon: JSX.Element }[] = [
    {
        type: "candlestick",
        label: "Candles",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="8" width="4" height="8" rx="0.5" />
                <line x1="7" y1="4" x2="7" y2="8" />
                <line x1="7" y1="16" x2="7" y2="20" />
                <rect x="15" y="10" width="4" height="6" rx="0.5" />
                <line x1="17" y1="6" x2="17" y2="10" />
                <line x1="17" y1="16" x2="17" y2="18" />
            </svg>
        ),
    },
    {
        type: "line",
        label: "Line",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4,16 8,12 12,14 16,8 20,10" />
            </svg>
        ),
    },
    {
        type: "area",
        label: "Area",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4,16 L8,12 L12,14 L16,8 L20,10 L20,20 L4,20 Z" fill="currentColor" opacity="0.3" />
                <polyline points="4,16 8,12 12,14 16,8 20,10" />
            </svg>
        ),
    },
    {
        type: "bars",
        label: "Bars",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="7" y1="4" x2="7" y2="20" />
                <line x1="4" y1="8" x2="7" y2="8" />
                <line x1="7" y1="14" x2="10" y2="14" />
                <line x1="17" y1="6" x2="17" y2="18" />
                <line x1="14" y1="10" x2="17" y2="10" />
                <line x1="17" y1="14" x2="20" y2="14" />
            </svg>
        ),
    },
    {
        type: "heikin-ashi",
        label: "Heikin-Ashi",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="9" width="4" height="6" rx="0.5" fill="currentColor" />
                <line x1="7" y1="5" x2="7" y2="9" />
                <line x1="7" y1="15" x2="7" y2="19" />
                <rect x="15" y="8" width="4" height="8" rx="0.5" />
                <line x1="17" y1="4" x2="17" y2="8" />
                <line x1="17" y1="16" x2="17" y2="20" />
            </svg>
        ),
    },
];

const availableIndicators = [
    { id: "sma", name: "SMA", params: { period: 20 } },
    { id: "ema", name: "EMA", params: { period: 20 } },
    { id: "rsi", name: "RSI", params: { period: 14 } },
    { id: "macd", name: "MACD", params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
    { id: "bb", name: "Bollinger Bands", params: { period: 20, stdDev: 2 } },
    { id: "stoch", name: "Stochastic", params: { period: 14, signalPeriod: 3 } },
    { id: "atr", name: "ATR", params: { period: 14 } },
    { id: "vwap", name: "VWAP", params: { period: 1 } },
];

const drawingTools: { type: DrawingTool; label: string; icon: JSX.Element }[] = [
    {
        type: "trendline",
        label: "Trend Line",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="20" x2="20" y2="4" />
            </svg>
        ),
    },
    {
        type: "horizontal",
        label: "Horizontal Line",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
        ),
    },
    {
        type: "vertical",
        label: "Vertical Line",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
        ),
    },
    {
        type: "rectangle",
        label: "Rectangle",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="6" width="16" height="12" rx="1" />
            </svg>
        ),
    },
    {
        type: "fibonacci",
        label: "Fibonacci",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="4" x2="20" y2="4" />
                <line x1="4" y1="9" x2="20" y2="9" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="16" x2="20" y2="16" />
                <line x1="4" y1="20" x2="20" y2="20" />
            </svg>
        ),
    },
    {
        type: "position-call",
        label: "Call Position",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M12 19V5M12 5l-7 7M12 5l7 7" />
            </svg>
        ),
    },
    {
        type: "position-put",
        label: "Put Position",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M12 5v14M12 19l-7-7M12 19l7-7" />
            </svg>
        ),
    },
];

const safeRemoveChart = (chart: IChartApi | null) => {
    if (!chart) return;
    try {
        chart.remove();
    } catch {
    }
};

const ProChart: React.FC<ProChartProps> = ({
    symbol,
    data,
    height = 500,
    showToolbar = true,
    showVolume: initialShowVolume = true,
    defaultTimeframe = "1m",
    onTimeframeChange,
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area" | "Bar"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line" | "Histogram">>>(new Map());
    const drawingSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
    const rsiChartRef = useRef<IChartApi | null>(null);
    const rsiContainerRef = useRef<HTMLDivElement>(null);
    const isDisposedRef = useRef(false);

    const [chartType, setChartType] = useState<ChartType>("candlestick");
    const [timeframe, setTimeframe] = useState(defaultTimeframe);
    const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
    const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
    const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [showDrawingTools, setShowDrawingTools] = useState(false);
    const [crosshairData, setCrosshairData] = useState<{ time: string; price: string; ohlc?: OHLCData } | null>(null);
    const [showVolume, setShowVolume] = useState(initialShowVolume);
    const [chartSettings, setChartSettings] = useState({
        showGrid: true,
        showCrosshair: true,
        logScale: false,
    });

    const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>("none");
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const convertToHeikinAshi = useCallback((ohlcData: OHLCData[]): OHLCData[] => {
        const haData: OHLCData[] = [];
        for (let i = 0; i < ohlcData.length; i++) {
            const current = ohlcData[i];
            if (i === 0) {
                haData.push({
                    time: current.time,
                    open: (current.open + current.close) / 2,
                    high: current.high,
                    low: current.low,
                    close: (current.open + current.high + current.low + current.close) / 4,
                    volume: current.volume,
                });
            } else {
                const prevHA = haData[i - 1];
                const haClose = (current.open + current.high + current.low + current.close) / 4;
                const haOpen = (prevHA.open + prevHA.close) / 2;
                haData.push({
                    time: current.time,
                    open: haOpen,
                    high: Math.max(current.high, haOpen, haClose),
                    low: Math.min(current.low, haOpen, haClose),
                    close: haClose,
                    volume: current.volume,
                });
            }
        }
        return haData;
    }, []);

    const calculateIndicator = useCallback((indicatorConfig: IndicatorConfig, ohlcData: OHLCData[]) => {
        const closes = ohlcData.map((d) => d.close);
        const highs = ohlcData.map((d) => d.high);
        const lows = ohlcData.map((d) => d.low);
        const times = ohlcData.map((d) => d.time);

        switch (indicatorConfig.type) {
            case "sma": {
                const period = indicatorConfig.params.period || 20;
                const smaValues = SMA.calculate({ period, values: closes });
                return times.slice(period - 1).map((time, i) => ({
                    time,
                    value: smaValues[i],
                }));
            }
            case "ema": {
                const period = indicatorConfig.params.period || 20;
                const emaValues = EMA.calculate({ period, values: closes });
                return times.slice(period - 1).map((time, i) => ({
                    time,
                    value: emaValues[i],
                }));
            }
            case "rsi": {
                const period = indicatorConfig.params.period || 14;
                const rsiValues = RSI.calculate({ period, values: closes });
                return times.slice(period).map((time, i) => ({
                    time,
                    value: rsiValues[i],
                }));
            }
            case "macd": {
                const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = indicatorConfig.params;
                const macdResult = MACD.calculate({
                    fastPeriod,
                    slowPeriod,
                    signalPeriod,
                    SimpleMAOscillator: false,
                    SimpleMASignal: false,
                    values: closes,
                });
                const startIndex = slowPeriod - 1;
                return {
                    macd: times.slice(startIndex).map((time, i) => ({
                        time,
                        value: macdResult[i]?.MACD || 0,
                    })),
                    signal: times.slice(startIndex).map((time, i) => ({
                        time,
                        value: macdResult[i]?.signal || 0,
                    })),
                    histogram: times.slice(startIndex).map((time, i) => ({
                        time,
                        value: macdResult[i]?.histogram || 0,
                        color: (macdResult[i]?.histogram || 0) >= 0 ? "#10B981" : "#EF4444",
                    })),
                };
            }
            case "bb": {
                const { period = 20, stdDev = 2 } = indicatorConfig.params;
                const bbResult = BollingerBands.calculate({
                    period,
                    stdDev,
                    values: closes,
                });
                return {
                    upper: times.slice(period - 1).map((time, i) => ({
                        time,
                        value: bbResult[i]?.upper || 0,
                    })),
                    middle: times.slice(period - 1).map((time, i) => ({
                        time,
                        value: bbResult[i]?.middle || 0,
                    })),
                    lower: times.slice(period - 1).map((time, i) => ({
                        time,
                        value: bbResult[i]?.lower || 0,
                    })),
                };
            }
            case "stoch": {
                const { period = 14, signalPeriod = 3 } = indicatorConfig.params;
                const stochResult = Stochastic.calculate({
                    high: highs,
                    low: lows,
                    close: closes,
                    period,
                    signalPeriod,
                });
                const startIndex = period + signalPeriod - 2;
                return {
                    k: times.slice(startIndex).map((time, i) => ({
                        time,
                        value: stochResult[i]?.k || 0,
                    })),
                    d: times.slice(startIndex).map((time, i) => ({
                        time,
                        value: stochResult[i]?.d || 0,
                    })),
                };
            }
            case "atr": {
                const period = indicatorConfig.params.period || 14;
                const atrResult = ATR.calculate({
                    high: highs,
                    low: lows,
                    close: closes,
                    period,
                });
                return times.slice(period).map((time, i) => ({
                    time,
                    value: atrResult[i] || 0,
                }));
            }
            case "vwap": {
                let cumulativeTPV = 0;
                let cumulativeVolume = 0;
                return ohlcData.map((d) => {
                    const typicalPrice = (d.high + d.low + d.close) / 3;
                    const volume = d.volume || 1;
                    cumulativeTPV += typicalPrice * volume;
                    cumulativeVolume += volume;
                    return {
                        time: d.time,
                        value: cumulativeTPV / cumulativeVolume,
                    };
                });
            }
            default:
                return [];
        }
    }, []);

    const handleChartClick = useCallback((param: { time?: Time; point?: { x: number; y: number } }) => {
        if (activeDrawingTool === "none" || !param.time || !chartRef.current || isDisposedRef.current) return;

        const price = mainSeriesRef.current?.coordinateToPrice(param.point?.y || 0) as number;
        if (!price) return;

        const point = { time: param.time, price };

        if (activeDrawingTool === "horizontal") {
            const newDrawing: Drawing = {
                id: `drawing-${Date.now()}`,
                type: "horizontal",
                points: [point, point],
                color: "#6366F1",
            };
            setDrawings((prev) => [...prev, newDrawing]);
            setActiveDrawingTool("none");
        } else if (activeDrawingTool === "vertical") {
            const newDrawing: Drawing = {
                id: `drawing-${Date.now()}`,
                type: "vertical",
                points: [point, point],
                color: "#6366F1",
            };
            setDrawings((prev) => [...prev, newDrawing]);
            setActiveDrawingTool("none");
        } else if (activeDrawingTool === "position-call" || activeDrawingTool === "position-put") {
            const isCall = activeDrawingTool === "position-call";
            const tp = isCall ? price * 1.02 : price * 0.98;
            const sl = isCall ? price * 0.99 : price * 1.01;
            
            const newDrawing: Drawing = {
                id: `drawing-${Date.now()}`,
                type: activeDrawingTool,
                points: [
                    { time: param.time, price: price },
                    { time: param.time, price: tp },
                    { time: param.time, price: sl },
                ],
                color: isCall ? "#10B981" : "#EF4444",
            };
            setDrawings((prev) => [...prev, newDrawing]);
            setActiveDrawingTool("none");
        } else {
            if (!isDrawing) {
                setCurrentDrawing({
                    id: `drawing-${Date.now()}`,
                    type: activeDrawingTool,
                    points: [point],
                    color: activeDrawingTool === "fibonacci" ? "#F59E0B" : "#6366F1",
                });
                setIsDrawing(true);
            } else if (currentDrawing) {
                const completedDrawing = {
                    ...currentDrawing,
                    points: [...currentDrawing.points, point],
                };
                setDrawings((prev) => [...prev, completedDrawing]);
                setCurrentDrawing(null);
                setIsDrawing(false);
                setActiveDrawingTool("none");
            }
        }
    }, [activeDrawingTool, isDrawing, currentDrawing]);

    const renderDrawings = useCallback(() => {
        if (!chartRef.current || isDisposedRef.current) return;

        drawingSeriesRef.current.forEach((series) => {
            try {
                chartRef.current?.removeSeries(series);
            } catch {
            }
        });
        drawingSeriesRef.current.clear();

        drawings.forEach((drawing) => {
            if (drawing.points.length < 1) return;

            try {
                if (drawing.type === "horizontal" && drawing.points[0]) {
                    const priceLine = mainSeriesRef.current?.createPriceLine({
                        price: drawing.points[0].price,
                        color: drawing.color,
                        lineWidth: 2,
                        lineStyle: LineStyle.Solid,
                        axisLabelVisible: true,
                        title: "",
                    });
                    if (priceLine) {
                    }
                } else if (drawing.type === "trendline" && drawing.points.length >= 2) {
                    const lineSeries = chartRef.current!.addLineSeries({
                        color: drawing.color,
                        lineWidth: 2,
                        crosshairMarkerVisible: false,
                        lastValueVisible: false,
                        priceLineVisible: false,
                    });
                    lineSeries.setData([
                        { time: drawing.points[0].time, value: drawing.points[0].price },
                        { time: drawing.points[1].time, value: drawing.points[1].price },
                    ]);
                    drawingSeriesRef.current.set(drawing.id, lineSeries);
                } else if (drawing.type === "fibonacci" && drawing.points.length >= 2) {
                    const startPrice = drawing.points[0].price;
                    const endPrice = drawing.points[1].price;
                    const diff = endPrice - startPrice;
                    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                    const colors = ["#EF4444", "#F59E0B", "#EAB308", "#22C55E", "#14B8A6", "#6366F1", "#8B5CF6"];

                    levels.forEach((level, idx) => {
                        const price = startPrice + diff * level;
                        mainSeriesRef.current?.createPriceLine({
                            price,
                            color: colors[idx],
                            lineWidth: 1,
                            lineStyle: LineStyle.Dashed,
                            axisLabelVisible: true,
                            title: `${(level * 100).toFixed(1)}%`,
                        });
                    });
                } else if ((drawing.type === "position-call" || drawing.type === "position-put") && drawing.points.length >= 3) {
                    const isCall = drawing.type === "position-call";
                    const entryPrice = drawing.points[0].price;
                    const tpPrice = drawing.points[1].price;
                    const slPrice = drawing.points[2].price;

                    mainSeriesRef.current?.createPriceLine({
                        price: entryPrice,
                        color: drawing.color,
                        lineWidth: 2,
                        lineStyle: LineStyle.Solid,
                        axisLabelVisible: true,
                        title: isCall ? "CALL" : "PUT",
                    });

                    mainSeriesRef.current?.createPriceLine({
                        price: tpPrice,
                        color: "#10B981",
                        lineWidth: 1,
                        lineStyle: LineStyle.Dashed,
                        axisLabelVisible: true,
                        title: "TP",
                    });

                    mainSeriesRef.current?.createPriceLine({
                        price: slPrice,
                        color: "#EF4444",
                        lineWidth: 1,
                        lineStyle: LineStyle.Dashed,
                        axisLabelVisible: true,
                        title: "SL",
                    });
                }
            } catch {
            }
        });
    }, [drawings]);

    const clearAllDrawings = () => {
        setDrawings([]);
        setCurrentDrawing(null);
        setIsDrawing(false);
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        isDisposedRef.current = false;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#0D1117" },
                textColor: "#9CA3AF",
            },
            grid: {
                vertLines: { color: chartSettings.showGrid ? "#1F2937" : "transparent" },
                horzLines: { color: chartSettings.showGrid ? "#1F2937" : "transparent" },
            },
            crosshair: {
                mode: chartSettings.showCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
                vertLine: {
                    color: "#6366F1",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#6366F1",
                },
                horzLine: {
                    color: "#6366F1",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#6366F1",
                },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: "#1F2937",
                barSpacing: 8,
            },
            rightPriceScale: {
                borderColor: "#1F2937",
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
        });

        chartRef.current = chart;

        chart.subscribeCrosshairMove((param) => {
            if (isDisposedRef.current) return;
            if (param.time && param.point) {
                const ohlcData = data.find((d) => d.time === param.time);
                setCrosshairData({
                    time: new Date((param.time as number) * 1000).toLocaleString(),
                    price: param.point.y?.toFixed(2) || "",
                    ohlc: ohlcData,
                });
            } else {
                setCrosshairData(null);
            }
        });

        chart.subscribeClick(handleChartClick);

        const resizeObserver = new ResizeObserver((entries) => {
            if (isDisposedRef.current) return;
            if (entries[0] && chartRef.current) {
                try {
                    chartRef.current.applyOptions({ width: entries[0].contentRect.width });
                } catch {
                }
            }
            if (entries[0] && rsiChartRef.current) {
                try {
                    rsiChartRef.current.applyOptions({ width: entries[0].contentRect.width });
                } catch {
                }
            }
        });

        resizeObserver.observe(chartContainerRef.current);

        return () => {
            isDisposedRef.current = true;
            resizeObserver.disconnect();
            safeRemoveChart(chartRef.current);
            chartRef.current = null;
            safeRemoveChart(rsiChartRef.current);
            rsiChartRef.current = null;
            mainSeriesRef.current = null;
            volumeSeriesRef.current = null;
            indicatorSeriesRef.current.clear();
            drawingSeriesRef.current.clear();
        };
    }, [height, chartSettings.showGrid, chartSettings.showCrosshair, handleChartClick]);

    useEffect(() => {
        if (!chartRef.current || data.length === 0 || isDisposedRef.current) return;

        try {
            indicatorSeriesRef.current.forEach((series) => {
                try {
                    chartRef.current?.removeSeries(series);
                } catch {
                }
            });
            indicatorSeriesRef.current.clear();

            if (mainSeriesRef.current) {
                try {
                    chartRef.current.removeSeries(mainSeriesRef.current);
                } catch {
                }
                mainSeriesRef.current = null;
            }

            if (volumeSeriesRef.current) {
                try {
                    chartRef.current.removeSeries(volumeSeriesRef.current);
                } catch {
                }
                volumeSeriesRef.current = null;
            }

            const chartData = chartType === "heikin-ashi" ? convertToHeikinAshi(data) : data;

            switch (chartType) {
                case "candlestick":
                case "heikin-ashi": {
                    const series = chartRef.current.addCandlestickSeries({
                        upColor: "#10B981",
                        downColor: "#EF4444",
                        borderVisible: false,
                        wickUpColor: "#10B981",
                        wickDownColor: "#EF4444",
                    });
                    series.setData(chartData as CandlestickData<Time>[]);
                    mainSeriesRef.current = series;
                    break;
                }
                case "line": {
                    const series = chartRef.current.addLineSeries({
                        color: "#6366F1",
                        lineWidth: 2,
                        crosshairMarkerVisible: true,
                        crosshairMarkerRadius: 4,
                    });
                    series.setData(
                        chartData.map((d) => ({ time: d.time, value: d.close })) as LineData<Time>[]
                    );
                    mainSeriesRef.current = series;
                    break;
                }
                case "area": {
                    const series = chartRef.current.addAreaSeries({
                        topColor: "rgba(99, 102, 241, 0.4)",
                        bottomColor: "rgba(99, 102, 241, 0.0)",
                        lineColor: "#6366F1",
                        lineWidth: 2,
                    });
                    series.setData(
                        chartData.map((d) => ({ time: d.time, value: d.close })) as LineData<Time>[]
                    );
                    mainSeriesRef.current = series;
                    break;
                }
                case "bars": {
                    const series = chartRef.current.addBarSeries({
                        upColor: "#10B981",
                        downColor: "#EF4444",
                    });
                    series.setData(chartData as CandlestickData<Time>[]);
                    mainSeriesRef.current = series;
                    break;
                }
            }

            if (showVolume) {
                const volumeSeries = chartRef.current.addHistogramSeries({
                    color: "#6366F1",
                    priceFormat: { type: "volume" },
                    priceScaleId: "volume",
                });
                volumeSeries.priceScale().applyOptions({
                    scaleMargins: { top: 0.85, bottom: 0 },
                });
                volumeSeries.setData(
                    chartData.map((d) => ({
                        time: d.time,
                        value: d.volume || 0,
                        color: d.close >= d.open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
                    })) as HistogramData<Time>[]
                );
                volumeSeriesRef.current = volumeSeries;
            }

            indicators.forEach((indicator, index) => {
                if (!indicator.visible || !chartRef.current) return;

                const indicatorData = calculateIndicator(indicator, data);

                if (indicator.type === "macd") {
                    const macdData = indicatorData as {
                        macd: LineData<Time>[];
                        signal: LineData<Time>[];
                        histogram: HistogramData<Time>[];
                    };
                    const macdLine = chartRef.current.addLineSeries({
                        color: "#6366F1",
                        lineWidth: 1,
                        priceScaleId: "macd",
                    });
                    macdLine.setData(macdData.macd);
                    indicatorSeriesRef.current.set(`${indicator.id}-macd`, macdLine);

                    const signalLine = chartRef.current.addLineSeries({
                        color: "#F59E0B",
                        lineWidth: 1,
                        priceScaleId: "macd",
                    });
                    signalLine.setData(macdData.signal);
                    indicatorSeriesRef.current.set(`${indicator.id}-signal`, signalLine);
                } else if (indicator.type === "bb") {
                    const bbData = indicatorData as {
                        upper: LineData<Time>[];
                        middle: LineData<Time>[];
                        lower: LineData<Time>[];
                    };
                    const upperLine = chartRef.current.addLineSeries({
                        color: indicator.color,
                        lineWidth: 1,
                        lineStyle: 2,
                    });
                    upperLine.setData(bbData.upper);
                    indicatorSeriesRef.current.set(`${indicator.id}-upper`, upperLine);

                    const middleLine = chartRef.current.addLineSeries({
                        color: indicator.color,
                        lineWidth: 1,
                    });
                    middleLine.setData(bbData.middle);
                    indicatorSeriesRef.current.set(`${indicator.id}-middle`, middleLine);

                    const lowerLine = chartRef.current.addLineSeries({
                        color: indicator.color,
                        lineWidth: 1,
                        lineStyle: 2,
                    });
                    lowerLine.setData(bbData.lower);
                    indicatorSeriesRef.current.set(`${indicator.id}-lower`, lowerLine);
                } else if (indicator.type === "stoch") {
                    const stochData = indicatorData as {
                        k: LineData<Time>[];
                        d: LineData<Time>[];
                    };
                    const kLine = chartRef.current.addLineSeries({
                        color: "#6366F1",
                        lineWidth: 1,
                        priceScaleId: "stoch",
                    });
                    kLine.setData(stochData.k);
                    indicatorSeriesRef.current.set(`${indicator.id}-k`, kLine);

                    const dLine = chartRef.current.addLineSeries({
                        color: "#F59E0B",
                        lineWidth: 1,
                        priceScaleId: "stoch",
                    });
                    dLine.setData(stochData.d);
                    indicatorSeriesRef.current.set(`${indicator.id}-d`, dLine);
                } else if (indicator.type === "rsi") {
                } else {
                    const lineSeries = chartRef.current.addLineSeries({
                        color: indicator.color || INDICATOR_COLORS[index % INDICATOR_COLORS.length],
                        lineWidth: 2,
                    });
                    lineSeries.setData(indicatorData as LineData<Time>[]);
                    indicatorSeriesRef.current.set(indicator.id, lineSeries);
                }
            });

            renderDrawings();
        } catch {
        }
    }, [chartType, data, showVolume, indicators, calculateIndicator, convertToHeikinAshi, renderDrawings]);

    useEffect(() => {
        const rsiIndicator = indicators.find((i) => i.type === "rsi" && i.visible);
        
        if (!rsiIndicator || !rsiContainerRef.current || isDisposedRef.current) {
            if (rsiChartRef.current) {
                safeRemoveChart(rsiChartRef.current);
                rsiChartRef.current = null;
            }
            return;
        }

        if (rsiChartRef.current) {
            safeRemoveChart(rsiChartRef.current);
            rsiChartRef.current = null;
        }

        try {
            const rsiChart = createChart(rsiContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: "#0D1117" },
                    textColor: "#9CA3AF",
                },
                grid: {
                    vertLines: { color: "#1F2937" },
                    horzLines: { color: "#1F2937" },
                },
                timeScale: {
                    visible: false,
                },
                rightPriceScale: {
                    borderColor: "#1F2937",
                    scaleMargins: { top: 0.1, bottom: 0.1 },
                },
                width: rsiContainerRef.current.clientWidth,
                height: 100,
                crosshair: {
                    mode: CrosshairMode.Normal,
                    vertLine: { visible: false },
                    horzLine: { color: "#6366F1", width: 1, style: 2 },
                },
            });

            rsiChartRef.current = rsiChart;

            const rsiData = calculateIndicator(rsiIndicator, data) as LineData<Time>[];
            
            const rsiSeries = rsiChart.addLineSeries({
                color: rsiIndicator.color,
                lineWidth: 2,
                priceLineVisible: false,
            });
            rsiSeries.setData(rsiData);

            const overBought = rsiChart.addLineSeries({
                color: "#EF4444",
                lineWidth: 1,
                lineStyle: 2,
                priceLineVisible: false,
            });
            overBought.setData(rsiData.map((d) => ({ time: d.time, value: 70 })));

            const overSold = rsiChart.addLineSeries({
                color: "#10B981",
                lineWidth: 1,
                lineStyle: 2,
                priceLineVisible: false,
            });
            overSold.setData(rsiData.map((d) => ({ time: d.time, value: 30 })));
        } catch {
        }
    }, [indicators, data, calculateIndicator]);

    useEffect(() => {
        renderDrawings();
    }, [renderDrawings]);

    const handleTimeframeChange = (tf: string) => {
        setTimeframe(tf);
        onTimeframeChange?.(tf);
    };

    const addIndicator = (type: string) => {
        const indicatorDef = availableIndicators.find((i) => i.id === type);
        if (!indicatorDef) return;

        const params: Record<string, number> = {};
        Object.entries(indicatorDef.params).forEach(([key, value]) => {
            params[key] = value;
        });

        const newIndicator: IndicatorConfig = {
            id: `${type}-${Date.now()}`,
            type,
            params,
            color: INDICATOR_COLORS[indicators.length % INDICATOR_COLORS.length],
            visible: true,
        };

        setIndicators([...indicators, newIndicator]);
        setShowIndicatorPanel(false);
    };

    const removeIndicator = (id: string) => {
        setIndicators(indicators.filter((i) => i.id !== id));
    };

    const toggleIndicator = (id: string) => {
        setIndicators(
            indicators.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i))
        );
    };

    const hasRSI = indicators.some((i) => i.type === "rsi" && i.visible);

    return (
        <div className="bg-[#0D1117] rounded-xl overflow-hidden border border-[#1F2937]">
            {showToolbar && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] bg-[#0D1117]">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowChartTypeMenu(!showChartTypeMenu);
                                    setShowIndicatorPanel(false);
                                    setShowSettingsMenu(false);
                                    setShowDrawingTools(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-text-secondary"
                            >
                                {chartTypes.find((ct) => ct.type === chartType)?.icon}
                                <span className="text-sm">{chartTypes.find((ct) => ct.type === chartType)?.label}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showChartTypeMenu && (
                                <div className="absolute top-full left-0 mt-2 bg-[#1F2937] rounded-lg shadow-xl border border-[#374151] z-50 py-1 min-w-[160px]">
                                    {chartTypes.map((ct) => (
                                        <button
                                            key={ct.type}
                                            onClick={() => {
                                                setChartType(ct.type);
                                                setShowChartTypeMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#374151] transition-colors ${
                                                chartType === ct.type ? "text-accent-primary" : "text-text-secondary"
                                            }`}
                                        >
                                            {ct.icon}
                                            <span className="text-sm">{ct.label}</span>
                                            {chartType === ct.type && (
                                                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-[#374151]" />

                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowIndicatorPanel(!showIndicatorPanel);
                                    setShowChartTypeMenu(false);
                                    setShowSettingsMenu(false);
                                    setShowDrawingTools(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-text-secondary"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-sm">Indicators</span>
                                {indicators.length > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-accent-primary text-white text-xs">
                                        {indicators.length}
                                    </span>
                                )}
                            </button>

                            {showIndicatorPanel && (
                                <div className="absolute top-full left-0 mt-2 bg-[#1F2937] rounded-lg shadow-xl border border-[#374151] z-50 py-2 min-w-[240px] max-h-[400px] overflow-y-auto">
                                    <div className="px-4 py-2 border-b border-[#374151]">
                                        <p className="text-xs text-text-muted uppercase tracking-wide">Add Indicator</p>
                                    </div>
                                    {availableIndicators.map((ind) => (
                                        <button
                                            key={ind.id}
                                            onClick={() => addIndicator(ind.id)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#374151] transition-colors text-text-secondary"
                                        >
                                            <span className="text-sm">{ind.name}</span>
                                        </button>
                                    ))}

                                    {indicators.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 border-t border-[#374151] mt-2">
                                                <p className="text-xs text-text-muted uppercase tracking-wide">Active</p>
                                            </div>
                                            {indicators.map((ind) => (
                                                <div
                                                    key={ind.id}
                                                    className="flex items-center justify-between px-4 py-2 hover:bg-[#374151]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: ind.color }}
                                                        />
                                                        <span className="text-sm text-text-secondary">
                                                            {availableIndicators.find((a) => a.id === ind.type)?.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => toggleIndicator(ind.id)}
                                                            className={`p-1 rounded ${ind.visible ? "text-accent-primary" : "text-text-muted"}`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                {ind.visible ? (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                ) : (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                                )}
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => removeIndicator(ind.id)}
                                                            className="p-1 rounded text-text-muted hover:text-loss"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-[#374151]" />

                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowDrawingTools(!showDrawingTools);
                                    setShowChartTypeMenu(false);
                                    setShowIndicatorPanel(false);
                                    setShowSettingsMenu(false);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                    activeDrawingTool !== "none" ? "bg-accent-primary text-white" : "bg-[#1F2937] hover:bg-[#374151] text-text-secondary"
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span className="text-sm">Draw</span>
                            </button>

                            {showDrawingTools && (
                                <div className="absolute top-full left-0 mt-2 bg-[#1F2937] rounded-lg shadow-xl border border-[#374151] z-50 py-2 min-w-[180px]">
                                    <div className="px-4 py-2 border-b border-[#374151]">
                                        <p className="text-xs text-text-muted uppercase tracking-wide">Drawing Tools</p>
                                    </div>
                                    {drawingTools.map((tool) => (
                                        <button
                                            key={tool.type}
                                            onClick={() => {
                                                setActiveDrawingTool(tool.type);
                                                setShowDrawingTools(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#374151] transition-colors ${
                                                activeDrawingTool === tool.type ? "text-accent-primary" : "text-text-secondary"
                                            }`}
                                        >
                                            {tool.icon}
                                            <span className="text-sm">{tool.label}</span>
                                        </button>
                                    ))}
                                    {drawings.length > 0 && (
                                        <>
                                            <div className="h-px bg-[#374151] my-2" />
                                            <button
                                                onClick={() => {
                                                    clearAllDrawings();
                                                    setShowDrawingTools(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#374151] transition-colors text-loss"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                <span className="text-sm">Clear All</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-[#374151]" />

                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowSettingsMenu(!showSettingsMenu);
                                    setShowChartTypeMenu(false);
                                    setShowIndicatorPanel(false);
                                    setShowDrawingTools(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors text-text-secondary"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>

                            {showSettingsMenu && (
                                <div className="absolute top-full left-0 mt-2 bg-[#1F2937] rounded-lg shadow-xl border border-[#374151] z-50 py-2 min-w-[180px]">
                                    <button
                                        onClick={() => setChartSettings({ ...chartSettings, showGrid: !chartSettings.showGrid })}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#374151] transition-colors text-text-secondary"
                                    >
                                        <span className="text-sm">Grid Lines</span>
                                        <div className={`w-8 h-5 rounded-full transition-colors ${chartSettings.showGrid ? "bg-accent-primary" : "bg-[#374151]"}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${chartSettings.showGrid ? "translate-x-3.5" : "translate-x-0.5"}`} />
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setChartSettings({ ...chartSettings, showCrosshair: !chartSettings.showCrosshair })}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#374151] transition-colors text-text-secondary"
                                    >
                                        <span className="text-sm">Crosshair</span>
                                        <div className={`w-8 h-5 rounded-full transition-colors ${chartSettings.showCrosshair ? "bg-accent-primary" : "bg-[#374151]"}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${chartSettings.showCrosshair ? "translate-x-3.5" : "translate-x-0.5"}`} />
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setShowVolume(!showVolume)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#374151] transition-colors text-text-secondary"
                                    >
                                        <span className="text-sm">Volume</span>
                                        <div className={`w-8 h-5 rounded-full transition-colors ${showVolume ? "bg-accent-primary" : "bg-[#374151]"}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${showVolume ? "translate-x-3.5" : "translate-x-0.5"}`} />
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {activeDrawingTool !== "none" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary/20 rounded-lg">
                                <span className="text-xs text-accent-primary">
                                    Drawing: {drawingTools.find((t) => t.type === activeDrawingTool)?.label}
                                </span>
                                <button
                                    onClick={() => {
                                        setActiveDrawingTool("none");
                                        setCurrentDrawing(null);
                                        setIsDrawing(false);
                                    }}
                                    className="text-accent-primary hover:text-white"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {crosshairData?.ohlc && (
                            <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="text-text-muted">O <span className="text-text-primary">{crosshairData.ohlc.open.toFixed(2)}</span></span>
                                <span className="text-text-muted">H <span className="text-profit">{crosshairData.ohlc.high.toFixed(2)}</span></span>
                                <span className="text-text-muted">L <span className="text-loss">{crosshairData.ohlc.low.toFixed(2)}</span></span>
                                <span className="text-text-muted">C <span className="text-text-primary">{crosshairData.ohlc.close.toFixed(2)}</span></span>
                            </div>
                        )}

                        <div className="flex items-center gap-1 bg-[#1F2937] rounded-lg p-1">
                            {timeframes.map((tf) => (
                                <button
                                    key={tf.value}
                                    onClick={() => handleTimeframeChange(tf.value)}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                        timeframe === tf.value
                                            ? "bg-accent-primary text-white"
                                            : "text-text-muted hover:text-text-primary"
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div ref={chartContainerRef} style={{ height }} className={activeDrawingTool !== "none" ? "cursor-crosshair" : ""} />

            {hasRSI && (
                <div className="border-t border-[#1F2937]">
                    <div className="px-4 py-1 flex items-center justify-between bg-[#0D1117]">
                        <span className="text-xs text-text-muted font-mono">RSI (14)</span>
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-profit">70</span>
                            <span className="text-loss">30</span>
                        </div>
                    </div>
                    <div ref={rsiContainerRef} style={{ height: 100 }} />
                </div>
            )}

            {indicators.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 border-t border-[#1F2937] bg-[#0D1117] overflow-x-auto">
                    {indicators.map((ind) => (
                        <div
                            key={ind.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                ind.visible ? "bg-[#1F2937]" : "bg-[#1F2937]/50 opacity-50"
                            }`}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: ind.color }}
                            />
                            <span className="text-text-secondary">
                                {availableIndicators.find((a) => a.id === ind.type)?.name}
                                {ind.params.period && ` (${ind.params.period})`}
                            </span>
                            <button
                                onClick={() => removeIndicator(ind.id)}
                                className="text-text-muted hover:text-loss ml-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProChart;
