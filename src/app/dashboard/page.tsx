import { auth } from "@/auth";
import connectDB from "@/util/dbConnect";
import { HoldingModel } from "@/models/Holding";
import { getBalanceByEmail } from "@/models/Users";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/login");
    }

    await connectDB();

    const userBalance = await getBalanceByEmail(email);
    const walletBalance = userBalance?.balance || 0;

    const aggregatePipeline = [
        { $match: { email, actiontype: "hold" } },
        {
            $group: {
                _id: "$symbol",
                totalQuantity: { $sum: "$quantity" },
                totalPrice: { $sum: { $multiply: ["$quantity", "$price"] } },
            },
        },
        {
            $project: {
                symbol: "$_id",
                totalQuantity: 1,
                totalPrice: 1,
                _id: 0,
            },
        },
    ];

    const aggregatedData = await HoldingModel.aggregate(aggregatePipeline);
    
    // Parse Decimal128 values so they can be passed as valid JSON to the Client Component
    const parsedHoldings = aggregatedData.map(h => ({
        symbol: h.symbol,
        totalQuantity: h.totalQuantity ? h.totalQuantity.toString() : "0",
        totalPrice: h.totalPrice ? h.totalPrice.toString() : "0",
    }));

    return (
        <DashboardClient 
            initialWalletBalance={walletBalance} 
            initialHoldings={parsedHoldings} 
        />
    );
}
