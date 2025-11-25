"use client"

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/checkconnection");
                const data = await response.json();
                setIsAuthenticated(data.authenticated);
            } catch {
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, []);

    return (
        <div className="min-h-screen bg-dark-primary">
            <nav className="border-b border-[#1F2937]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold">
                                <span className="text-text-primary">Paper</span>
                                <span className="text-accent-primary">Trade</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="btn-primary">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="btn-ghost">
                                        Sign in
                                    </Link>
                                    <Link href="/register" className="btn-primary">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-primary/5 rounded-full blur-3xl" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-sm mb-6">
                            <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                            Practice trading with $100,000 virtual funds
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
                            Master crypto trading
                            <br />
                            <span className="text-accent-primary">without the risk</span>
                        </h1>
                        
                        <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
                            A realistic paper trading platform with real-time market data from Binance. 
                            Perfect for beginners and experienced traders testing new strategies.
                        </p>
                        
                        <div className="flex items-center justify-center gap-4">
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="btn-primary h-12 px-8 text-base">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/register" className="btn-primary h-12 px-8 text-base">
                                        Start Trading Free
                                    </Link>
                                    <Link href="/login" className="btn-ghost h-12 px-8 text-base">
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 border-t border-[#1F2937]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-text-primary mb-4">Why PaperTrade?</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">Everything you need to practice trading like a pro</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="card p-6 hover:bg-dark-tertiary transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-profit/10 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-profit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Real-Time Data</h3>
                            <p className="text-text-secondary text-sm">Live price updates from Binance via WebSocket. Trade with actual market conditions.</p>
                        </div>

                        <div className="card p-6 hover:bg-dark-tertiary transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">$100K Virtual Funds</h3>
                            <p className="text-text-secondary text-sm">Start with $100,000 in virtual currency. Practice without risking real money.</p>
                        </div>

                        <div className="card p-6 hover:bg-dark-tertiary transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Portfolio Tracking</h3>
                            <p className="text-text-secondary text-sm">Track your investments, analyze P&L, and monitor your trading performance.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 border-t border-[#1F2937]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-text-primary mb-4">How it works</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">Get started in minutes</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: "01", title: "Create Account", desc: "Sign up for free in seconds" },
                            { step: "02", title: "Get $100K", desc: "Receive virtual trading funds" },
                            { step: "03", title: "Start Trading", desc: "Buy and sell cryptocurrencies" },
                            { step: "04", title: "Track Progress", desc: "Monitor your portfolio performance" },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-16 h-16 rounded-full bg-dark-tertiary flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-bold text-accent-primary">{item.step}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                                <p className="text-text-muted text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 border-t border-[#1F2937]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card p-8 md:p-12 bg-gradient-to-br from-accent-primary/10 to-dark-secondary border-accent-primary/20 text-center">
                        <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to start trading?</h2>
                        <p className="text-text-secondary mb-8 max-w-xl mx-auto">
                            Join thousands of traders practicing their skills without risking real money.
                        </p>
                        {isAuthenticated ? (
                            <Link href="/dashboard" className="btn-primary h-12 px-8 text-base">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link href="/register" className="btn-primary h-12 px-8 text-base">
                                Create Free Account
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <footer className="py-8 border-t border-[#1F2937]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="font-bold">
                                <span className="text-text-primary">Paper</span>
                                <span className="text-accent-primary">Trade</span>
                            </span>
                        </div>
                        <p className="text-text-muted text-sm">For educational purposes only. No real money involved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
