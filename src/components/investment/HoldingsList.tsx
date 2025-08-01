"use client"
import { CryptoData } from "@/app/dashboard/page";
import { getCryptoName } from "@/util/getCryptoName";
import Link from "next/link";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { ThreeDots } from 'react-loader-spinner';
import 'react-toastify/dist/ReactToastify.css';

interface HoldingData {
  uniqueid: number;
  quantity: { $numberDecimal: string };
  price: { $numberDecimal: string };
  actiontype: string;
  symbol: string;
  __v: number;
}

interface HoldingsListProps {
  holdingsData: HoldingData[];
  cryptoData: CryptoData[];
  loaded: boolean;
}

const HoldingsList: React.FC<HoldingsListProps> = ({ holdingsData, cryptoData, loaded }) => {
  const [filteredHoldings, setFilteredHoldings] = useState<HoldingData[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    setFilteredHoldings(holdingsData.filter(holding => holding.actiontype === "hold"));
  }, [holdingsData, refreshTrigger]);

  const refreshHoldings = () => {
    setRefreshTrigger(prev => prev + 1);
    window.location.reload();
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Current Holdings</h2>
        <div className="text-sm text-gray-500">
          {loaded ? `${filteredHoldings.length} ${filteredHoldings.length === 1 ? 'asset' : 'assets'}` : 'Loading...'}
        </div>
      </div>
      
      {!loaded ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      ) : filteredHoldings.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No holdings yet</h3>
          <p className="text-gray-500 mb-4">Start investing to build your portfolio</p>
          <Link href="/market/BTC" className="button-primary inline-flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Start Trading
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHoldings.map((holding, index) => (
            <div key={index} className="relative">
              <HoldingCard
                holding={holding}
                cryptoData={cryptoData}
                onSellSuccess={refreshHoldings}
              />
            </div>
          ))}
        </div>
      )}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

interface HoldingCardProps {
  holding: HoldingData;
  cryptoData: CryptoData[];
  onSellSuccess: () => void;
}

const HoldingCard: React.FC<HoldingCardProps> = ({ holding, cryptoData, onSellSuccess }) => {
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const [showSellConfirm, setShowSellConfirm] = useState<boolean>(false);

  const symbol = holding.symbol.toLowerCase() + "usdt";
  const price = parseFloat(holding.price.$numberDecimal);
  const quantity = parseFloat(holding.quantity.$numberDecimal);

  const crypto = cryptoData.find(data => data.symbol.toLowerCase() === symbol);
  const currentPrice = crypto ? parseFloat(crypto.price as string) : null;

  const handleSellClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSellConfirm(true);
  };

  const handleSellConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSelling(true);

    try {
      await axios.post('/api/sellStock', {
        id: holding.uniqueid,
        priceat: currentPrice
      });

      toast.success(`Successfully sold ${quantity} ${holding.symbol}`);
      setTimeout(() => {
        onSellSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error selling asset:', error);
      toast.error("Transaction failed. Please try again.");
    } finally {
      setIsSelling(false);
      setShowSellConfirm(false);
    }
  };

  const handleCancelSell = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSellConfirm(false);
  };

  if (!currentPrice) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-mono text-sm">
              {holding.symbol.substring(0, 2)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{holding.symbol}</h3>
              <p className="text-sm text-gray-500">Loading price...</p>
            </div>
          </div>
          <div className="animate-pulse w-20 h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const investment = quantity * price;
  const currentValue = currentPrice * quantity;
  const profitLoss = currentValue - investment;
  const profitLossPercentage = (profitLoss / investment) * 100;
  const isProfitable = profitLoss > 0;

  return (
    <Link href={`/market/${holding.symbol.toUpperCase()}`}>
      <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-mono text-sm">
              {holding.symbol.substring(0, 2)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{getCryptoName(holding.symbol)}</h3>
              <p className="text-sm text-gray-500">{quantity} {holding.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">${currentValue.toFixed(2)}</div>
            <div className={`text-sm ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
              {isProfitable ? '+' : ''}{profitLoss.toFixed(2)} ({isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Price information */}
        <div className="grid grid-cols-2 gap-2 mb-2 justify-between items-center">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-xs text-gray-500">Buy Price</span>
            <div className="font-medium">${price.toFixed(2)}</div>
          </div>
          <div className="mt-3 flex justify-end" onClick={e => e.preventDefault()}>
            <button
              onClick={handleSellClick}
              className="w-24 h-8 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-small rounded-lg transition-colors"
              disabled={isSelling}
            >
              {isSelling ? (
                <ThreeDots
                  visible={true}
                  height={18}
                  width={30}
                  color="#ffffff"
                  radius="3"
                  ariaLabel="loading"
                />
              ) : (
                'Sell'
              )}
            </button>
          </div>

        </div>



        {showSellConfirm && (
          <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex flex-col justify-center items-center p-4 z-10">
            <p className="text-center mb-4">
              Sell {quantity} {holding.symbol} at ${currentPrice.toFixed(2)}?
            </p>
            <p className="text-center mb-4 text-sm">
              Buy Price: ${price.toFixed(2)} | Current Price: ${currentPrice.toFixed(2)}
            </p>
            <p className="text-center mb-4 text-sm">
              {isProfitable ? 'Profit' : 'Loss'}: {isProfitable ? '+' : ''}{profitLoss.toFixed(2)} ({isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelSell}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                disabled={isSelling}
              >
                Cancel
              </button>
              <button
                onClick={handleSellConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                disabled={isSelling}
              >
                {isSelling ? (
                  <ThreeDots
                    visible={true}
                    height={18}
                    width={30}
                    color="#ffffff"
                    radius="3"
                    ariaLabel="loading"
                  />
                ) : (
                  'Confirm Sell'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default HoldingsList;