import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";

export async function GET(){
   if(await connectDB()){
    return NextResponse.json({msg:"succes"}); 
   }else{
    return NextResponse.json({msg:"error"});
   }
}