import { auth } from "@/auth";
import { HoldingModel } from "@/models/Holding";
import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { uniqueid } = await request.json();
        const session = await auth();
        const email = session?.user?.email;

        if (!email) {
            return NextResponse.json({ error: "User not logged in." });
        }
        
        await connectDB();
        
        const holding = await HoldingModel.findOne({ uniqueid });

        if (!holding) {
            return NextResponse.json({ error: "Holding not found." });
        }
        
        const quantityValue = Number(holding.quantity);


        console.log('Quantity Value:', quantityValue);
        
        return NextResponse.json({holdingQuantity:quantityValue});
    } catch (error:any) {
        console.error('Error in POST request:', error);
        return NextResponse.json({ error: error.message });
    }
}
