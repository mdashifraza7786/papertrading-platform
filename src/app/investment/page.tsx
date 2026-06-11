import { auth } from "@/auth";
import connectDB from "@/util/dbConnect";
import { TransactionModel } from "@/models/Transactions";
import InvestmentClient from "./InvestmentClient";
import { redirect } from "next/navigation";

export default async function InvestmentPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/login");
    }

    await connectDB();

    const transactions = await TransactionModel.find({ email }).select('-email -_id').lean();
    
    // Parse Decimal128 values so they can be passed as valid JSON to the Client Component
    const parsedTransactions = transactions.map((t: any) => ({
        uniqueid: t.uniqueid,
        quantity: t.quantity ? t.quantity.toString() : "0",
        price: t.price ? t.price.toString() : "0",
        actiontype: t.actiontype,
        symbol: t.symbol,
        sellat: t.sellat ? t.sellat.toString() : undefined,
    }));

    return <InvestmentClient initialTransactions={parsedTransactions} />;
}
