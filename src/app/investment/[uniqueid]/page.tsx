"use client"
import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Loader from '@/app/loding';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InvestmentDetails from '@/components/investment/InvestmentDetails';

interface Investment {
  uniqueid: number;
  quantity: { $numberDecimal: string };
  price: { $numberDecimal: string };
  actiontype: string;
  symbol: string;
  __v: number;
}

const InvestmentDetailPage: React.FC = () => {
  const { uniqueid } = useParams();
  const router = useRouter();
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getInvestment = async () => {
      try {
        const res = await axios.get(`/api/investment?investment=${uniqueid}`);
        if (res.data === null || res.data.length === 0) {
          setError("Investment not found");
          setTimeout(() => {
            router.push("/investment");
          }, 2000);
          return;
        }
        setInvestment(res.data[0]);
        setLoaded(true);
      } catch (error) {
        console.error('Error fetching investment:', error);
        setError("Failed to load investment details");
        setLoaded(true);
      }
    };

    if (uniqueid) {
      getInvestment();
    }
  }, [uniqueid, router]);

  const handleSellComplete = () => {
    setTimeout(() => {
      router.push("/investment");
    }, 1500);
  };

  return (
    <Suspense fallback={<Loader />}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => router.push("/investment")}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Investment Details</h1>
          </div>
        </div>

        {!loaded ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <InvestmentDetails 
            investment={investment} 
            uniqueid={uniqueid as string} 
            onSell={handleSellComplete} 
          />
        )}
      </div>
      <ToastContainer position="bottom-right" />
    </Suspense>
  );
};

export default InvestmentDetailPage;