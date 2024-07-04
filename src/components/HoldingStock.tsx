import Loader from "@/app/loding"
import { Suspense } from "react"

const HoldingStock = () => {
  return (
    <Suspense fallback={<Loader/>}>
        <div>
            <h1 className="text-black font-medium text-2xl tracking-widest mb-10">Holding</h1>
            <div className="grid grid-cols-3 gap-5">
                <HoldingCard/>
                <HoldingCard/>
                <HoldingCard/>
            </div>
        </div>
    </Suspense>
  )
}

export default HoldingStock

function HoldingCard(){
    return (
        <div className="px-5 py-3 bg-white shadow-[0_0_3px_1px_#ddd] flex flex-col gap-5 rounded-lg">
            <h1 className="uppercase text-lg tracking-wider font-semibold">Bitcoin</h1>
            <div className="flex justify-between">
                <p>2404254</p>
                <p>-91.00 (-3.32%)</p>
            </div>
        </div>
    )
}