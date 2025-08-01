"use client"
import { CryptoData } from "@/app/dashboard/page";
import { getCryptoName } from "@/util/getCryptoName";
import { useState, useEffect } from 'react';

interface HoldingData {
  uniqueid: number;
  quantity: { $numberDecimal: string };
  price: { $numberDecimal: string };
  actiontype: string;
  symbol: string;
  sellat?: { $numberDecimal: string };
  __v: number;
}

interface TransactionHistoryProps {
  holdingsData: HoldingData[];
  cryptoData: CryptoData[];
  loaded: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ holdingsData, cryptoData, loaded }) => {
  const [soldHoldings, setSoldHoldings] = useState<HoldingData[]>([]);
  
  useEffect(() => {
    setSoldHoldings(holdingsData.filter(holding => holding.actiontype === "sold"));
  }, [holdingsData]);

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
        <div className="text-sm text-gray-500">
          {soldHoldings.length} {soldHoldings.length === 1 ? 'transaction' : 'transactions'}
        </div>
      </div>
      
      {loaded ? (
        soldHoldings.length > 0 ? (
          <div className="space-y-4">
            {soldHoldings.map((holding, index) => (
              <TransactionCard key={index} holding={holding} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions yet</h3>
            <p className="text-gray-500">Your transaction history will appear here</p>
          </div>
        )
      ) : (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
};

interface TransactionCardProps {
  holding: HoldingData;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ holding }) => {
  const buyPrice = parseFloat(holding.price.$numberDecimal);
  const quantity = parseFloat(holding.quantity.$numberDecimal);
  const sellPrice = holding.sellat ? parseFloat(holding.sellat.$numberDecimal) : 0;
  
  const investment = quantity * buyPrice;
  const saleValue = quantity * sellPrice;
  const profitLoss = saleValue - investment;
  const profitLossPercentage = (profitLoss / investment) * 100;
  const isProfitable = profitLoss > 0;
  
  const transactionDate = new Date(holding.uniqueid).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 font-mono text-sm">
            {holding.symbol.substring(0, 2)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{getCryptoName(holding.symbol)}</h3>
            <p className="text-sm text-gray-500">{transactionDate}</p>
          </div>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-800">
          Sold
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <p className="text-xs text-gray-500">Quantity</p>
          <p className="font-medium">{quantity} {holding.symbol}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Buy Price</p>
          <p className="font-medium">${buyPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Sell Price</p>
          <p className="font-medium">${sellPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Profit/Loss</p>
          <p className={`font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable ? '+' : ''}{profitLoss.toFixed(2)} ({isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;