import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 });

  const apiKey = process.env.ZERION_API_KEY;
  if (!apiKey) return NextResponse.json({ data: [] }); // graceful fallback

  const url = `https://api.zerion.io/v1/wallets/${address}/positions?currency=usd`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  const data = await res.json();
  return NextResponse.json(data);
}
