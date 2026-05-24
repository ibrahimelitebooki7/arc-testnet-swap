import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const chainId = req.nextUrl.searchParams.get("chainId") || "1";
  if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 });

  const apiKey = process.env.COVALENT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return NextResponse.json(data);
}
