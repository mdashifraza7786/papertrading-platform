import connectDB from "@/util/dbConnect";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
   const dbConnected = await connectDB();
   const session = await auth();
   
   return NextResponse.json({
      dbConnected: dbConnected ? true : false,
      authenticated: session ? true : false,
      msg: dbConnected ? "success" : "error"
   });
}