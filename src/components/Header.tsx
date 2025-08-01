"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { usePathname } from "next/navigation";
import axios from "axios";

const predefinedCryptoList = [
    { "id": 1, "name": "Bitcoin", "symbol": "BTC" },
    { "id": 2, "name": "Ethereum", "symbol": "ETH" },
    { "id": 3, "name": "Ripple", "symbol": "XRP" },
    { "id": 4, "name": "Litecoin", "symbol": "LTC" },
    { "id": 5, "name": "Cardano", "symbol": "ADA" },
];

const Header = ({ sess }: any) => {
    const [loggedin, setLoggedin] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<{ id: number; name: string; symbol: string; }[]>([]);
    const [inputFocused, setInputFocused] = useState<boolean>(false);
    const [walletData, setWalletData] = useState<number | string>("Loading");
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const pathname = usePathname();
    
    if (!sess?.user?.email) {
        if (pathname !== "/login" && pathname !== "/register" && pathname !== "/logout") {
            window.location.href = "/login"
        }
    }

    useEffect(() => {
        if (sess?.user) {
            setLoggedin(true);
        } else {
            setLoggedin(false);
        }

    }, [sess?.user, pathname]);

    useEffect(()=>{
        const fetchWalletData = async () => {
            try {
                const response = await axios.get('/api/getWallet');
                setWalletData(response.data.toFixed(2));
            } catch (error) {
                console.error('Error fetching wallet data:', error);
            }
        };
        fetchWalletData();
    },[])

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setSearchTerm(value);

        const filteredResults = predefinedCryptoList.filter(crypto =>
            crypto.name.toLowerCase().includes(value.toLowerCase()) ||
            crypto.symbol.toLowerCase().includes(value.toLowerCase())
        );

        setSearchResults(filteredResults);
    };

    const handleInputFocus = () => {
        setInputFocused(true);
    };

    const handleInputBlur = () => {
        setTimeout(() => {
            setInputFocused(false);
        }, 300);
    };

    useEffect(() => {
        setInputFocused(false);
    }, [pathname]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <>
            <NextTopLoader color="#16A34A" height={3} showSpinner={false} />
            <header className="sticky top-0 left-0 z-50 backdrop-blur-lg bg-white/90 border-b border-gray-100">
                <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href={"/dashboard"} className="flex items-center">
                            <svg className="w-8 h-8 text-green-600 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 12H5M5 12V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V12M5 12L8 6C8.44772 5.10457 9.37868 4.5 10.5 4.5H13.5C14.6213 4.5 15.5523 5.10457 16 6L19 12M19 12H22M12 9V15M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <h1 className="text-gray-900 font-bold text-xl">
                                <span className="text-green-600">PAPER</span>TRADING
                            </h1>
                        </Link>
                    </div>
                    
                    <div className="md:hidden">
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {sess?.user?.email && (
                            <div className="relative mr-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    id="search"
                                    className="input-field pl-10 pr-4 py-2 w-64 h-10"
                                    placeholder="Search cryptocurrencies..."
                                    onChange={handleSearchChange}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    value={searchTerm}
                                />
                                {inputFocused && searchTerm.trim() === '' && (
                                    <div className="absolute mt-2 w-full bg-white rounded-lg card-shadow z-50">
                                        {predefinedCryptoList.map(crypto => (
                                            <Link key={crypto.id} href={`/market/${crypto.symbol}`}>
                                                <div className="py-3 px-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0">
                                                    <p className="font-medium">{crypto.name}</p>
                                                    <p className="text-sm text-gray-500 font-mono">{crypto.symbol}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {searchTerm.trim() !== '' && (
                                    <div className="absolute mt-2 w-full bg-white rounded-lg card-shadow z-50">
                                        {searchResults.length > 0 ? (
                                            searchResults.map(result => (
                                                <Link key={result.id} href={`/market/${result.symbol}`}>
                                                    <div className="py-3 px-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0">
                                                        <p className="font-medium">{result.name}</p>
                                                        <p className="text-sm text-gray-500 font-mono">{result.symbol}</p>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="py-3 px-4 text-gray-500 text-center">No results found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <nav>
                            <ul className="flex items-center space-x-1">
                                {loggedin ? (
                                    <>
                                        <li>
                                            <div className="flex items-center px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-green-700">
                                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <span className="font-medium">${walletData}</span>
                                            </div>
                                        </li>
                                        <li>
                                            <Link href="/dashboard" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                                Dashboard
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/investment" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                Investment
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/logout" className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                                </svg>
                                                Logout
                                            </Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            <Link href="/" className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                                                Home
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/login" className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
                                                Login
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/register" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium">
                                                Sign Up
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </nav>
                    </div>
                </div>
            </header>
            
            {menuOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={toggleMenu}></div>
                    <div className="fixed top-16 right-0 bottom-0 w-64 bg-white shadow-xl overflow-y-auto">
                        <div className="p-4">
                            {loggedin && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-green-50 border border-green-100">
                                        <span className="text-sm text-gray-600">Wallet Balance</span>
                                        <span className="font-bold text-green-700">${walletData}</span>
                                    </div>
                                    
                                    <div className="relative mb-4">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            name="mobile-search"
                                            className="input-field pl-10 pr-4 py-2 w-full"
                                            placeholder="Search cryptocurrencies..."
                                            onChange={handleSearchChange}
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                            value={searchTerm}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            <nav>
                                <ul className="space-y-2">
                                    {loggedin ? (
                                        <>
                                            <li>
                                                <Link href="/dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
                                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                    Dashboard
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/investment" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
                                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    Investment
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/logout" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
                                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                                    </svg>
                                                    Logout
                                                </Link>
                                            </li>
                                        </>
                                    ) : (
                                        <>
                                            <li>
                                                <Link href="/" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
                                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                                    </svg>
                                                    Home
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/login" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700">
                                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                                                    </svg>
                                                    Login
                                                </Link>
                                            </li>
                                            <li>
                                                <Link href="/register" className="flex items-center px-4 py-3 rounded-lg bg-green-600 text-white">
                                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                                                    </svg>
                                                    Sign Up
                                                </Link>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
