import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  // const { symbol, interval } = await request.json();
  try {
    const response = await axios.get('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=19999000000');

  

    // if (!response.data || !Array.isArray(response.data)) {
    //   throw new Error('Expected an array in response, but received something else.');


    return NextResponse.json(response.data);
  } catch (error:any) {
    console.error('Error fetching data from Binance API:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
