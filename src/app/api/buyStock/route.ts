import { auth } from "@/auth";
import { HoldingModel, HoldingDocument } from "@/models/Holding";
import { TransactionModel, TransactionsDocument } from "@/models/Transactions";
import { getBalanceByEmail, updateWalletBalance } from "@/models/Users";
import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    try {
        const { quantity, price, symbol } = await request.json();

        const amountToDeduct = Number((price * quantity).toFixed(3));
        const uniqueid = Date.now();
        const session = await auth();
        const email = session?.user?.email;

        if (!email) {
         return   NextResponse.json({ error: "User not logged in." });
        }

        await connectDB();
        await updateWalletBalance(email, amountToDeduct);

        const actiontype = "hold";
        const newHolding: HoldingDocument = new HoldingModel({ email,uniqueid, quantity, price, actiontype, symbol });
        await newHolding.save();
        
        const newTransaction: TransactionsDocument = new TransactionModel({ email,uniqueid, quantity, price, actiontype, symbol });
        await newTransaction.save();

        const balance = await getBalanceByEmail(email);
        return NextResponse.json(balance.balance);
    } catch (error:any) {
        console.error('Error in POST request:', error);
        return NextResponse.json({ error: error.message });
    }
}
