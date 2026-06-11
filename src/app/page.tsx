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
        <div className="min-h-screen" style={{ background: "rgb(var(--bg-primary))" }}>
            {/* Navbar */}
            <nav className="sticky top-0 z-50" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgb(var(--border))" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgb(var(--accent-primary))" }}>
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold">
                                <span style={{ color: "rgb(var(--text-primary))" }}>Paper</span>
                                <span style={{ color: "rgb(var(--accent-primary))" }}>Trade</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="btn-primary">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="btn-ghost">Sign in</Link>
                                    <Link href="/register" className="btn-primary">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden py-24 lg:py-36">
                {/* Green gradient background orbs */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgb(var(--accent-light)) 0%, rgb(var(--bg-primary)) 60%)" }} />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgb(var(--accent-primary)), transparent 70%)" }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6"
                            style={{ background: "rgb(var(--accent-light))", color: "rgb(var(--accent-primary))", border: "1px solid rgba(0,176,80,0.25)" }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgb(var(--accent-primary))" }} />
                            Practice trading with $100,000 virtual funds
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: "rgb(var(--text-primary))" }}>
                            Master crypto trading
                            <br />
                            <span style={{ color: "rgb(var(--accent-primary))" }}>without the risk</span>
                        </h1>

                        <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: "rgb(var(--text-secondary))" }}>
                            A realistic paper trading platform with real-time market data from Binance.
                            Perfect for beginners and experienced traders testing new strategies.
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            {isAuthenticated ? (
                                <Link href="/dashboard" className="btn-primary h-12 px-8 text-base shadow-lg">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/register" className="btn-primary h-12 px-8 text-base shadow-lg">
                                        Start Trading Free →
                                    </Link>
                                    <Link href="/login" className="btn-ghost h-12 px-8 text-base">
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Trust badges */}
                        <div className="flex items-center justify-center gap-8 mt-12">
                            {[
                                { val: "$100K", label: "Virtual Funds" },
                                { val: "Live", label: "Binance Data" },
                                { val: "Free", label: "No Risk" },
                            ].map((b) => (
                                <div key={b.label} className="text-center">
                                    <p className="text-xl font-bold" style={{ color: "rgb(var(--accent-primary))" }}>{b.val}</p>
                                    <p className="text-xs font-medium" style={{ color: "rgb(var(--text-muted))" }}>{b.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20" style={{ borderTop: "1px solid rgb(var(--border))" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: "rgb(var(--text-primary))" }}>Why PaperTrade?</h2>
                        <p style={{ color: "rgb(var(--text-secondary))" }}>Everything you need to practice trading like a pro</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--accent-primary))" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                ),
                                title: "Real-Time Data",
                                desc: "Live price updates from Binance via WebSocket. Trade with actual market conditions.",
                                iconBg: "rgb(var(--accent-light))",
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--accent-primary))" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                title: "$100K Virtual Funds",
                                desc: "Start with $100,000 in virtual currency. Practice without risking real money.",
                                iconBg: "rgb(var(--accent-light))",
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--accent-primary))" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                ),
                                title: "Portfolio Tracking",
                                desc: "Track your investments, analyze P&L, and monitor your trading performance.",
                                iconBg: "rgb(var(--accent-light))",
                            },
                        ].map((f) => (
                            <div key={f.title} className="card card-interactive p-6">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: f.iconBg }}>
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: "rgb(var(--text-primary))" }}>{f.title}</h3>
                                <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20" style={{ borderTop: "1px solid rgb(var(--border))", background: "rgb(var(--accent-light))" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: "rgb(var(--text-primary))" }}>How it works</h2>
                        <p style={{ color: "rgb(var(--text-secondary))" }}>Get started in minutes</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: "01", title: "Create Account", desc: "Sign up for free in seconds" },
                            { step: "02", title: "Get $100K", desc: "Receive virtual trading funds" },
                            { step: "03", title: "Start Trading", desc: "Buy and sell cryptocurrencies" },
                            { step: "04", title: "Track Progress", desc: "Monitor your portfolio performance" },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
                                    style={{ background: "#fff", border: "1px solid rgb(var(--border))" }}>
                                    <span className="text-2xl font-bold" style={{ color: "rgb(var(--accent-primary))" }}>{item.step}</span>
                                </div>
                                <h3 className="text-base font-bold mb-1" style={{ color: "rgb(var(--text-primary))" }}>{item.title}</h3>
                                <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20" style={{ borderTop: "1px solid rgb(var(--border))" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl p-10 md:p-16 text-center text-white"
                        style={{ background: "linear-gradient(135deg, rgb(var(--accent-primary)), rgb(var(--accent-glow)))" }}>
                        <h2 className="text-3xl font-bold mb-4">Ready to start trading?</h2>
                        <p className="text-white/80 mb-8 max-w-xl mx-auto">
                            Join traders practicing their skills without risking real money.
                        </p>
                        {isAuthenticated ? (
                            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white font-bold px-8 py-3 rounded-xl text-base transition hover:shadow-xl"
                                style={{ color: "rgb(var(--accent-primary))" }}>
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link href="/register" className="inline-flex items-center gap-2 bg-white font-bold px-8 py-3 rounded-xl text-base transition hover:shadow-xl"
                                style={{ color: "rgb(var(--accent-primary))" }}>
                                Create Free Account →
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8" style={{ borderTop: "1px solid rgb(var(--border))" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgb(var(--accent-primary))" }}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="font-bold text-sm">
                                <span style={{ color: "rgb(var(--text-primary))" }}>Paper</span>
                                <span style={{ color: "rgb(var(--accent-primary))" }}>Trade</span>
                            </span>
                        </div>
                        <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>For educational purposes only. No real money involved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
