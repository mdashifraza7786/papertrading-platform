"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { cryptoSymbols } from "@/util/getCryptoName";

const TopBar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<{ id: number; name: string; symbol: string }[]>([]);
    const [inputFocused, setInputFocused] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        setSearchTerm("");
        setInputFocused(false);
    }, [pathname]);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const response = await axios.get("/api/getWallet");
                setWalletBalance(response.data);
            } catch (error) {
                console.error("Error fetching wallet:", error);
            }
        };
        fetchWallet();
    }, [pathname]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        const filtered = cryptoSymbols.filter(
            (crypto) =>
                crypto.name.toLowerCase().includes(value.toLowerCase()) ||
                crypto.symbol.toLowerCase().includes(value.toLowerCase())
        );
        setSearchResults(filtered);
    };

    const handleInputFocus = () => setInputFocused(true);
    const handleInputBlur = () => setTimeout(() => setInputFocused(false), 200);

    return (
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30"
            style={{
                background: "rgba(255,255,255,0.90)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgb(var(--border))",
            }}>
            {/* Search */}
            <div className="relative w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--text-muted))" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search stocks, crypto..."
                    className="input-with-icon w-full h-10 text-sm"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                />

                {inputFocused && (searchTerm.trim() === "" || searchResults.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg max-h-72 overflow-y-auto z-50 scrollbar-thin"
                        style={{ border: "1px solid rgb(var(--border))" }}>
                        <div className="px-3 py-2 border-b" style={{ borderColor: "rgb(var(--border))" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgb(var(--text-muted))" }}>
                                {searchTerm ? "Results" : "Popular"}
                            </p>
                        </div>
                        {(searchTerm.trim() === "" ? cryptoSymbols.slice(0, 8) : searchResults).map((crypto) => (
                            <Link key={crypto.id} href={`/market/${crypto.symbol}`}>
                                <div className="flex items-center justify-between px-4 py-2.5 hover:bg-background-tertiary cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="crypto-icon">{crypto.symbol.slice(0, 2)}</div>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>{crypto.name}</p>
                                            <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{crypto.symbol}</p>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "rgb(var(--text-muted))" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                        {searchTerm.trim() !== "" && searchResults.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm" style={{ color: "rgb(var(--text-muted))" }}>
                                No results found
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Wallet balance */}
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
                    style={{ background: "rgb(var(--bg-tertiary))", border: "1px solid rgb(var(--border))" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgb(var(--accent-light))" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            style={{ color: "rgb(var(--accent-primary))" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgb(var(--text-muted))" }}>Balance</p>
                        <p className="text-sm font-bold font-mono" style={{ color: "rgb(var(--text-primary))" }}>
                            {walletBalance !== null
                                ? `$${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "---"}
                        </p>
                    </div>
                </div>

                {/* Notification bell */}
                <button className="btn-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer font-bold text-sm text-white"
                    style={{ background: "linear-gradient(135deg, rgb(var(--accent-primary)), rgb(var(--accent-glow)))" }}>
                    U
                </div>
            </div>
        </header>
    );
};

export default TopBar;
