// api/swap.js
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;

    // Validate required fields
    if (!tokenIn || !tokenOut || !amountIn || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields: tokenIn, tokenOut, amountIn, walletAddress" });
    }

    // Fetch environment variables
    const KIT_KEY = process.env.KIT_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!KIT_KEY || !PRIVATE_KEY) {
      console.error("Missing KIT_KEY or PRIVATE_KEY in environment");
      return res.status(500).json({ error: "Server configuration error: missing keys" });
    }

    // Initialize Circle AppKit
    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: PRIVATE_KEY,
    });

    // Build swap parameters – MUST use token symbols, not addresses
    const swapParams = {
      from: {
        adapter: adapter,
        chain: "Arc_Testnet",           // exact string as per Circle docs
      },
      tokenIn: tokenIn,                 // "USDC" or "EURC"
      tokenOut: tokenOut,               // "USDC" or "EURC"
      amountIn: amountIn.toString(),    // force string
      config: {
        kitKey: KIT_KEY,
      },
    };

    // Log the exact payload for debugging (visible in Vercel logs)
    console.log("swapParams:", JSON.stringify(swapParams, null, 2));

    // Call Circle's swap API
    const swapResult = await kit.swap(swapParams);

    if (!swapResult || !swapResult.to || !swapResult.data) {
      throw new Error("Invalid response from Circle: missing to or data");
    }

    // Return raw unsigned transaction for frontend to send
    const transaction = {
      to: swapResult.to,
      data: swapResult.data,
      value: swapResult.value || "0x0",
      gas: swapResult.gas || 500000,
      gasPrice: swapResult.gasPrice,
    };

    return res.status(200).json(transaction);
  } catch (error) {
    console.error("Swap API error:", error);
    // Send back a meaningful error message
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
