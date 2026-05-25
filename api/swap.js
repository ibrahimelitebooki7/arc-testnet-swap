// api/swap.js
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  // Enable CORS for your frontend domain (update '*' with your actual domain in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Destructure and validate the incoming request
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;

    if (!tokenIn || !tokenOut || !amountIn || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields: tokenIn, tokenOut, amountIn, walletAddress" });
    }

    // 2. Access the secret keys from environment variables
    const KIT_KEY = process.env.KIT_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!KIT_KEY || !PRIVATE_KEY) {
      console.error("Server configuration error: Missing KIT_KEY or PRIVATE_KEY");
      return res.status(500).json({ error: "Server configuration error: Missing API keys" });
    }

    // 3. Initialize Circle AppKit and the Viem adapter with your private key
    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: PRIVATE_KEY,
    });

    // 4. Prepare the swap parameters
    const swapParams = {
      from: {
        adapter: adapter,
        chain: "Arc_Testnet", // The chain where the swap will happen
      },
      tokenIn: tokenIn,   // e.g., "USDC"
      tokenOut: tokenOut, // e.g., "EURC"
      amountIn: amountIn,
      config: {
        kitKey: KIT_KEY, // Your AppKit key
      },
    };

    // 5. Get the swap transaction data from Circle AppKit
    const swapResult = await kit.swap(swapParams);

    // 6. Validate the result before returning
    if (!swapResult.to || !swapResult.data) {
      throw new Error("Swap preparation did not return valid transaction data");
    }

    // 7. Return the raw unsigned transaction to the frontend
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
