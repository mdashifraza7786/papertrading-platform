"use client"
import { useEffect, useRef, useState } from 'react';
import { createChart, Time } from 'lightweight-charts';
import { getCryptoName } from '@/util/getCryptoName';
import { ThreeDots } from 'react-loader-spinner';
import { toast } from 'react-toastify';
import axios from 'axios';

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Investment {
  uniqueid: number;
  quantity: { $numberDecimal: string };
  price: { $numberDecimal: string };
  actiontype: string;
  symbol: string;
  __v: number;
}

interface InvestmentDetailsProps {
  investment: Investment | null;
  uniqueid: string;
  onSell: () => void;
}

const InvestmentDetails: React.FC<InvestmentDetailsProps> = ({ investment, uniqueid, onSell }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number>(0);
  const [walletData, setWalletData] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  
  const symbol = investment ? investment.symbol : null;
  const havingQuantities = investment ? parseFloat(investment.quantity.$numberDecimal) : 0;
  const buyPrice = investment ? parseFloat(investment.price.$numberDecimal) : 0;
  
  const currentValue = price * havingQuantities;
  const investmentValue = buyPrice * havingQuantities;
  const profitLoss = currentValue - investmentValue;
  const profitLossPercentage = investmentValue > 0 ? (profitLoss / investmentValue) * 100 : 0;
  const isProfitable = profitLoss >= 0;

  useEffect(() => {
    if (!symbol) {
      return;
    }

    const selectedSymbol = symbol.toLowerCase() + "usdt";
    const forhistory = selectedSymbol.toUpperCase();

    const chartProperties = {
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
      width: chartContainerRef.current?.clientWidth,
      height: 400,
    };

    const chart = createChart(chartContainerRef.current!, chartProperties);
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const convertToIST = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.getTime();
    };

    const fetchWalletData = async () => {
      try {
        const response = await axios.get('/api/getWallet');
        setWalletData(response.data);
        setLoaded(true);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      }
    };

    fetchWalletData();

    const fetchChartData = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${forhistory}&interval=1m&limit=200`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();

        if (!Array.isArray(responseData)) {
          throw new Error('Expected an array in response, but received something else.');
        }

        const cdata: CandlestickData[] = responseData.map((d: number[]) => ({
          time: Math.floor(d[0] / 1000) as Time,
          open: Number(d[1]),
          high: Number(d[2]),
          low: Number(d[3]),
          close: Number(d[4]),
        }));

        candleSeries.setData(cdata);
        
        if (cdata.length > 0) {
          setPrice(cdata[cdata.length - 1].close);
        }

      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchChartData();

    const wsURL = `wss://fstream.binance.com/ws/${selectedSymbol}@kline_1m`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && msg.k) {
          const kLine = msg.k;
          const pl: CandlestickData = {
            time: Math.floor(kLine.t / 1000) as Time,
            open: parseFloat(kLine.o),
            high: parseFloat(kLine.h),
            low: parseFloat(kLine.l),
            close: parseFloat(kLine.c),
          };
          candleSeries.update(pl);
          setPrice(pl.close);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newWidth = entries[0].contentRect.width;
      chart.applyOptions({ width: newWidth });
    });
    
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      ws.close();
      chart.remove();
      resizeObserver.disconnect();
    };
  }, [symbol]);

  const handleSellNow = async () => {
    setLoading(true);
    try {
      await axios.post('/api/sellStock', {
        id: uniqueid,
        priceat: price
      });
      
      toast.success(`Successfully sold ${havingQuantities} ${symbol}`);
      onSell();
    } catch (error) {
      console.error('Error selling investment:', error);
      toast.error("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!investment || !symbol) {
    return (
      <div className="card p-6 text-center">
        <p>Loading investment details...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{getCryptoName(symbol)} ({symbol})</h2>
            <div className="flex items-center mt-1">
              <span className="text-lg font-medium">${price.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-500 block">Wallet Balance</span>
            <span className="font-bold">${walletData.toFixed(2)}</span>
          </div>
        </div>
        
        <div ref={chartContainerRef} className="w-full h-[400px] mt-4 border border-gray-100 rounded-lg" />
      </div>
      
      <div className="lg:col-span-1">
        <div className="card p-6 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Investment Details</h2>
          
          <div className="space-y-4 mb-6 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-xs text-gray-500">Quantity</span>
                <div className="font-semibold">{havingQuantities} {symbol}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-xs text-gray-500">Buy Price</span>
                <div className="font-semibold">${buyPrice.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-xs text-gray-500">Current Price</span>
              <div className="font-semibold">${price.toFixed(2)}</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-xs text-gray-500">Investment Value</span>
              <div className="font-semibold">${investmentValue.toFixed(2)}</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-xs text-gray-500">Current Value</span>
              <div className="font-semibold">${currentValue.toFixed(2)}</div>
            </div>
            
            <div className={`p-3 rounded ${isProfitable ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="text-xs text-gray-500">Profit/Loss</span>
              <div className={`font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                {isProfitable ? '+' : ''}{profitLoss.toFixed(2)} ({isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSellNow}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition flex justify-center items-center"
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
              `Sell ${symbol}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetails;