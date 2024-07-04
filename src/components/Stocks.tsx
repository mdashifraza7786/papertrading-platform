import { Suspense } from "react";
import Loader from "@/app/loding";
import Link from "next/link";

export interface CryptoData {
    id: number;
    name: string;
    symbol: string;
    price: string | number | null;
    change?: string | number;
}

const Stocks = ({ data }: { data: CryptoData[] }) => {
    // console.log(data);
    return (
        <Suspense fallback={<Loader />}>
            <h1 className="text-black font-medium text-2xl tracking-widest">Stocks</h1>
            <div className="grid grid-cols-3 gap-5">
                {data.map(crypto => (
                    <Link href={"/market/"+crypto.name.replace("USDT","")}>
                        <StocksCard
                            key={crypto.id}
                            name={crypto.name}
                            price={crypto.price}
                            change={crypto.change}
                        />
                    </Link>
                ))}
            </div>
        </Suspense>
    );
};

export default Stocks;

interface StocksCardProps {
    name: string;
    price: string | number | null;
    change?: string | number;
}

function StocksCard({ name, price, change }: StocksCardProps) {
    return (
        <div className="px-5 py-3 bg-white shadow-[0_0_3px_1px_#ddd] flex flex-col gap-5 rounded-lg">
            <h1 className="uppercase text-lg tracking-wider font-semibold">{name}</h1>
            <div className="flex justify-between">
                <p>{price !== null ? price : 'Price not available'}</p>
                {change && <p>{change}</p>}
            </div>
        </div>
    );
}
