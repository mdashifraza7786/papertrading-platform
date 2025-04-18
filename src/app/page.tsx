"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/checkconnection');
        const data = await response.json();
        setSession(data.authenticated);
        setLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Practice Trading Without Financial Risk</h1>
              <p className="text-xl mb-8 text-blue-100">
                Master the markets with our paper trading platform. Real-time data, zero financial risk.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!loading && !session ? (
                  <>
                    <Link href="/register" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-center">
                      Get Started Free
                    </Link>
                    <Link href="/login" className="bg-white hover:bg-gray-100 text-indigo-900 font-semibold py-3 px-6 rounded-lg text-center">
                      Login
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg text-center">
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-2xl">
                <img src="/trading-chart.svg" alt="Trading Chart" className="w-full h-auto" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400/133263/FFFFFF?text=Trading+Platform";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Data</h3>
              <p className="text-gray-600">Access live market data from Binance to make informed trading decisions.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Virtual $100,000</h3>
              <p className="text-gray-600">Start with $100,000 in virtual currency to practice your trading strategies.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Portfolio Tracking</h3>
              <p className="text-gray-600">Monitor your investments and track performance in real-time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-lg font-semibold mb-2">Create Account</h3>
              <p className="text-gray-600">Sign up for free and get access to your virtual trading account.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-lg font-semibold mb-2">Explore Markets</h3>
              <p className="text-gray-600">Browse cryptocurrencies with real-time price data.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-lg font-semibold mb-2">Execute Trades</h3>
              <p className="text-gray-600">Buy and sell assets with your virtual balance.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="text-lg font-semibold mb-2">Track Performance</h3>
              <p className="text-gray-600">Monitor your portfolio and improve your strategy.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-900 text-white py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
          <p className="text-xl mb-8">Join thousands of traders practicing their skills without risking real money.</p>
          {!loading && !session ? (
            <Link href="/register" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg inline-block">
              Get Started Today
            </Link>
          ) : (
            <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg inline-block">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
