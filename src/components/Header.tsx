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
    const [menuOpen, setMenuOpen] = useState<boolean>(false); // State for menu visibility
    const pathname = usePathname();
    // Refresh page if not logged in and not on login, register, or logout page
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
            <NextTopLoader color="#16A34A" />
            <div className="h-[5rem] px-4 md:px-20 shadow-[0_0_10px_1px_#ddd] md:sticky top-0 left-0 bg-white z-10 flex justify-between items-center">
                <div className="logo">
                    <Link href={"/dashboard"}>
                        <h1 className="text-green-600 uppercase font-bold tracking-wider text-2xl cursor-pointer">
                            PAPERTRADING
                        </h1>
                    </Link>
                </div>
                <div className="md:hidden flex items-center">
                    <button
                        className="text-gray-600 focus:outline-none"
                        onClick={toggleMenu}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>
                <div className="hidden md:flex md:items-center md:space-x-5 relative">
                    {sess?.user?.email && (
                        <form action="" autoComplete="off" className="relative">
                            <input
                                type="text"
                                name="search"
                                id="search"
                                className="border-[2px] border-gray-200 outline-0 h-[2.5rem] rounded-lg w-[30rem] py-1 px-2"
                                placeholder="What are you looking for today?"
                                onChange={handleSearchChange}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                value={searchTerm}
                            />
                            {inputFocused && searchTerm.trim() === '' && (
                                <div className="absolute mt-2 w-[30rem] bg-white shadow-md rounded-lg bg-opacity-90">
                                    {predefinedCryptoList.map(crypto => (
                                        <Link key={crypto.id} href={`/market/${crypto.symbol}`}>
                                            <div className="py-2 px-3 hover:bg-black hover:text-white cursor-pointer flex justify-between">
                                                <p>{crypto.name}</p> <p>({crypto.symbol})</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {searchTerm.trim() !== '' && (
                                <div className="absolute mt-2 w-[30rem] bg-white shadow-md rounded-lg">
                                    {searchResults.map(result => (
                                        <Link key={result.id} href={`/market/${result.symbol}`}>
                                            <div className="py-2 px-3 hover:bg-black hover:text-white cursor-pointer">
                                                {result.name} ({result.symbol})
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </form>
                    )}
                    <ul className="flex gap-5 font-medium">
                        {loggedin === true ? (
                            <>
                                <div>
                                    <li className="py-2 px-3 rounded-xl shadow-[0_0_3px_1px_#ddd]">Wallet: ${walletData}</li>
                                </div>
                                <Link href={"/dashboard"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Dashboard</li>
                                </Link>
                                <Link href={"/investment"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Investment</li>
                                </Link>
                                <Link href={"/logout"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Logout</li>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href={"/"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Home</li>
                                </Link>
                                <Link href={"/login"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Login</li>
                                </Link>
                                <Link href={"/register"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Signup</li>
                                </Link>
                            </>
                        )}
                    </ul>
                </div>
            </div>
            <div>
                
            </div>
            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden absolute top-[5rem] left-0 w-full bg-white shadow-[0_0_10px_1px_#ddd] z-20">
                    <ul className="flex flex-col items-center gap-5 py-4">
                        {loggedin === true ? (
                            <>
                                <div>
                                    <li className="py-2 px-3 rounded-xl shadow-[0_0_3px_1px_#ddd]">Wallet: ${walletData}</li>
                                </div>
                                <Link href={"/dashboard"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Dashboard</li>
                                </Link>
                                <Link href={"/investment"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Investment</li>
                                </Link>
                                <Link href={"/logout"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Logout</li>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href={"/"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Home</li>
                                </Link>
                                <Link href={"/login"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Login</li>
                                </Link>
                                <Link href={"/register"}>
                                    <li className="py-2 px-3 hover:bg-black hover:text-white transition-all duration-500">Signup</li>
                                </Link>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </>
    );
};

export default Header;
