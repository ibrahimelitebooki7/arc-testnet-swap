import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Simulated volatility – replace with real Pyth Hermes endpoint later
  return NextResponse.json({
    symbol: req.nextUrl.searchParams.get("symbol") || "ETH/USD",
    price: 3200,
    volatility_24h: Math.random() * 8,
  });
}
