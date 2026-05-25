import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
  
  try {
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;
    
    // Validate environment variables
    const KIT_KEY = process.env.KIT_KEY;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!KIT_KEY || !PRIVATE_KEY) {
      return res.status(500).json({ error: "Server configuration error: Missing environment variables" });
    }

    // Initialize Circle App Kit
    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: PRIVATE_KEY,
    });
    
    // Prepare swap parameters
    const params = {
      from: {
        adapter: adapter,
        chain: "Arc_Testnet", // Important: Use the exact string from the docs[reference:1]
      },
      tokenIn: tokenIn,   // e.g., "USDC"
      tokenOut: tokenOut, // e.g., "EURC"
      amountIn: amountIn,
      userAddress: walletAddress, // The user's connected wallet
      config: {
        kitKey: KIT_KEY,
      },
    };
    
    // Get the swap transaction data from Circle
    const swapResult = await kit.swap(params);
    
    if (!swapResult.to || !swapResult.data) {
      throw new Error("Swap preparation did not return valid transaction data");
    }
    
    // Return the transaction object for the frontend to send
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
