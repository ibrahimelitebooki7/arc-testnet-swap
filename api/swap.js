import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  // Enable CORS for your frontend domain (replace * with your domain in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;

    // validation
    if (!tokenIn || !tokenOut || !amountIn || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // environment variables
    const KIT_KEY = process.env.KIT_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!KIT_KEY || !PRIVATE_KEY) {
      console.error("Missing KIT_KEY or PRIVATE_KEY in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // initialize Circle AppKit
    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: PRIVATE_KEY,
    });

    // prepare swap parameters for Arc Testnet
    const params = {
      from: {
        adapter: adapter,
        chain: "Arc_Testnet",         // exact identifier used by Circle
      },
      tokenIn: tokenIn,               // "USDC" or "EURC"
      tokenOut: tokenOut,
      amountIn: amountIn,
      userAddress: walletAddress,     // user's wallet that will sign
      config: {
        kitKey: KIT_KEY,
      },
    };

    // call Circle's swap builder
    const swapResult = await kit.swap(params);

    // ensure we got a valid transaction object
    if (!swapResult.to || !swapResult.data) {
      throw new Error("Swap preparation did not return valid transaction data");
    }

    // return the raw transaction – frontend will send it via wallet
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
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
