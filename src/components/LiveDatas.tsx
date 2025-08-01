import React, { useEffect, useState } from 'react';

interface PriceData {
  symbol: string;
  price: number;
}

interface WebSocketPriceComponentProps {
  symbols: string[];
  onPriceUpdate: (prices: PriceData[]) => void;
}

const LiveDatas: React.FC<WebSocketPriceComponentProps> = ({ symbols, onPriceUpdate }) => {
  useEffect(() => {
    const wsURLs = symbols.map(symbol => `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@ticker`);
    const websockets = wsURLs.map(wsURL => {
      const ws = new WebSocket(wsURL);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const newPrice: PriceData = {
          symbol: data.s,
          price: parseFloat(data.c),
        };
        onPriceUpdate([newPrice]); 
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
      };

      return ws;
    });

    return () => {
      websockets.forEach(ws => ws.close());
    };
  }, [symbols, onPriceUpdate]);

  return null; 
};

export default LiveDatas;
