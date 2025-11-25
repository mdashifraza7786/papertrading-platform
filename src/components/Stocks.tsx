import { Suspense } from "react";
import Loader from "@/app/loding";
import Link from "next/link";
import { getCryptoName } from "@/util/getCryptoName";

export interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
    change?: string | number;
}

const Stocks = ({ data }: { data: CryptoData[] }) => {
    return (
        <Suspense fallback={<Loader />}>
            <div className="p-4">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-3 text-left font-medium text-gray-500 text-sm">Asset</th>
                                <th className="pb-3 text-right font-medium text-gray-500 text-sm">Price</th>
                                <th className="pb-3 text-right font-medium text-gray-500 text-sm">Change</th>
                                <th className="pb-3 text-right font-medium text-gray-500 text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(crypto => (
                                
                                <tr key={crypto.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-4 pr-2">
                                        <Link href={"/market/"+crypto.symbol.toUpperCase().replace("USDT","")} className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3 font-mono text-sm">
                                                {crypto.symbol.toUpperCase().replace("USDT","")}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{getCryptoName(crypto.name.replace("USDT",""))}</p>
                                                <p className="font-medium text-gray-900">{crypto.name.replace("USDT","")}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="py-4 text-right font-medium">
                                        {crypto.price !== null ? `$${typeof crypto.price === 'number' ? crypto.price.toFixed(2) : crypto.price}` : '-'}
                                    </td>
                                    <td className="py-4 text-right">
                                        {crypto.change ? (
                                            <span className={`inline-flex items-center ${parseFloat(crypto.change as string) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {parseFloat(crypto.change as string) >= 0 ? (
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                                                    </svg>
                                                )}
                                                <span className="font-medium">
                                                    {parseFloat(crypto.change as string) >= 0 ? '+' : ''}{crypto.change}%
                                                </span>
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="py-4 text-right">
                                        <Link href={"/market/"+crypto.symbol.toUpperCase().replace("USDT","")} className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium text-sm">
                                            Trade
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Suspense>
    );
};

export default Stocks;


 