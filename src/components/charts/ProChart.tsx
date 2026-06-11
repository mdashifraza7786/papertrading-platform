"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { init, dispose, Chart, OverlayMode } from "klinecharts";

export interface OHLCData {
    time: number; // For lightweight-charts it was seconds, we'll convert to ms for KLineChart
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

interface ProChartProps {
    symbol: string;
    data: OHLCData[];
    height?: number;
    showToolbar?: boolean;
    showVolume?: boolean;
    defaultTimeframe?: string;
    onTimeframeChange?: (timeframe: string) => void;
}

const timeframes = [
    { label: "1m", value: "1m" },
    { label: "5m", value: "5m" },
    { label: "15m", value: "15m" },
    { label: "1H", value: "1h" },
    { label: "4H", value: "4h" },
    { label: "1D", value: "1d" },
];

const availableIndicators = [
    { id: "MA", name: "MA" },
    { id: "EMA", name: "EMA" },
    { id: "SMA", name: "SMA" },
    { id: "BBI", name: "BBI" },
    { id: "VOL", name: "VOL" },
    { id: "MACD", name: "MACD" },
    { id: "BOLL", name: "BOLL" },
    { id: "KDJ", name: "KDJ" },
    { id: "RSI", name: "RSI" },
    { id: "BIAS", name: "BIAS" },
    { id: "BRAR", name: "BRAR" },
    { id: "CCI", name: "CCI" },
    { id: "DMI", name: "DMI" },
    { id: "CR", name: "CR" },
    { id: "PSY", name: "PSY" },
    { id: "DMA", name: "DMA" },
    { id: "TRIX", name: "TRIX" },
    { id: "OBV", name: "OBV" },
    { id: "VR", name: "VR" },
    { id: "WR", name: "WR" },
    { id: "MTM", name: "MTM" },
    { id: "EMV", name: "EMV" },
    { id: "SAR", name: "SAR" },
    { id: "AO", name: "AO" },
    { id: "ROC", name: "ROC" },
    { id: "PVT", name: "PVT" },
    { id: "AVEDEV", name: "AVEDEV" },
];

const drawingTools = [
    { type: "horizontalStraightLine", label: "Horizontal Line" },
    { type: "verticalStraightLine", label: "Vertical Line" },
    { type: "segment", label: "Trend Line" },
    { type: "rayLine", label: "Ray Line" },
    { type: "fibonacciLine", label: "Fibonacci" },
    { type: "parallelStraightLine", label: "Parallel Channel" },
    { type: "priceLine", label: "Price Line" },
];

const ProChart: React.FC<ProChartProps> = ({
    symbol,
    data,
    height = 550,
    showToolbar = true,
    showVolume = true,
    defaultTimeframe = "1m",
    onTimeframeChange,
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const [chartType, setChartType] = useState<"candle_solid" | "candle_stroke" | "ohlc" | "area">("candle_solid");
    const [timeframe, setTimeframe] = useState(defaultTimeframe);

    // UI state
    const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
    const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
    const [showDrawingTools, setShowDrawingTools] = useState(false);
    const [activeDrawingTool, setActiveDrawingTool] = useState<string>("none");
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [chartId] = useState(`kline-chart-${Math.random().toString(36).substring(2, 9)}`);

    const [mainIndicators, setMainIndicators] = useState<string[]>(["MA"]);
    const [subIndicators, setSubIndicators] = useState<string[]>(showVolume ? ["VOL"] : []);

    // Format data for KLineChart
    const formatData = useCallback((rawData: OHLCData[]) => {
        return rawData.map(d => ({
            timestamp: d.time * 1000,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume || 0,
        }));
    }, []);

    useEffect(() => {
        const chartContainer = chartContainerRef.current;
        if (!chartContainer) return;
        
        // Natively dispose any lingering Strict Mode instance BEFORE initializing
        try {
            dispose(chartContainer);
        } catch (e) {}

        // Initialize KLineChart with Groww Light Theme colors
        const chart = init(chartContainer, {
            styles: {
                grid: {
                    show: true,
                    horizontal: { show: true, size: 1, color: '#E8F0EA', style: 'solid' },
                    vertical: { show: true, size: 1, color: '#E8F0EA', style: 'solid' },
                },
                candle: {
                    type: 'candle_solid',
                    bar: {
                        upColor: '#00B050',
                        downColor: '#EF4444',
                        noChangeColor: '#888888',
                        upBorderColor: '#00B050',
                        downBorderColor: '#EF4444',
                        noChangeBorderColor: '#888888',
                        upWickColor: '#00B050',
                        downWickColor: '#EF4444',
                        noChangeWickColor: '#888888',
                    },
                    priceMark: {
                        show: true,
                        high: {
                            show: true,
                            color: '#00B050',
                            textMargin: 5,
                            textSize: 10,
                            textFamily: 'Inter',
                            textWeight: 'normal',
                        },
                        low: {
                            show: true,
                            color: '#EF4444',
                            textMargin: 5,
                            textSize: 10,
                            textFamily: 'Inter',
                            textWeight: 'normal',
                        },
                        last: {
                            show: true,
                            upColor: '#00B050',
                            downColor: '#EF4444',
                            noChangeColor: '#888888',
                            line: { show: true, style: 'dashed', dashValue: [4, 4], size: 1 },
                            text: {
                                show: true,
                                size: 12,
                                paddingLeft: 4,
                                paddingTop: 4,
                                paddingRight: 4,
                                paddingBottom: 4,
                                color: '#FFFFFF',
                                family: 'Inter',
                                weight: 'bold',
                                borderRadius: 4,
                            },
                        },
                    },
                    tooltip: {
                        showRule: 'always',
                        showType: 'standard',
                        custom: (data: any) => {
                            return [
                                { title: 'O', value: data.current.open?.toFixed(2) },
                                { title: 'H', value: data.current.high?.toFixed(2) },
                                { title: 'L', value: data.current.low?.toFixed(2) },
                                { title: 'C', value: data.current.close?.toFixed(2) },
                                { title: 'V', value: data.current.volume?.toFixed(2) }
                            ];
                        },
                        text: { size: 12, family: 'Inter', color: '#485A4A', marginLeft: 8, marginTop: 6, marginRight: 8, marginBottom: 0 },
                    },
                },
                indicator: {
                    ohlc: {
                        upColor: 'rgba(0, 176, 80, 0.2)',
                        downColor: 'rgba(239, 68, 68, 0.2)',
                        noChangeColor: '#888888'
                    },
                    bars: [{
                        style: 'fill',
                        borderStyle: 'solid',
                        borderSize: 1,
                        borderDashedValue: [2, 2],
                        upColor: 'rgba(0, 176, 80, 0.35)',
                        downColor: 'rgba(239, 68, 68, 0.35)',
                        noChangeColor: '#888888'
                    }],
                    lines: [
                        { style: 'solid', smooth: false, size: 1, dashedValue: [2, 2], color: '#F59E0B' },
                        { style: 'solid', smooth: false, size: 1, dashedValue: [2, 2], color: '#6366F1' },
                        { style: 'solid', smooth: false, size: 1, dashedValue: [2, 2], color: '#EC4899' },
                        { style: 'solid', smooth: false, size: 1, dashedValue: [2, 2], color: '#14B8A6' },
                        { style: 'solid', smooth: false, size: 1, dashedValue: [2, 2], color: '#F97316' }
                    ],
                },
                xAxis: {
                    show: true,
                    size: 'auto',
                    axisLine: { show: true, color: '#DCE6DE', size: 1 },
                    tickText: { show: true, color: '#72905A', family: 'Inter', weight: 'normal', size: 11, paddingBottom: 6, paddingTop: 6 },
                    tickLine: { show: true, size: 1, length: 3, color: '#DCE6DE' },
                },
                yAxis: {
                    show: true,
                    size: 'auto',
                    position: 'right',
                    type: 'normal',
                    inside: false,
                    reverse: false,
                    axisLine: { show: true, color: '#DCE6DE', size: 1 },
                    tickText: { show: true, color: '#72905A', family: 'Inter', weight: 'normal', size: 11, paddingLeft: 6, paddingRight: 6 },
                    tickLine: { show: true, size: 1, length: 3, color: '#DCE6DE' },
                },
                crosshair: {
                    show: true,
                    horizontal: {
                        show: true,
                        line: { show: true, style: 'dashed', dashValue: [4, 2], size: 1, color: '#00B050' },
                        text: {
                            show: true,
                            color: '#FFFFFF',
                            size: 12,
                            family: 'Inter',
                            weight: 'bold',
                            paddingLeft: 4,
                            paddingRight: 4,
                            paddingTop: 4,
                            paddingBottom: 4,
                            backgroundColor: '#00B050',
                        },
                    },
                    vertical: {
                        show: true,
                        line: { show: true, style: 'dashed', dashValue: [4, 2], size: 1, color: '#00B050' },
                        text: {
                            show: true,
                            color: '#FFFFFF',
                            size: 12,
                            family: 'Inter',
                            weight: 'bold',
                            paddingLeft: 4,
                            paddingRight: 4,
                            paddingTop: 4,
                            paddingBottom: 4,
                            backgroundColor: '#00B050',
                        },
                    },
                },
                overlay: {
                    point: {
                        color: '#00B050',
                        borderColor: 'rgba(0, 176, 80, 0.15)',
                        borderSize: 1,
                        radius: 4,
                        activeColor: '#00B050',
                        activeBorderColor: 'rgba(0, 176, 80, 0.3)',
                        activeBorderSize: 2,
                        activeRadius: 6,
                    },
                    line: {
                        style: 'solid',
                        smooth: false,
                        color: '#6366F1',
                        size: 2,
                        dashedValue: [2, 2],
                    },
                    polygon: {
                        style: 'stroke',
                        color: '#6366F1',
                        size: 2,
                        dashedValue: [2, 2],
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                }
            } as any
        });

        if (!chart) return;
        chartRef.current = chart;

        // Load data
        if (data && data.length > 0) {
            chart.applyNewData(formatData(data));
        }

        // Apply default indicators safely using explicit pane IDs
        mainIndicators.forEach(ind => {
            chart.removeIndicator('candle_pane', ind);
            chart.createIndicator(ind, false, { id: 'candle_pane' });
        });
        
        subIndicators.forEach(ind => {
            const paneId = `pane_${ind}`;
            chart.removeIndicator(paneId, ind);
            chart.createIndicator(ind, false, { id: paneId });
        });

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.resize();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            try {
                if (chartContainer) {
                    dispose(chartContainer);
                }
            } catch (e) {}
            chartRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update data when it changes
    useEffect(() => {
        if (chartRef.current && data && data.length > 0) {
            chartRef.current.applyNewData(formatData(data));
        }
    }, [data, formatData]);

    // Handle full screen resize
    useEffect(() => {
        if (chartRef.current) {
            setTimeout(() => {
                chartRef.current?.resize();
            }, 50);
        }
    }, [isFullScreen]);

    const handleTimeframeChange = (tf: string) => {
        setTimeframe(tf);
        onTimeframeChange?.(tf);
    };

    const toggleChartType = (type: "candle_solid" | "candle_stroke" | "ohlc" | "area") => {
        if (!chartRef.current) return;
        chartRef.current.setStyles({ candle: { type: type as any } });
        setChartType(type);
        setShowChartTypeMenu(false);
    };

    const toggleMainIndicator = (name: string) => {
        if (!chartRef.current) return;

        if (mainIndicators.includes(name)) {
            chartRef.current.removeIndicator('candle_pane', name);
            setMainIndicators(prev => prev.filter(i => i !== name));
        } else {
            chartRef.current.createIndicator(name, false, { id: 'candle_pane' });
            setMainIndicators(prev => [...prev, name]);
        }
    };

    const toggleSubIndicator = (name: string) => {
        if (!chartRef.current) return;
        
        const paneId = `pane_${name}`;
        if (subIndicators.includes(name)) {
            // Passing only the paneId destroys the entire pane cleanly
            chartRef.current.removeIndicator(paneId);
            setSubIndicators(prev => prev.filter(i => i !== name));
        } else {
            chartRef.current.createIndicator(name, false, { id: paneId });
            setSubIndicators(prev => [...prev, name]);
        }
    };

    const handleDrawingToolClick = (toolName: string) => {
        if (!chartRef.current) return;

        if (activeDrawingTool === toolName) {
            chartRef.current.overrideOverlay({ mode: OverlayMode.Normal });
            setActiveDrawingTool("none");
        } else {
            // Create overlay with right-click to delete functionality
            chartRef.current.createOverlay({
                name: toolName,
                onRightClick: (event: any) => {
                    if (event.overlay && event.overlay.id) {
                        chartRef.current?.removeOverlay(event.overlay.id);
                        return true;
                    }
                    return false;
                }
            });
            setActiveDrawingTool(toolName);
        }
        setShowDrawingTools(false);
    };

    const clearDrawings = () => {
        if (chartRef.current) {
            chartRef.current.removeOverlay();
        }
        setShowDrawingTools(false);
    };

    return (
        <div
            className={`bg-white transition-all duration-200 flex flex-col ${isFullScreen
                    ? "fixed inset-0 z-[100] w-full h-screen p-4"
                    : "relative rounded-2xl overflow-hidden w-full"
                }`}
            style={!isFullScreen ? { height, border: "1px solid rgb(220 230 222)" } : {}}
        >
            {showToolbar && (
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #DCE6DE", background: "#fff" }}>
                    <div className="flex items-center gap-2">
                        {/* Chart Type */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowChartTypeMenu(!showChartTypeMenu);
                                    setShowIndicatorPanel(false);
                                    setShowDrawingTools(false);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                                style={{ background: "#F0F7F2", color: "#485A4A" }}>
                                <span>{chartType.includes("candle") ? "Candles" : chartType === "area" ? "Area" : "Bars"}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showChartTypeMenu && (
                                <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg py-1 min-w-[160px] z-50" style={{ border: "1px solid #DCE6DE" }}>
                                    {[
                                        { type: "candle_solid", label: "Candles" },
                                        { type: "candle_stroke", label: "Hollow Candles" },
                                        { type: "area", label: "Area" },
                                        { type: "ohlc", label: "Bars" }
                                    ].map((ct) => (
                                        <button
                                            key={ct.type}
                                            onClick={() => toggleChartType(ct.type as any)}
                                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors text-sm ${chartType === ct.type ? "text-accent-primary bg-accent-light" : "text-text-secondary hover:bg-background-tertiary"
                                                }`}
                                        >
                                            <span className="font-medium">{ct.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px" style={{ background: "#DCE6DE" }} />

                        {/* Indicators */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowIndicatorPanel(!showIndicatorPanel);
                                    setShowChartTypeMenu(false);
                                    setShowDrawingTools(false);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                                style={{ background: "#F0F7F2", color: "#485A4A" }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Indicators</span>
                                {(mainIndicators.length + subIndicators.length) > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-accent-primary text-white text-xs">
                                        {mainIndicators.length + subIndicators.length}
                                    </span>
                                )}
                            </button>

                            {showIndicatorPanel && (
                                <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg py-2 min-w-[320px] max-h-[400px] overflow-y-auto z-50 flex gap-4" style={{ border: "1px solid #DCE6DE" }}>
                                    <div className="flex-1 border-r border-border pl-2 pr-4">
                                        <div className="px-2 py-2 mb-1 border-b border-border">
                                            <p className="text-xs text-text-muted uppercase tracking-wide font-bold">Main Pane</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                            {availableIndicators.slice(0, 4).map((ind) => (
                                                <button
                                                    key={ind.id}
                                                    onClick={() => toggleMainIndicator(ind.id)}
                                                    className={`px-3 py-1.5 text-left rounded transition-colors text-xs font-medium ${mainIndicators.includes(ind.id) ? "bg-accent-primary text-white" : "hover:bg-background-tertiary text-text-secondary"
                                                        }`}
                                                >
                                                    {ind.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-[2] pr-2">
                                        <div className="px-2 py-2 mb-1 border-b border-border">
                                            <p className="text-xs text-text-muted uppercase tracking-wide font-bold">Sub Pane</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            {availableIndicators.slice(4).map((ind) => (
                                                <button
                                                    key={ind.id}
                                                    onClick={() => toggleSubIndicator(ind.id)}
                                                    className={`px-3 py-1.5 text-left rounded transition-colors text-xs font-medium ${subIndicators.includes(ind.id) ? "bg-accent-primary text-white" : "hover:bg-background-tertiary text-text-secondary"
                                                        }`}
                                                >
                                                    {ind.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px" style={{ background: "#DCE6DE" }} />

                        {/* Drawings */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowDrawingTools(!showDrawingTools);
                                    setShowChartTypeMenu(false);
                                    setShowIndicatorPanel(false);
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${activeDrawingTool !== "none" ? "bg-accent-primary text-white" : "text-text-secondary"
                                    }`}
                                style={activeDrawingTool === "none" ? { background: "#F0F7F2", color: "#485A4A" } : {}}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span>Draw</span>
                            </button>

                            {showDrawingTools && (
                                <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg py-2 min-w-[180px] z-50" style={{ border: "1px solid #DCE6DE" }}>
                                    <div className="px-4 py-2" style={{ borderBottom: "1px solid #DCE6DE" }}>
                                        <p className="text-xs text-text-muted uppercase tracking-wide font-bold">Drawing Tools</p>
                                    </div>
                                    {drawingTools.map((tool) => (
                                        <button
                                            key={tool.type}
                                            onClick={() => handleDrawingToolClick(tool.type)}
                                            className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-background-tertiary transition-colors text-sm font-medium ${activeDrawingTool === tool.type ? "text-accent-primary bg-accent-light" : "text-text-secondary"
                                                }`}
                                        >
                                            <span>{tool.label}</span>
                                        </button>
                                    ))}
                                    <div className="h-px my-2" style={{ background: "#DCE6DE" }} />
                                    <button
                                        onClick={clearDrawings}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-background-tertiary transition-colors text-loss text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Clear All</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {activeDrawingTool !== "none" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-light rounded-lg">
                                <span className="text-xs font-semibold text-accent-primary">
                                    Drawing Mode Active
                                </span>
                                <button
                                    onClick={() => handleDrawingToolClick("none")}
                                    className="text-accent-primary hover:text-loss transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#F0F7F2" }}>
                            {timeframes.map((tf) => (
                                <button
                                    key={tf.value}
                                    onClick={() => handleTimeframeChange(tf.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${timeframe === tf.value
                                            ? "bg-accent-primary text-white shadow-sm"
                                            : "text-text-secondary hover:text-text-primary"
                                        }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>

                        {/* Fullscreen Toggle */}
                        <div className="h-6 w-px" style={{ background: "#DCE6DE" }} />
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-1.5 bg-white border border-[#DCE6DE] rounded-lg shadow-sm hover:bg-[#F0F7F2] text-[#485A4A] transition-colors flex items-center justify-center group"
                            title={isFullScreen ? "Exit Fullscreen" : "Maximize Chart"}
                        >
                            {isFullScreen ? (
                                <svg className="w-5 h-5 group-hover:text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 group-hover:text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 relative w-full h-full">
                <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
            </div>
        </div>
    );
};

export default ProChart;
