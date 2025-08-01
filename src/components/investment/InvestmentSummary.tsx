"use client"
import { useState, useEffect } from 'react';

interface InvestmentSummaryProps {
  holdingInvestment: string;
  currentValue: string;
  loaded: boolean;
}

const InvestmentSummary: React.FC<InvestmentSummaryProps> = ({ 
  holdingInvestment, 
  currentValue, 
  loaded 
}) => {
  const [profitLoss, setProfitLoss] = useState<number>(0);
  const [profitLossPercentage, setProfitLossPercentage] = useState<number>(0);

  useEffect(() => {
    const investment = parseFloat(holdingInvestment);
    const current = parseFloat(currentValue);
    const pl = current - investment;
    setProfitLoss(pl);
    
    if (investment > 0) {
      setProfitLossPercentage((pl / investment) * 100);
    }
  }, [holdingInvestment, currentValue]);

  const isProfitable = profitLoss >= 0;

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Portfolio Summary</h2>
      
      {loaded ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-sm text-gray-500 block mb-1">Total Investment</span>
              <span className="text-2xl font-bold text-gray-900">${holdingInvestment}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-sm text-gray-500 block mb-1">Current Value</span>
              <span className="text-2xl font-bold text-gray-900">${currentValue}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-500 block mb-1">Profit/Loss</span>
            <div className="flex items-baseline">
              <span className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                {isProfitable ? '+' : ''}{profitLoss.toFixed(2)}
              </span>
              <span className={`ml-2 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                ({isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
};

export default InvestmentSummary;