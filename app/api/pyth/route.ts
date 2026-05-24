import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Simulated volatility – in production call Pyth Hermes
  return NextResponse.json({
    symbol: req.nextUrl.searchParams.get("symbol") || "ETH/USD",
    price: 3200,
    volatility_24h: Math.random() * 8, // random 0-8% for demo
  });
}
