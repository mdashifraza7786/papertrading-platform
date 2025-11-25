import { auth } from "@/auth";
import { HoldingModel, HoldingDocument } from "@/models/Holding";
import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        return NextResponse.json({ error: "User not logged in." });
    }

    try {
        await connectDB();

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

        const aggregatedData = await HoldingModel.aggregate<HoldingDocument>(aggregatePipeline);

        return NextResponse.json(aggregatedData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
