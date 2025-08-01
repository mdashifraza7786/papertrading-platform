"use client"
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, Time } from 'lightweight-charts';
import axios from 'axios';
import { useParams } from 'next/navigation';
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
    const symbol = `${normalizedCrypto}USDT`;
    
    fetchChartData(symbol, newTimeframe);
  };

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

  const setupWebSocket = (symbol: string, chart: any, candleSeries: any, volumeSeries: any, interval: string) => {
    try {
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
      };
      
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
            
            candleSeries.update(updatedCandle);
            
            if (volumeSeries) {
              volumeSeries.update({
                time: Math.floor(candle.t / 1000) as Time,
                value: parseFloat(candle.v),
                color: parseFloat(candle.c) >= parseFloat(candle.o) ? '#26a69a' : '#ef5350',
              });
            }
            
            const newPrice = updatedCandle.close;
            setLastPrice(price);
            setPrice(newPrice);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error("Connection error. Real-time updates may be unavailable.");
      };
      
      return ws;
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setError("Failed to establish real-time connection.");
      return null;
    }
  };

  const toggleSMA = () => {
    if (!crypto) return;
    
    const newValue = !showSMA;
    
    setShowSMA(newValue);
    
    if (chartContainerRef.current) {
      while (chartContainerRef.current.firstChild) {
        chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
      }
      
      const normalizedCrypto = (crypto as string).toUpperCase();
      const symbol = `${normalizedCrypto}USDT`;
      
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
          if (newValue) {
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
    
    const newValue = !showVolume;
    
    setShowVolume(newValue);
    
    if (chartContainerRef.current) {
      while (chartContainerRef.current.firstChild) {
        chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
      }
      
      const normalizedCrypto = (crypto as string).toUpperCase();
      const symbol = `${normalizedCrypto}USDT`;
      
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
          
          let volumeSeries = null;
          if (newValue) {
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

  useEffect(() => {
    if (!crypto) return;

    const normalizedCrypto = (crypto as string).toUpperCase();
    const symbol = `${normalizedCrypto}USDT`;

    const loadingTimeout = setTimeout(() => {
      if (!loaded) {
        setLoaded(true);
      }
    }, 10000);

    const fetch24hPriceChange = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch 24h data');
        }
        
        const data = await response.json();
        if (data) {
          if (data.priceChangePercent) {
            setPriceChangePercent(parseFloat(data.priceChangePercent));
          }
          if (data.highPrice) setDayHigh(parseFloat(data.highPrice));
          if (data.lowPrice) setDayLow(parseFloat(data.lowPrice));
          if (data.volume) setVolume(parseFloat(data.volume));
        }
      } catch (err) {
        console.error('Error fetching 24h price change:', err);
      }
    };

    const fetchWalletData = async () => {
      try {
        const response = await axios.get('/api/getWallet');
        setWalletData(response.data);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast.error("Failed to load wallet data");
      }
    };

    fetchWalletData();
    fetch24hPriceChange();
    
    let chartCleanup: (() => void) | undefined = undefined;
    
    const setupChart = async () => {
      try {
        chartCleanup = await fetchChartData(symbol, timeframe);
        setLoaded(true);
      } catch (err) {
        console.error("Error setting up chart:", err);
        setLoaded(true);
        setError("Failed to initialize chart. Please try again.");
      }
    };
    
    setupChart();
    
    const priceChangeInterval = setInterval(fetch24hPriceChange, 60000);

    return () => {
      clearTimeout(loadingTimeout);
      if (chartCleanup) {
        chartCleanup();
      }
      clearInterval(priceChangeInterval);
    };
  }, [crypto, timeframe]);

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
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
      {!loaded && (
        <div className='fixed w-full h-full left-0 top-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center'>
          <Loader />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{cryptoName} ({crypto})</h1>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-semibold">{formatCurrency(price)}</span>
                  <span className={`ml-2 ${priceChangeClass} text-sm font-medium`}>
                    {priceChangePercent >= 0 ? '▲' : '▼'} {formatPercentage(priceChangePercent)}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 rounded-lg self-start">
                <span className="text-sm text-gray-600 block mb-1">Wallet Balance</span>
                <div className="text-lg font-bold">{formatCurrency(walletData)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">24h High</span>
                <div className="font-semibold">{formatCurrency(dayHigh)}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">24h Low</span>
                <div className="font-semibold">{formatCurrency(dayLow)}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">24h Volume</span>
                <div className="font-semibold">{formatNumber(volume)} {crypto}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Market Cap</span>
                <div className="font-semibold">-</div>
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-medium">Price Chart ({timeframe})</h2>
              <div className="flex items-center">
                <div className="flex space-x-1 text-sm mr-4">
                  <button 
                    onClick={() => changeTimeframe('1m')}
                    className={`px-2 py-1 rounded ${timeframe === '1m' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  >1m</button>
                  <button 
                    onClick={() => changeTimeframe('5m')}
                    className={`px-2 py-1 rounded ${timeframe === '5m' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  >5m</button>
                  <button 
                    onClick={() => changeTimeframe('15m')}
                    className={`px-2 py-1 rounded ${timeframe === '15m' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  >15m</button>
                  <button 
                    onClick={() => changeTimeframe('1h')}
                    className={`px-2 py-1 rounded ${timeframe === '1h' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  >1h</button>
                  <button 
                    onClick={() => changeTimeframe('4h')}
                    className={`px-2 py-1 rounded ${timeframe === '4h' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  >4h</button>
                  <button 
                    onClick={() => changeTimeframe('1d')}
                    className={`px-2 py-1 rounded ${timeframe === '1d' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  >1d</button>
                </div>
                
                <div className="flex space-x-2 text-sm">
                  <button 
                    onClick={toggleSMA}
                    className={`px-2 py-1 rounded flex items-center ${showSMA ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
                    SMA
                  </button>
                  <button 
                    onClick={toggleVolume}
                    className={`px-2 py-1 rounded flex items-center ${showVolume ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
                    Volume
                  </button>
                </div>
              </div>
            </div>
            <div ref={chartContainerRef} className="w-full h-[300px] sm:h-[400px] md:h-[500px]" />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden lg:sticky lg:top-4">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Trade {crypto}</h2>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Price
                </label>
                <div className="text-2xl font-bold">{formatCurrency(price)}</div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button 
                    onClick={decrementQuantity}
                    className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantity}
                    onChange={handleInputChange}
                    className={`w-full py-2 px-2 sm:px-3 text-center text-lg outline-none ${inputError ? 'bg-red-50' : ''}`}
                  />
                  <button 
                    onClick={incrementQuantity}
                    className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xl font-bold transition"
                  >
                    +
                  </button>
                </div>
                {inputError && (
                  <p className="mt-2 text-sm text-red-600">{inputError}</p>
                )}
              </div>

              <div className="mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Cost</span>
                  <span className="font-medium">{formatCurrency(payable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance After</span>
                  <span className="font-medium">{formatCurrency(Math.max(0, walletData - payable))}</span>
                </div>
              </div>

              <button
                onClick={BuyNowHandle}
                disabled={loading || !!inputError || typeof quantity !== 'number' || quantity <= 0}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white
                  ${(loading || !!inputError || typeof quantity !== 'number' || quantity <= 0)
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                  } transition flex justify-center items-center`}
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
                  `Buy ${crypto}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Details;