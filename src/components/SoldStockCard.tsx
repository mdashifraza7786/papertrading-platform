import { CryptoData } from "@/app/dashboard/page";
import Loader from "@/app/loding";
import { getCryptoName } from "@/util/getCryptoName";
import { Suspense } from "react";

const SoldStockCard = ({ holdingsData }: { holdingsData: any[], cryptoData: CryptoData[] }) => {
    return (
        <Suspense fallback={<Loader />}>
            <div>
                <h1 className="text-black font-medium text-2xl tracking-widest mb-10">Sold Stocks</h1>
                
                <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
                    {holdingsData
                        ?.filter(holding => holding.actiontype === "sold")
                        ?.map((holding, index) => (
                            <SoldCard key={index} holding={holding} />
                        ))
                    }

                </div>
                {holdingsData
                    ?.filter(holding => holding.actiontype === "sold").filter(holding => holding.actiontype === "sold").length <= 0 && (
                        <div className="text-center text-gray-500 text-xl">You have not sold any stock yet.</div>
                    )}
            </div>
        </Suspense>
    );
};

export default SoldStockCard;



interface Props {
    holding: any;
}

const SoldCard: React.FC<Props> = ({ holding }) => {
    const Price = parseFloat(holding.price["$numberDecimal"]);
    const Quantity = parseFloat(holding.quantity["$numberDecimal"]);
    const currentPrice = Number(holding.sellat.$numberDecimal)

    if (!currentPrice) {
        return (
            <div className="px-5 py-3 bg-white shadow-[0_0_3px_1px_#ddd] flex flex-col gap-5 rounded-lg">
                <h1 className="uppercase md:text-lg text-md  tracking-wider font-semibold">{holding.symbol}</h1>
                <div className="flex justify-between">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    const Investment = Quantity * Price;
    const currentValue = currentPrice * Quantity;
    const profitLoss = currentValue - Investment;
    const profitLossPercentage = (profitLoss / currentValue) * 100;
    return (
        <div className="px-5 py-5 bg-white shadow-[0_0_3px_1px_#ddd] flex justify-between gap-5 rounded-lg">
            <div className="flex flex-col gap-3">
                <h1 className="uppercase md:text-lg text-md tracking-wider font-semibold">{getCryptoName(holding.symbol)} ({holding.symbol})</h1>
                <div className="flex flex-col gap-2 font-medium text-[13px]">
                    <h2>Quantity: {Quantity}</h2>
                    <h2>Investment: ${Investment.toFixed(3)}</h2>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <p className={`font-semibold text-right md:text-2xl text-xl ${profitLossPercentage > 0 ? "text-green-700" : "text-red-700"}`}>${currentValue.toFixed(2)}</p>
                <p className={`font-semibold text-right text-sm ${profitLossPercentage > 0 ? "text-green-700" : "text-red-700"}`}>{profitLossPercentage > 0 ? "+" : ""} {profitLoss.toFixed(3)} ({profitLossPercentage > 0 ? "+" : ""}{profitLossPercentage.toFixed(2)}%)</p>
            </div>
        </div>
    );
};
