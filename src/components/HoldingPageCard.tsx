import { CryptoData } from "@/app/dashboard/page";
import Loader from "@/app/loding";
import { getCryptoName } from "@/util/getCryptoName";
import { Suspense } from "react";

const HoldingPageCard = ({ holdingsData, cryptoData }: { holdingsData: any[], cryptoData: CryptoData[] }) => {
    return (
        <Suspense fallback={<Loader />}>
            <div>
                <h1 className="text-black font-medium text-2xl tracking-widest mb-10">Holding</h1>
                <div className="grid grid-cols-1 gap-5">
                    {holdingsData.map((holding, index) => (
                        <HoldingCard key={index} holding={holding} cryptoData={cryptoData} />
                    ))}
                </div>
                {holdingsData.length <= 0 && (
                    <div className="text-center text-gray-500 text-xl">No holding</div>
                )}
            </div>
        </Suspense>
    );
};

export default HoldingPageCard;



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
            <div className="px-5 py-3 bg-white shadow-[0_0_3px_1px_#ddd] flex flex-col gap-5 rounded-lg">
                <h1 className="uppercase text-lg tracking-wider font-semibold">{holding.symbol}</h1>
                <div className="flex justify-between">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    const currentValue = currentPrice * totalQuantity;
    const profitLoss = currentValue - totalPrice;
    const profitLossPercentage = (profitLoss / currentValue) * 100;

    return (
        <div className="px-5 py-5 bg-white shadow-[0_0_3px_1px_#ddd] flex justify-between gap-5 rounded-lg">
            <div className="flex flex-col gap-3">
                <h1 className="uppercase text-lg tracking-wider font-semibold">{getCryptoName(holding.symbol)} ({holding.symbol})</h1>
                <div className="flex gap-2 font-medium">
                    <h2>Quantity: {totalQuantity} ,</h2>
                    <h2>Investment: ${totalPrice.toFixed(3)}</h2>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <p className={`font-semibold text-right text-lg ${profitLossPercentage > 0 ? "text-green-700" : "text-red-700"}`}>${currentValue.toFixed(2)}</p>
                <p className={`font-semibold text-right text-sm ${profitLossPercentage > 0 ? "text-green-700" : "text-red-700"}`}>{profitLossPercentage > 0 ? "+" : ""} {profitLoss.toFixed(3)} ({profitLossPercentage > 0 ? "+" : ""}{profitLossPercentage.toFixed(2)}%)</p>
            </div>
        </div>
    );
};