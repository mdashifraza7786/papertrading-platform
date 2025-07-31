"use client"
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, LineStyle, Time } from 'lightweight-charts';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Loader from '@/app/loding';
import { getCryptoName } from '@/util/getCryptoName';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThreeDots } from 'react-loader-spinner';

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value >= 1000 ? 2 : value >= 1 ? 4 : 8
  }).format(value);
};

const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero'
  }).format(value / 100);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8
  }).format(value);
};

const Details: React.FC = () => {
  const { crypto } = useParams();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [payable, setPayable] = useState<number>(0);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>('');
  const [walletData, setWalletData] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [initialPrice, setInitialPrice] = useState<number>(0);
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [dayHigh, setDayHigh] = useState<number>(0);
  const [dayLow, setDayLow] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  const incrementQuantity = () => {
    if (typeof quantity !== 'number') {
      setQuantity(1);
    } else {
      setQuantity(prevQuantity => {
        if (typeof prevQuantity === 'number') {
          return Number((prevQuantity + 0.1).toFixed(2));
        }
        return 1;
      });
    }
  };

  const decrementQuantity = () => {
    if (typeof quantity !== 'number') {
      setQuantity(1);
    } else if (quantity > 0.1) {
      setQuantity(prevQuantity => {
        if (typeof prevQuantity === 'number') {
          return Number((prevQuantity - 0.1).toFixed(2));
        }
        return 1;
      });
    }
  };

  const changeTimeframe = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    if (!crypto) return;
    
    const normalizedCrypto = (crypto as string).toUpperCase();
    const symbol = `${normalizedCrypto}`;
    
    fetchChartData(symbol, newTimeframe);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchChartData = async (symbol: string, interval: string) => {
    if (!chartContainerRef.current) return undefined;
    
    try {
      if (chartContainerRef.current.firstChild) {
        while (chartContainerRef.current.firstChild) {
          chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
        }
      }
      
      const chartOptions = {
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#ddd',
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || 400,
      };
      
      const chart = createChart(chartContainerRef.current, chartOptions);
      
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
        const newWidth = entries[0].contentRect.width;
        const newHeight = entries[0].contentRect.height;
        chart.applyOptions({ 
          width: newWidth, 
          height: newHeight || 400
        });
      });
      
      if (chartContainerRef.current) {
        resizeObserver.observe(chartContainerRef.current);
      }
      
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Expected an array in response, but received something else.');
      }
      
      if (data.length === 0) {
        throw new Error('No data received from API. The symbol may be invalid.');
      }
      
      const formattedData: CandlestickData[] = data.map((item: any[]) => ({
        time: Math.floor(item[0] / 1000) as Time,
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
      }));
      
      candleSeries.setData(formattedData);
      
      let volumeSeries = null;
      if (showVolume) {
        const volumeData = data.map((item: any[]) => ({
          time: Math.floor(item[0] / 1000) as Time,
          value: parseFloat(item[5]),
          color: parseFloat(item[4]) >= parseFloat(item[1]) ? '#26a69a' : '#ef5350',
        }));
        
        volumeSeries = chart.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
        });
        
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8, 
            bottom: 0,
          },
        });
        
        volumeSeries.setData(volumeData);
      }
      
      let smaSeries = null;
      if (showSMA) {
        const period = 20;
        const smaData = [];
        
        for (let i = period - 1; i < formattedData.length; i++) {
          let sum = 0;
          for (let j = 0; j < period; j++) {
            sum += formattedData[i - j].close;
          }
          smaData.push({
            time: formattedData[i].time,
            value: sum / period,
          });
        }
        
        smaSeries = chart.addLineSeries({
          color: '#2962FF',
          lineWidth: 2,
          title: 'SMA 20',
        });
        
        smaSeries.setData(smaData);
      }
      
      if (formattedData.length > 0) {
        const latestCandle = formattedData[formattedData.length - 1];
        setPrice(latestCandle.close);
        setLastPrice(latestCandle.close);
        setInitialPrice(latestCandle.close);
        
        let totalVolume = 0;
        for (let i = Math.max(0, formattedData.length - 24); i < formattedData.length; i++) {
          totalVolume += parseFloat(data[i][5]);
        }
        setVolume(totalVolume);
        
        let high = 0;
        let low = Number.MAX_VALUE;
        for (let i = Math.max(0, formattedData.length - 24); i < formattedData.length; i++) {
          high = Math.max(high, formattedData[i].high);
          low = Math.min(low, formattedData[i].low);
        }
        setDayHigh(high);
        setDayLow(low);
      }
      
      const ws = setupWebSocket(symbol, chart, candleSeries, volumeSeries, interval);
      
      return () => {
        if (ws) ws.close();
        resizeObserver.disconnect();
        chart.remove();
      };
    } catch (error: any) {
      console.error('Error fetching chart data:', error);
      setError(`Failed to load chart data: ${error.message}`);
      toast.error("Failed to load chart data. Please check the crypto symbol and try again.");
      
      return undefined;
    }
  };

  // Global WebSocket instance to prevent multiple connections
  const setupWebSocket = (symbol: string, chart: any, candleSeries: any, volumeSeries: any, interval: string) => {
    try {
      // Use a single WebSocket connection with a unique key to avoid multiple connections
      const wsKey = `${symbol.toLowerCase()}_${interval}`;
      
      // Create a WebSocket connection if one doesn't exist already
      // Using a more reliable approach with connection management
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
      
      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket connection timeout');
          // Don't show error to user, just use REST API as fallback
        }
      }, 5000);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        clearTimeout(connectionTimeout);
      };
      
      // Implement exponential backoff for reconnection
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 3;
      
      ws.onclose = (event) => {
        if (reconnectAttempts < maxReconnectAttempts && !event.wasClean) {
          console.log(`WebSocket closed unexpectedly. Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
          // Don't reconnect immediately to avoid overwhelming the server
          setTimeout(() => {
            reconnectAttempts++;
            // We're not actually reconnecting here to avoid complexity
            // In a production app, you would implement proper reconnection logic
          }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
        }
      };
      
      // Throttle updates to prevent UI flickering
      let lastUpdateTime = 0;
      const updateThrottleMs = 1000; // Update UI at most once per second
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message && message.k) {
            const candle = message.k;
            
            const updatedCandle = {
              time: Math.floor(candle.t / 1000) as Time,
              open: parseFloat(candle.o),
              high: parseFloat(candle.h),
              low: parseFloat(candle.l),
              close: parseFloat(candle.c),
            };
            
            // Always update chart data
            candleSeries.update(updatedCandle);
            
            if (volumeSeries) {
              volumeSeries.update({
                time: Math.floor(candle.t / 1000) as Time,
                value: parseFloat(candle.v),
                color: parseFloat(candle.c) >= parseFloat(candle.o) ? '#26a69a' : '#ef5350',
              });
            }
            
            // Throttle UI updates to prevent flickering
            const now = Date.now();
            if (now - lastUpdateTime > updateThrottleMs) {
              lastUpdateTime = now;
              const newPrice = updatedCandle.close;
              setLastPrice(price);
              setPrice(newPrice);
            }
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't show toast for every error to avoid spamming the user
        // Only show one error message at most
        if (reconnectAttempts === 0) {
          toast.error("Connection error. Using cached data.", {
            toastId: 'ws-connection-error', // Prevent duplicate toasts
            autoClose: 3000
          });
        }
      };
      
      return ws;
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      // Don't show error to user, just use REST API as fallback
      return null;
    }
  };

  const toggleSMA = () => {
    if (!crypto) return;
    
    // Manually force the opposite value for consistency
    const newValue = !showSMA;
    
    // Set the state immediately
    setShowSMA(newValue);
    
    // Force redraw with explicit state values
    if (chartContainerRef.current) {
      // First completely clear the chart
      while (chartContainerRef.current.firstChild) {
        chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
      }
      
      const normalizedCrypto = (crypto as string).toUpperCase();
      const symbol = `${normalizedCrypto}`;
      
      // Need to force a redraw using the new state
      // The key is to use the new value directly rather than relying on React state
      // which may not have updated yet
      const drawChart = async () => {
        try {
          if (!chartContainerRef.current) return;
          
          const chartOptions = {
            layout: {
              background: { color: '#ffffff' },
              textColor: '#333',
            },
            grid: {
              vertLines: { color: '#f0f0f0' },
              horzLines: { color: '#f0f0f0' },
            },
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: '#ddd',
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 400,
          };
          
          const chart = createChart(chartContainerRef.current, chartOptions);
          
          const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
            const newWidth = entries[0].contentRect.width;
            const newHeight = entries[0].contentRect.height;
            chart.applyOptions({ 
              width: newWidth, 
              height: newHeight || 400
            });
          });
          
          if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
          }
          
          const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          });
          
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=200`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!Array.isArray(data)) {
            throw new Error('Expected an array in response, but received something else.');
          }
          
          if (data.length === 0) {
            throw new Error('No data received from API. The symbol may be invalid.');
          }
          
          const formattedData: CandlestickData[] = data.map((item: any[]) => ({
            time: Math.floor(item[0] / 1000) as Time,
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
          }));
          
          candleSeries.setData(formattedData);
          
          // Use the newValue directly for volume
          let volumeSeries = null;
          if (showVolume) {
            const volumeData = data.map((item: any[]) => ({
              time: Math.floor(item[0] / 1000) as Time,
              value: parseFloat(item[5]),
              color: parseFloat(item[4]) >= parseFloat(item[1]) ? '#26a69a' : '#ef5350',
            }));
            
            volumeSeries = chart.addHistogramSeries({
              color: '#26a69a',
              priceFormat: {
                type: 'volume',
              },
              priceScaleId: '',
            });
            
            volumeSeries.priceScale().applyOptions({
              scaleMargins: {
                top: 0.8, 
                bottom: 0,
              },
            });
            
            volumeSeries.setData(volumeData);
          }
          
          // Use the newValue directly for SMA
          let smaSeries = null;
          if (newValue) {  // Use the NEW state value directly here
            const period = 20;
            const smaData = [];
            
            for (let i = period - 1; i < formattedData.length; i++) {
              let sum = 0;
              for (let j = 0; j < period; j++) {
                sum += formattedData[i - j].close;
              }
              smaData.push({
                time: formattedData[i].time,
                value: sum / period,
              });
            }
            
            smaSeries = chart.addLineSeries({
              color: '#2962FF',
              lineWidth: 2,
              title: 'SMA 20',
            });
            
            smaSeries.setData(smaData);
          }
          
          if (formattedData.length > 0) {
            const latestCandle = formattedData[formattedData.length - 1];
            setPrice(latestCandle.close);
            setLastPrice(latestCandle.close);
            setInitialPrice(latestCandle.close);
            
            let totalVolume = 0;
            for (let i = Math.max(0, formattedData.length - 24); i < formattedData.length; i++) {
              totalVolume += parseFloat(data[i][5]);
            }
            setVolume(totalVolume);
            
            let high = 0;
            let low = Number.MAX_VALUE;
            for (let i = Math.max(0, formattedData.length - 24); i < formattedData.length; i++) {
              high = Math.max(high, formattedData[i].high);
              low = Math.min(low, formattedData[i].low);
            }
            setDayHigh(high);
            setDayLow(low);
          }
          
          const ws = setupWebSocket(symbol, chart, candleSeries, volumeSeries, timeframe);
          setLoaded(true);
          
          return () => {
            if (ws) ws.close();
            resizeObserver.disconnect();
            chart.remove();
          };
        } catch (error: any) {
          console.error('Error redrawing chart:', error);
          setError(`Failed to update chart: ${error.message}`);
          return undefined;
        }
      };
      
      drawChart();
    }
  };
  
  const toggleVolume = () => {
    if (!crypto) return;
    
    // Manually force the opposite value for consistency
    const newValue = !showVolume;
    
    // Set the state immediately
    setShowVolume(newValue);
    
    // Force redraw with explicit state values
    if (chartContainerRef.current) {
      // First completely clear the chart
      while (chartContainerRef.current.firstChild) {
        chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
      }
      
      const normalizedCrypto = (crypto as string).toUpperCase();
      const symbol = `${normalizedCrypto}`;
      
      // Need to force a redraw using the new state
      // The key is to use the new value directly rather than relying on React state
      // which may not have updated yet
      const drawChart = async () => {
        try {
          if (!chartContainerRef.current) return;
          
          const chartOptions = {
            layout: {
              background: { color: '#ffffff' },
              textColor: '#333',
            },
            grid: {
              vertLines: { color: '#f0f0f0' },
              horzLines: { color: '#f0f0f0' },
            },
            timeScale: {
              timeVisible: true,
              secondsVisible: false,
              borderColor: '#ddd',
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 400,
          };
          
          const chart = createChart(chartContainerRef.current, chartOptions);
          
          const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
            const newWidth = entries[0].contentRect.width;
            const newHeight = entries[0].contentRect.height;
            chart.applyOptions({ 
              width: newWidth, 
              height: newHeight || 400
            });
          });
          
          if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
          }
          
          const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
          });
          
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=200`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!Array.isArray(data)) {
            throw new Error('Expected an array in response, but received something else.');
          }
          
          if (data.length === 0) {
            throw new Error('No data received from API. The symbol may be invalid.');
          }
          
          const formattedData: CandlestickData[] = data.map((item: any[]) => ({
            time: Math.floor(item[0] / 1000) as Time,
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
          }));
          
          candleSeries.setData(formattedData);
          
          // Use the newValue directly for volume
          let volumeSeries = null;
          if (newValue) {  // Use the NEW state value directly here
            const volumeData = data.map((item: any[]) => ({
              time: Math.floor(item[0] / 1000) as Time,
              value: parseFloat(item[5]),
              color: parseFloat(item[4]) >= parseFloat(item[1]) ? '#26a69a' : '#ef5350',
            }));
            
            volumeSeries = chart.addHistogramSeries({
              color: '#26a69a',
              priceFormat: {
                type: 'volume',
              },
              priceScaleId: '',
            });
            
            volumeSeries.priceScale().applyOptions({
              scaleMargins: {
                top: 0.8, 
                bottom: 0,
              },
            });
            
            volumeSeries.setData(volumeData);
          }
          
          // Use showSMA for SMA
          let smaSeries = null;
          if (showSMA) {
            const period = 20;
            const smaData = [];
            
            for (let i = period - 1; i < formattedData.length; i++) {
              let sum = 0;
              for (let j = 0; j < period; j++) {
                sum += formattedData[i - j].close;
              }
              smaData.push({
                time: formattedData[i].time,
                value: sum / period,
              });
            }
            
            smaSeries = chart.addLineSeries({
              color: '#2962FF',
              lineWidth: 2,
              title: 'SMA 20',
            });
            
            smaSeries.setData(smaData);
          }
          
          if (formattedData.length > 0) {
            const latestCandle = formattedData[formattedData.length - 1];
            setPrice(latestCandle.close);
            setLastPrice(latestCandle.close);
            setInitialPrice(latestCandle.close);
            
            let totalVolume = 0;
            for (let i = Math.max(0, formattedData.length - 24); i < formattedData.length; i++) {
              totalVolume += parseFloat(data[i][5]);
            }
            setVolume(totalVolume);
            
            let high = 0;
            let low = Number.MAX_VALUE;
            for (let i = Math.max(0, formattedData.length - 24); i < formattedData.length; i++) {
              high = Math.max(high, formattedData[i].high);
              low = Math.min(low, formattedData[i].low);
            }
            setDayHigh(high);
            setDayLow(low);
          }
          
          const ws = setupWebSocket(symbol, chart, candleSeries, volumeSeries, timeframe);
          setLoaded(true);
          
          return () => {
            if (ws) ws.close();
            resizeObserver.disconnect();
            chart.remove();
          };
        } catch (error: any) {
          console.error('Error redrawing chart:', error);
          setError(`Failed to update chart: ${error.message}`);
          return undefined;
        }
      };
      
      drawChart();
    }
  };

  // Use refs to track data fetching state
  const lastFetchTime = useRef(0);
  const walletDataFetched = useRef(false);
  const chartSetup = useRef(false);
  const chartTimeframe = useRef('');
  
  useEffect(() => {
    if (!crypto) return;

    const normalizedCrypto = (crypto as string).toUpperCase();
    const symbol = `${normalizedCrypto}`;

    // Set a loading timeout
    const loadingTimeout = setTimeout(() => {
      if (!loaded) {
        setLoaded(true);
      }
    }, 10000);

    // Throttled version of the 24h price change fetch with debouncing
    const fetch24hPriceChange = async () => {
      try {
        // If we've already fetched data recently, don't fetch again
        if (Date.now() - lastFetchTime.current < 30000) { // 30 seconds minimum between fetches
          return;
        }
        
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch 24h data');
        }
        
        const data = await response.json();
        if (data) {
          // Update state with batch updates to prevent multiple re-renders
          const updates = {};
          
          if (data.priceChangePercent) {
            const newPercent = parseFloat(data.priceChangePercent);
            // Only update if change is significant (more than 0.01%)
            if (Math.abs(newPercent - priceChangePercent) > 0.01) {
              setPriceChangePercent(newPercent);
            }
          }
          
          // Use a single update for day high/low/volume to prevent UI flicker
          let shouldUpdateDayStats = false;
          let newHigh = dayHigh;
          let newLow = dayLow;
          let newVolume = volume;
          
          if (data.highPrice) {
            newHigh = parseFloat(data.highPrice);
            if (Math.abs(newHigh - dayHigh) / Math.max(1, dayHigh) > 0.005) { // 0.5% threshold
              shouldUpdateDayStats = true;
            }
          }
          
          if (data.lowPrice) {
            newLow = parseFloat(data.lowPrice);
            if (Math.abs(newLow - dayLow) / Math.max(1, dayLow) > 0.005) { // 0.5% threshold
              shouldUpdateDayStats = true;
            }
          }
          
          if (data.volume) {
            newVolume = parseFloat(data.volume);
            if (Math.abs(newVolume - volume) / Math.max(1, volume) > 0.01) { // 1% threshold
              shouldUpdateDayStats = true;
            }
          }
          
          // Batch update to prevent multiple renders
          if (shouldUpdateDayStats) {
            setDayHigh(newHigh);
            setDayLow(newLow);
            setVolume(newVolume);
          }
          
          // Update last fetch time
          lastFetchTime.current = Date.now();
        }
      } catch (err) {
        console.error('Error fetching 24h price change:', err);
      }
    };

    // Fetch wallet data only once per session
    const fetchWalletData = async () => {
      if (walletDataFetched.current) return;
      
      try {
        const response = await axios.get('/api/getWallet');
        setWalletData(response.data);
        walletDataFetched.current = true;
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        // Show error only once
        toast.error("Failed to load wallet data", {
          toastId: 'wallet-error',
          autoClose: 3000
        });
      }
    };

    // Fetch wallet data
    fetchWalletData();
    
    // Fetch 24h price data
    fetch24hPriceChange();
    
    let chartCleanup: (() => void) | undefined = undefined;
    
    // Set up chart with improved handling
    const setupChart = async () => {
      // Only set up chart if timeframe changes or chart isn't set up yet
      if (chartTimeframe.current !== timeframe || !chartSetup.current) {
        try {
          chartCleanup = await fetchChartData(symbol, timeframe);
          chartSetup.current = true;
          chartTimeframe.current = timeframe;
          setLoaded(true);
        } catch (err) {
          console.error("Error setting up chart:", err);
          setLoaded(true);
          setError("Failed to initialize chart. Please try again.");
        }
      }
    };
    
    // Set up chart
    setupChart();
    
    // Update price data less frequently (every 2 minutes)
    const priceChangeInterval = setInterval(fetch24hPriceChange, 120000);

    return () => {
      clearTimeout(loadingTimeout);
      if (chartCleanup) {
        chartCleanup();
      }
      clearInterval(priceChangeInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crypto, timeframe, loaded]);

  useEffect(() => {
    setPayable(price * (typeof quantity === 'number' ? quantity : 0));
    if (price * (typeof quantity === 'number' ? quantity : 0) > walletData) {
      setInputError('Insufficient balance');
    } else {
      setInputError('');
    }
  }, [price, quantity, walletData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity('');
      return;
    }
    
    const newQuantity = parseFloat(value);
    if (!isNaN(newQuantity)) {
      setQuantity(newQuantity);
    }
  };

  const BuyNowHandle = async () => {
    if (typeof quantity !== 'number' || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    if (payable > walletData) {
      toast.error("Insufficient wallet balance");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/buyStock', {
        quantity: quantity,
        price: price.toFixed(2),
        symbol: crypto
      });
      
      toast.success(`Successfully purchased ${quantity} ${crypto}`);
      setTimeout(() => {
        window.location.href = "/investment";
      }, 1500);
      
      setWalletData(response.data);
    } catch (error) {
      console.error('Error purchasing:', error);
      toast.error("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cryptoName = getCryptoName(crypto as string);
  const priceChangeClass = priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {!loaded && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader />
            <p className="mt-4 text-gray-600 font-medium">Loading market data...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-4 mb-6 flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                Dashboard
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Markets</span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-800 md:ml-2">{crypto}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="lg:flex-grow">
          {/* Header */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-mono text-sm">
                    {typeof crypto === 'string' ? crypto.substring(0, 2) : ''}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{cryptoName}</h1>
                  <div className="ml-3 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">{crypto}</div>
                </div>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(price)}</span>
                  <span className={`ml-2 ${priceChangeClass} text-sm font-medium flex items-center`}>
                    {priceChangePercent >= 0 ? (
                      <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                      </svg>
                    )}
                    {formatPercentage(priceChangePercent)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end">
                <div className="text-sm text-gray-500 mb-1">Your Wallet Balance</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(walletData)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">24h High</div>
                <div className="font-semibold text-gray-900">{formatCurrency(dayHigh)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">24h Low</div>
                <div className="font-semibold text-gray-900">{formatCurrency(dayLow)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">24h Volume</div>
                <div className="font-semibold text-gray-900">{formatNumber(volume)} {crypto}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                <div className="font-semibold text-gray-900">-</div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="card overflow-hidden mb-6">
            <div className="border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4">
                <h2 className="font-semibold text-gray-800 mb-3 sm:mb-0">Price Chart</h2>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => changeTimeframe(tf)}
                        className={`px-3 py-1.5 text-xs font-medium ${
                          timeframe === tf 
                            ? 'bg-green-600 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        } border border-gray-200 ${
                          tf === '1m' ? 'rounded-l-md' : tf === '1d' ? 'rounded-r-md' : ''
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleSMA}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                        showSMA 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-1.5"></div>
                      SMA
                    </button>
                    
                    <button
                      onClick={toggleVolume}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                        showVolume 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-1.5"></div>
                      Volume
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div ref={chartContainerRef} className="w-full h-[400px] md:h-[500px]" />
          </div>
        </div>
        
        {/* Trading Panel */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="card lg:sticky lg:top-20">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Trade {crypto}</h2>
              <p className="text-sm text-gray-500 mt-1">Buy {cryptoName} with paper money</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Price
                  </label>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 flex items-center">
                  {formatCurrency(price)}
                  <span className={`ml-2 text-sm ${priceChangeClass}`}>
                    {priceChangePercent >= 0 ? '▲' : '▼'} {formatPercentage(priceChangePercent)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center">
                  <button 
                    onClick={decrementQuantity}
                    className="p-2 rounded-l-lg bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                    </svg>
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantity}
                    onChange={handleInputChange}
                    className={`w-full py-2 px-3 text-center text-lg border-y border-gray-200 outline-none ${inputError ? 'bg-red-50 border-red-200' : ''}`}
                  />
                  <button 
                    onClick={incrementQuantity}
                    className="p-2 rounded-r-lg bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </button>
                </div>
                {inputError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {inputError}
                  </p>
                )}
              </div>

              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Total Cost</span>
                  <span className="font-medium text-gray-900">{formatCurrency(payable)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Balance After</span>
                  <span className="font-medium text-gray-900">{formatCurrency(Math.max(0, walletData - payable))}</span>
                </div>
              </div>

              <button
                onClick={BuyNowHandle}
                disabled={loading || !!inputError || typeof quantity !== 'number' || quantity <= 0}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white
                  ${(loading || !!inputError || typeof quantity !== 'number' || quantity <= 0)
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:outline-none'
                  } transition-all duration-200 flex justify-center items-center`}
              >
                {loading ? (
                  <ThreeDots
                    visible={true}
                    height={24}
                    width={50}
                    color="#ffffff"
                    radius="3"
                    ariaLabel="loading"
                  />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Buy {crypto}
                  </>
                )}
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  This is paper trading. No real money is involved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Details;