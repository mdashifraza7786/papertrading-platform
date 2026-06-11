import { auth } from "@/auth";
import { HoldingModel, HoldingDocument } from "@/models/Holding";
import { TransactionModel, TransactionsDocument } from "@/models/Transactions";
import { getBalanceByEmail, UserModel } from "@/models/Users";
import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    let dbSession = null;
    try {
        const { quantity, price, symbol } = await request.json();
        
        const numQuantity = Number(quantity);
        const numPrice = Number(price);

        if (isNaN(numQuantity) || numQuantity <= 0) {
            return NextResponse.json({ error: "Invalid quantity." });
        }
        if (isNaN(numPrice) || numPrice <= 0) {
            return NextResponse.json({ error: "Invalid price." });
        }
        if (typeof symbol !== 'string' || !symbol.trim()) {
            return NextResponse.json({ error: "Invalid symbol." });
        }

        const amountToDeduct = Number((numPrice * numQuantity).toFixed(3));
        const uniqueid = Date.now();
        const session = await auth();
        const email = session?.user?.email;

        if (!email) {
            return NextResponse.json({ error: "User not logged in." });
        }

        await connectDB();
        
        dbSession = await UserModel.startSession();
        dbSession.startTransaction();

        const user = await UserModel.findOne({ email }).session(dbSession);
        if (!user) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ error: "User not found." });
        }

        if (user.balance < amountToDeduct) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ error: "Insufficient balance." });
        }

        const updateResult = await UserModel.updateOne(
            { email },
            { $inc: { balance: -amountToDeduct } },
            { session: dbSession }
        );

        if (updateResult.modifiedCount !== 1) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ error: "User balance update failed." });
        }

        const actiontype = "hold";
        const newHolding: HoldingDocument = new HoldingModel({ email, uniqueid, quantity: numQuantity, price: numPrice, actiontype, symbol });
        await newHolding.save({ session: dbSession });
        
        const newTransaction: TransactionsDocument = new TransactionModel({ email, uniqueid, quantity: numQuantity, price: numPrice, actiontype, symbol });
        await newTransaction.save({ session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        const balance = await getBalanceByEmail(email);
        return NextResponse.json(balance.balance);
    } catch (error:any) {
        console.error('Error in POST request:', error);
        if (dbSession) {
            await dbSession.abortTransaction();
            dbSession.endSession();
        }
        return NextResponse.json({ error: error.message });
    }
}
