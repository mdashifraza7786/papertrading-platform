import { auth } from "@/auth";
import { getBalanceByEmail } from "@/models/Users";
import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";

export async function GET(){
    const session = await auth();
    
    const email = session?.user?.email;
    if(!email){
        return NextResponse.json({error:"User not logged in."})
    }
    try{
        await connectDB();
        
        const balance = await getBalanceByEmail(email);
        return NextResponse.json(balance.balance);
    }catch(error:any){
        return NextResponse.json(error.message);
    }
}