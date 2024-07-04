import { NextResponse } from "next/server";

export async function POST(request:Request){
    const {symbol,interval} = await request.json()

    try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=19999000000`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        return NextResponse.json(data);
      } catch (err:any) {
        return NextResponse.json(err.message);
      }
      
}