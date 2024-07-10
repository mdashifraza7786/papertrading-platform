"use client"
import React, { useEffect, useRef, useState } from 'react';
import { createChart, Time } from 'lightweight-charts';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Loader from '@/app/loding';
import { getCryptoName } from '@/util/getCryptoName';
import { ToastContainer, toast } from 'react-toastify';
import { ThreeDots } from 'react-loader-spinner';

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

const Details: React.FC = () => {
  const { uniqueid } = useParams();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number | string>(0.1);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>('');
  const [walletData, setWalletData] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [investmentLoad, setInvestmentLoad] = useState<Investment[] | null>(null);

  useEffect(() => {
    const getInvestment = async () => {
      try {
        const res = await axios.get('/api/investment?investment=' + uniqueid);
        setInvestmentLoad(res.data);
      } catch (error) {
        console.error('Error fetching investment:', error);
      }
    };
    if (uniqueid) {
      getInvestment();
    }
  }, [uniqueid,walletData]);

  const symbol = investmentLoad ? investmentLoad[0]?.symbol : null;
  const havingquantities = investmentLoad ? parseFloat(investmentLoad[0]?.quantity.$numberDecimal) : 0;



  useEffect(() => {
    if (!symbol) {
      window.location.href = "/investment"
      return
    }

    const selectedSymbol = symbol.toLowerCase() + "usdt";
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
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${forhistory}&interval=1m&limit=19999000000`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();

        if (!Array.isArray(responseData)) {
          throw new Error('Expected an array in response, but received something else.');
        }

        const cdata: CandlestickData[] = responseData.map((d: number[]) => ({
          time: convertToIST(Math.round(d[0] / 1000)) as Time,
          open: Number(d[1]),
          high: Number(d[2]),
          low: Number(d[3]),
          close: Number(d[4]),
        }));

        candleSeries.setData(cdata);

      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchChartData();

    const wsURL = `wss://fstream.binance.com/ws/${selectedSymbol}@kline_1m`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
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
  }, [symbol]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value);
    if (!isNaN(newQuantity)) {
      setQuantity(newQuantity);
    } else {
      setQuantity('');
    }
  };

  const SellNowHandle = async () => {
    setLoading(true);
    if (typeof quantity !== 'number' || quantity <= 0 || quantity > havingquantities) {
      setLoading(false);
      toast.error("Invalid quantity or quantity exceeds holdings");
      return;
    }
    try {
      const response = await axios.post('/api/sellStock', {
        id: uniqueid,
        priceat:price
      });
      setWalletData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  return (
    <>
      {!loaded && (
        <div className='fixed w-screen h-[89vh] left-0 bottom-0 bg-white backdrop-blur-xl z-50'>
          <Loader />
        </div>
      )}
      {symbol && (
        <div className='mb-10'>
          <h1 className='text-3xl font-semibold'>{getCryptoName(symbol)} ({symbol})</h1>
        </div>
      )}
      <div className='flex justify-between gap-10'>
        <div id="chart-container" className='w-[75%] border-2 overflow-hidden rounded-lg -z-d10 border-primary flex justify-center items-center'>
          <div ref={chartContainerRef} style={{ width: '100%', height: '35.8rem' }} />
        </div>
        <div className="h-full w-[25%] r">
          <div className='h-[30rem] relative px-5 py-3 bg-white shadow-[0_0_5px_1px_#ddd] rounded-lg'>
            <div>
              <h1 className='text-black font-semibold text-lg uppercase tracking-widest'>{getCryptoName(symbol as string)}</h1>
              <h3 className='text-sm'>${price.toFixed(2)}</h3>
              <div className='bg-gray-300 h-[1.5px] my-2 w-full absolute left-0'></div>
              <div className='mt-10 flex gap-5'>
                <input
                  type="number"
                  onChange={handleInputChange}
                  value={havingquantities}
                  disabled
                  readOnly
                  className={`w-[100%] h-[40px] rounded-lg text-xl text-center outline-none ${inputError ? 'border-[1.5px] border-red-500' : ' border-[1.5px] border-gray-400'}`}
                />
              </div>
              {inputError && <p className="text-red-500 mt-1">{inputError}</p>}
            </div>

            <div className='absolute bottom-5 left-0 w-full'>
              <div className='flex w-[100%] justify-between text-[12px] px-6'>
                <p className='font-semibold text-gray-700'>Balance: ${walletData.toFixed(2)}</p>
                <p className='font-semibold text-gray-700 '>Estimate : ${(havingquantities as number* price).toFixed(2)}</p>
              </div>
              <div className='flex justify-center items-center' >
                <button onClick={SellNowHandle} className={`w-[88%] flex justify-center items-center rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 mt-5 ${quantity as number > 0 && Number(quantity) <= havingquantities ? "" : "disabled:cursor-not-allowed disabled:bg-red-400 disabled:text-gray-200"}`} disabled={quantity as number > 0 && Number(quantity) <= havingquantities ? false : true}>
                  {loading ? (
                    <ThreeDots
                      visible={true}
                      height={23}
                      width={50}
                      color="#ffffff"
                      radius="3"
                      ariaLabel="three-dots-loading"
                      wrapperStyle={{}}
                      wrapperClass=""
                    />
                  ) : (
                    'Sell'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Details;
