import { CryptoData } from "@/app/dashboard/page";
import Loader from "@/app/loding";
import { getCryptoName } from "@/util/getCryptoName";
import Link from "next/link";
import { Suspense } from "react";

const HoldingStock = ({ holdingsData, cryptoData }: { holdingsData: any[], cryptoData: CryptoData[] }) => {
    return (
        <Suspense fallback={<Loader />}>
            <div className="p-4">
                <div className="overflow-hidden">
                    {holdingsData.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {holdingsData.map((holding, index) => (
                                <Link href={`/market/${holding.symbol}`} key={index}>
                                    <HoldingCard key={index} holding={holding} cryptoData={cryptoData} />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-lg">No holdings found</p>
                        </div>
                    )}
                </div>
            </div>
        </Suspense>
    );
};

export default HoldingStock;



interface Props {
    holding: any;
    cryptoData: CryptoData[];
}

const HoldingCard: React.FC<Props> = ({ holding, cryptoData }) => {
    const symbol = holding.symbol.toLowerCase() + "usdt";
    const totalPrice = parseFloat(holding.totalPrice["$numberDecimal"]);
    const totalQuantity = parseFloat(holding.totalQuantity["$numberDecimal"]);

    const crypto = cryptoData.find(data => data.symbol.toLowerCase() === symbol);
    const currentPrice = crypto ? parseFloat(crypto.price as string) : null;

    if (!currentPrice) {
        return (
            <div className="card p-4 hover-lift">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="font-medium text-gray-500">{holding.symbol.substring(0, 2)}</span>
                        </div>
                        <h3 className="font-medium">{getCryptoName(holding.symbol)}</h3>
                    </div>
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                        {holding.symbol}
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="animate-pulse w-20 h-6 bg-gray-200 rounded"></div>
                    <div className="animate-pulse w-16 h-6 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const currentValue = currentPrice * totalQuantity;
    const profitLoss = currentValue - totalPrice;
    const profitLossPercentage = (profitLoss / totalPrice) * 100;
    const isProfitable = profitLossPercentage > 0;

    return (
        <div className="card p-4 hover-lift">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                   
                    <div>
                        <h3 className="font-medium text-gray-900">{getCryptoName(holding.symbol)}</h3>
                        <p className="text-xs text-gray-500">{totalQuantity.toFixed(4)} {holding.symbol}</p>
                    </div>
                </div>
                <div className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">
                    {holding.symbol}
                </div>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Current Value</p>
                    <p className="font-semibold text-gray-900">${currentValue.toFixed(2)}</p>
                </div>
                <div className={`flex items-center ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfitable ? (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                        </svg>
                    )}
                    <span className="font-semibold">
                        {isProfitable ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                    </span>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                    <span className="block">Buy price: </span>
                    <span className="font-medium text-gray-700">${(totalPrice / totalQuantity).toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500">
                    <span className="block">Current: </span>
                    <span className="font-medium text-gray-700">${currentPrice.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};
