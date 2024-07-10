"use client"
import Link from "next/link"
import NextTopLoader from "nextjs-toploader"
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const predefinedCryptoList = [
    { "id": 1, "name": "Bitcoin", "symbol": "BTC" },
    { "id": 2, "name": "Ethereum", "symbol": "ETH" },
    { "id": 3, "name": "Ripple", "symbol": "XRP" },
    { "id": 4, "name": "Litecoin", "symbol": "LTC" },
    { "id": 5, "name": "Cardano", "symbol": "ADA" },
    // Add more predefined cryptocurrencies as needed
];

const Header = ({ sess }: any) => {
    const [loggedin, setLoggedin] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<{ id: number; name: string; symbol: string; }[]>([]);
    const [inputFocused, setInputFocused] = useState<boolean>(false);
    const [walletData,setWalletData] = useState<number>(0);
    const pathname = usePathname();
    const router = useRouter();

    if (!sess?.user?.email) {
        if (pathname !== "/login" && pathname !== "/register" && pathname !== "/logout") {
            router.refresh();
        }
    }

    useEffect(() => {
        if (sess?.user) {
            setLoggedin(true);
        } else {
            setLoggedin(false);
        }

        const fetchWalletData = async () => {
            try {
              const response = await axios.get('/api/getWallet');
              setWalletData(response.data);
            } catch (error) {
              console.error('Error fetching wallet data:', error);
            }
          };
          fetchWalletData();
    }, [sess?.user, pathname])

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
        }, 300)
    };

    useEffect(() => {
        setInputFocused(false);
    }, [pathname])

    return (
        <>
            <NextTopLoader color="#16A34A" />
            <div className="h-[5rem] px-20 shadow-[0_0_10px_1px_#ddd] sticky top-0 left-0 bg-white z-10 flex justify-between items-center">
                <div className="logo">
                    <Link href={"/dashboard"}>
                        <h1 className="text-green-600 uppercase font-bold tracking-wider text-2xl ">
                            PAPERTRADING
                        </h1>
                    </Link>
                </div>
                <div>
                    {sess?.user?.email && (


                        <form action="" autoComplete="off">
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
                        </form>
                    )}
                    {inputFocused && searchTerm.trim() === '' && (
                        <>
                            <div className="absolute mt-2 w-[30rem] bg-white shadow-md rounded-lg bg-op">
                                {predefinedCryptoList.map(crypto => (
                                    <Link key={crypto.id} href={`/market/${crypto.symbol}`}>
                                        <div className="py-2 px-3 hover:bg-black hover:text-white cursor-pointer flex justify-between">
                                            <p>{crypto.name}</p> <p>({crypto.symbol})</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                        </>
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
                </div>
                <div>
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
        </>
    )
}

export default Header;
