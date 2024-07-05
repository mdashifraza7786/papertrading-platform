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

const Details: React.FC = () => {
  const { crypto } = useParams();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number | string>(0.1);
  const [sellquantity, setSellQuantity] = useState<number | string>(0);
  const [payable, setPayable] = useState<number>(0);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>('');
  const [inputSellError, setInputSellError] = useState<string>('');
  const [walletData, setWalletData] = useState<number>(0);
  const [getHoldingData, setGetHoldingData] = useState<number>(0);
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [loading, setLoading] = useState(false);

  const changeQuantity = (increment: boolean) => {
    if (increment) {
      if (typeof quantity !== 'number') {
        setQuantity(0.1);
      } else {
        setQuantity(prevQuantity => Number((prevQuantity as number + 0.1).toFixed(2)));
      }
    } else {
      if (typeof quantity !== 'number') {
        setQuantity(0.1);
      } else if (typeof quantity == 'number' && quantity > 0.01) {
        setQuantity(prevQuantity => Number((prevQuantity as number - 0.1).toFixed(2)));
      }
    }
  };
  const changeSellQuantity = (increment: boolean) => {
    if (increment) {
      if (typeof sellquantity !== 'number') {
        setSellQuantity(0);
      } else {
        setSellQuantity(prevQuantity => Number((prevQuantity as number + 0.1).toFixed(2)));
      }
    } else {
      if (typeof sellquantity !== 'number') {
        setSellQuantity(0);
      } else if (typeof sellquantity == 'number' && sellquantity > 0.01) {
        setSellQuantity(prevQuantity => Number((prevQuantity as number - 0.1).toFixed(2)));
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
    const fetchWalletData = async () => {
      try {
        const response = await axios.get('/api/getWallet');
        setWalletData(response.data);
        setLoaded(true);

      } catch (error) {
        console.error('Error fetching wallet data:', error);
      }
    };
    const fetchHoldings = async () => {
      try {
        const response = await axios.get('/api/getHoldings');
        const holdings = response.data.filter((item: any) => item.symbol === crypto);
        if (holdings.length > 0) {
          setGetHoldingData(parseFloat(holdings[0].totalQuantity.$numberDecimal));
        } else {
          setGetHoldingData(0);
        }
      } catch (error) {
        console.error('Error fetching holdings:', error);
      }
    };
    fetchWalletData();
    fetchHoldings();

    const fetchChartData = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${forhistory}&interval=1m&limit=19999000000`);

        if (!response.ok) {
          console.log(response)
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

        // setLoaded(true);
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
  }, [crypto]);

  useEffect(() => {
    setPayable(price * (typeof quantity === 'number' ? quantity : 0));
    if (price * (typeof quantity === 'number' ? quantity : 0) > walletData) {
      setInputError('Insufficient balance');
    } else {
      setInputError('');
    }
  }, [price, quantity]);

  useEffect(() => {
    if ((typeof sellquantity === 'number' ? sellquantity : 0) > getHoldingData) {
      setInputSellError('Insufficient balance');
    } else {
      setInputSellError('');
    }
  }, [sellquantity]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value);
    if (!isNaN(newQuantity)) {
      setQuantity(newQuantity);
    } else {
      setQuantity('');
    }
  };
  const handleSellInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value);
    if (!isNaN(newQuantity)) {
      setSellQuantity(newQuantity);
    } else {
      setSellQuantity('');
    }
  };

  const BuyNowHandle = async () => {
    setLoading(true);
    if (payable < 0) {
      setLoading(false);

      toast.error("Insufficient Wallet Balance");
      return;
    }
    try {
      const response = await axios.post('/api/buyStock', {
        quantity: quantity,
        price: price.toFixed(3),
        symbol: crypto
      });
      setWalletData(response.data);
      setLoading(false);


    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const SellNowHandle = async () => {
    setLoading(true);
    if (getHoldingData  <= 0) {
      setLoading(false);

      toast.error("You Do not have stock to sell");
      return;
    }
    try {
      const response = await axios.post('/api/sellStock', {
        quantity: quantity,
        price: price.toFixed(3),
        symbol: crypto
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
        <div className='absolute  w-screen h-[89vh] left-0 bottom-0 bg-white backdrop-blur-xl z-50'>
          <Loader />
        </div>
      )}
      <div className='mb-10 '>
        <h1 className='text-3xl font-semibold'>{getCryptoName(crypto as string)} ({crypto})</h1>
      </div>
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
              <div>
                <ul className='grid grid-cols-2 mt-5 gap-3 text-lg tracking-widest'>
                  <li onClick={() => setMode("buy")} className={`${mode === "buy" ? "swticher" : "swticher_not_applied"} cursor-pointer hover:bg-gray-50`}>Buy</li>
                  <li onClick={() => setMode("sell")} className={`${mode === "sell" ? "swticher" : "swticher_not_applied"} cursor-pointer hover:bg-gray-50`}>Sell</li>
                </ul>
              </div>

              {mode === "buy" && (
                <div className='mt-10 flex gap-5'>
                  <button className='rounded-lg w-[40px] h-[40px] text-3xl hover:bg-green-700 flex justify-center items-center bg-green-600 text-white' onClick={() => changeQuantity(false)}>-</button>
                  <input
                    type="number"
                    onChange={handleInputChange}
                    value={quantity}
                    className={`w-[65%] rounded-lg text-xl text-center outline-none ${inputError ? 'border-[1.5px] border-red-500' : ' border-[1.5px] border-gray-400'}`}
                  />
                  <button className='rounded-lg w-[40px] h-[40px] text-3xl hover:bg-green-700 flex justify-center items-center bg-green-600 text-white' onClick={() => changeQuantity(true)}>+</button>
                </div>
              )}
              {mode === "sell" && (
                <div className='mt-10 flex gap-5'>
                  <button className='rounded-lg w-[40px] h-[40px] text-3xl hover:bg-green-700 flex justify-center items-center bg-green-600 text-white' onClick={() => changeSellQuantity(false)}>-</button>
                  <input
                    type="number"
                    onChange={handleSellInputChange}
                    value={sellquantity}
                    className={`w-[65%] rounded-lg text-xl text-center outline-none ${inputError ? 'border-[1.5px] border-red-500' : ' border-[1.5px] border-gray-400'}`}
                  />
                  <button className='rounded-lg w-[40px] h-[40px] text-3xl hover:bg-green-700 flex justify-center items-center bg-green-600 text-white' onClick={() => changeSellQuantity(true)}>+</button>
                </div>
              )}
              {mode === "buy" && inputError && <p className="text-red-500 mt-1">{inputError}</p>}
              {mode === "sell" && inputSellError && <p className="text-red-500 mt-1">You do not have this much stock</p>}
            </div>

            {mode === "buy" && (
              <div className='absolute bottom-5 left-0 w-full'>
                <div className='flex w-[100%] justify-between text-[12px] px-6'>
                  <p className='font-semibold text-gray-700'>Balance: ${walletData.toFixed(3)}</p>
                  <p className='font-semibold text-gray-700 '>Required: ${(price * Number(quantity)).toFixed(3)}</p>
                </div>
                <div className='flex justify-center items-center' >
                  <button onClick={BuyNowHandle} className={`w-[88%] flex justify-center items-center rounded-lg bg-green-600 hover:bg-green-700 text-white py-2 mt-5 ${quantity as number > 0 && payable < walletData ? "" : "disabled:cursor-not-allowed disabled:bg-green-400 disabled:text-gray-200"}`} disabled={quantity as number > 0 && payable < walletData ? false : true}>
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
                      'Buy'
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === "sell" && (
              <div className='absolute bottom-5 left-0 w-full'>
                <div className='flex w-[100%] justify-between text-[12px] px-6'>
                  <p className='font-semibold text-gray-700'>Balance: ${walletData.toFixed(3)}</p>
                  <p className='font-semibold text-gray-700 '>Required: ${(price * Number(quantity)).toFixed(3)}</p>
                </div>
                <div className='flex justify-center items-center' >
                  <button onClick={SellNowHandle} className={`w-[88%] flex justify-center items-center rounded-lg bg-green-600 hover:bg-green-700 text-white py-2 mt-5 ${quantity as number > 0 && payable < walletData ? "" : "disabled:cursor-not-allowed disabled:bg-green-400 disabled:text-gray-200"}`} disabled={quantity as number > 0 && payable < walletData ? false : true}>
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
                      'Buy'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default Details;
