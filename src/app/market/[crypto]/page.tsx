"use client"
import React, { useEffect, useRef, useState } from 'react';
import { createChart, Time } from 'lightweight-charts';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Loader from '@/app/loding';
import { getCryptoName } from '@/util/getCryptoName';

interface DetailsProps {
  islogged: boolean;
  walletBalance: number;
  getWalletBalance: () => void;
}

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const Details: React.FC<DetailsProps> = ({ islogged, walletBalance, getWalletBalance }) => {
  const { crypto } = useParams();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0.01);
  const [payable, setPayable] = useState<number>(0);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>('');

  const changeQuantity = (increment: boolean) => {
    if (increment) {
      setQuantity(prevQuantity => prevQuantity + 0.01); // Increase by 0.01 (or any other increment)
    } else {
      if (quantity > 0.02) {
        setQuantity(prevQuantity => prevQuantity - 0.01); // Decrease by 0.01 (or any other decrement), ensure quantity doesn't go below 0
      }
    }
  };

  useEffect(() => {
    if (!crypto) return;

    const selectedSymbol = (crypto as string).toLowerCase() + "usdt";
    const forhistory = selectedSymbol.toUpperCase();

    const chartProperties = {
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
    };

    const chart = createChart(chartContainerRef.current!, chartProperties);
    const candleSeries = chart.addCandlestickSeries();

    const convertToIST = (timestamp: number) => {
      const date = new Date(timestamp);
      date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      return date.getTime();
    };

    const fetchChartData = async () => {
      try {
        const response = await axios.post('/api/marketdata', { symbol: forhistory, interval: "1m" });
        const cdata: CandlestickData[] = response.data.map((d: number[]) => ({
          time: convertToIST(Math.round(d[0] / 1000)), // Ensure time is assigned correctly
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        setLoaded(true);

        candleSeries.setData(cdata);

      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchChartData();

    const wsURL = `wss://fstream.binance.com/ws/${selectedSymbol}@kline_1m`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      setLoaded(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const kLine = msg.k;
      const pl: CandlestickData = {
        time: convertToIST(Math.round(kLine.t / 1000)) as Time,
        open: parseFloat(kLine.o),
        high: parseFloat(kLine.h),
        low: parseFloat(kLine.l),
        close: parseFloat(kLine.c),
      };
      candleSeries.update(pl);
      setPrice(pl.close);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
      chart.remove();
    };
  }, [crypto]);

  useEffect(() => {
    setPayable(price * quantity);
    if (price * quantity > 10000) {
      setInputError('Insufficient balance');
    } else {
      setInputError('');
    }
  }, [price, quantity]);

  const handlePay = () => {
    if (quantity <= 0) {
      setInputError('Quantity should be greater than zero');
      return;
    }

    if (price * quantity > 10000) {
      setInputError('Insufficient balance');
      return;
    }

    axios.post('/api/pay', { quantity, payable })
      .then(response => {
        if (response.data.success) {
          getWalletBalance();
        }
      })
      .catch(error => {
        console.error('Error making payment:', error);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value);
    if (!isNaN(newQuantity)) {
      setQuantity(newQuantity);
    } else {
      setQuantity(0);
    }
  };

  return (
    <>
      {!loaded && (
        <div className='absolute fixed w-screen h-[89vh] left-0 bottom-0 bg-white backdrop-blur-xl z-50'>
          <Loader />
        </div>
      )}
      <div className='flex justify-between gap-10'>
        <div id="chart-container" className='w-[75%] border-2 overflow-hidden rounded-lg -z-d10 border-primary flex justify-center items-center'>
          <div ref={chartContainerRef} style={{ width: '100%', height: '35.8rem' }} />
        </div>
        <div className="h-full w-[25%] r">
          <div className='h-[30rem] relative px-5 py-3 bg-white shadow-[0_0_5px_1px_#ddd] rounded-lg'>
            <div>
              <h1 className='text-black font-semibold text-lg uppercase tracking-widest'>{getCryptoName(crypto as string)}</h1>
              <h3 className='text-sm'>${price.toFixed(2)}</h3>
              <div className='bg-gray-300 h-[1.5px] my-2 w-full absolute left-0'></div>
              <div className='mt-10 flex gap-5'>
                <button className='rounded-lg w-[40px] h-[40px] text-3xl flex justify-center items-center bg-green-600 text-white' onClick={() => changeQuantity(false)}>-</button>
                <input
                  type="number"
                  value={quantity === 0 ? '' : quantity.toFixed(2)}
                  onChange={handleInputChange}
                  className={`w-[65%] rounded-lg text-xl text-center outline-none ${inputError ? 'border-[1.5px] border-red-500' : ' border-[1.5px] border-gray-400'}`}
                />
                <button className='rounded-lg w-[40px] h-[40px] text-3xl flex justify-center items-center bg-green-600 text-white' onClick={() => changeQuantity(true)}>+</button>
              </div>
              {inputError && <p className="text-red-500 mt-1">{inputError}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Details;