import { auth } from "@/auth";
import { HoldingModel } from "@/models/Holding";
import { TransactionModel } from "@/models/Transactions";
import { getBalanceByEmail, UserModel } from "@/models/Users";
import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    let session = null;
    try {
        const { id, priceat } = await request.json();
        const uniqueid = Number(id);
        const sessions = await auth();
        const email = sessions?.user?.email;

        if (!email) {
            return NextResponse.json({ error: "User not logged in." });
        }

        await connectDB();

        session = await UserModel.startSession();
        session.startTransaction();

        const holding = await HoldingModel.findOne({ uniqueid }).session(session);

        if (!holding) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "Holding not found." });
        }

        const quantityValue = Number(holding.quantity);
        if (isNaN(quantityValue)) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "Invalid quantity value." });
        }

        const amountToUpdate = priceat * quantityValue;

        const deletedHolding = await HoldingModel.findOneAndDelete({ uniqueid }).session(session);

        if (!deletedHolding) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "Holding deletion failed." });
        }

        const updatedTransaction = await TransactionModel.findOneAndUpdate(
            { uniqueid },
            { $set: { actiontype: "sold", sellat: amountToUpdate } },
            { new: true }
        ).session(session);

        if (!updatedTransaction) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "Transaction update failed." });
        }

        // Update user balance directly without fetching and saving again
        const updateResult = await UserModel.updateOne(
            { email },
            { $inc: { balance: amountToUpdate } },
            { session }
        );

        if (updateResult.modifiedCount !== 1) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "User balance update failed." });
        }

        await session.commitTransaction();
        session.endSession();

        const balance = await getBalanceByEmail(email);
        return NextResponse.json(balance.balance);
    } catch (error: any) {
        console.error('Error in POST request:', error);
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        return NextResponse.json({ error: error.message });
    }
}
