import { auth } from "@/auth";
import { TransactionModel } from "@/models/Transactions";
import connectDB from "@/util/dbConnect";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const urlparams = request.nextUrl.searchParams;
    const investmentsparam = urlparams.get('investment');
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        return NextResponse.json({ error: "User not logged in." });
    }

    try {
        await connectDB();
        if(investmentsparam){
            const investments = await TransactionModel.find({ email, uniqueid:investmentsparam,actiontype:"hold" }).select('-email -_id').lean();
            return NextResponse.json(investments);
        }else{
            const investments = await TransactionModel.find({ email }).select('-email -_id').lean();
            return NextResponse.json(investments);

        }
        


    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
