import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { privateKeyToAccount } from 'viem/accounts';   // <-- ADD THIS

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- TEMPORARY GET route (remove after you get the address) ---
  if (req.method === 'GET') {
    const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
    return res.status(200).json({ backendAddress: account.address });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 4. Wrap the entire logic to catch and return errors as JSON
  try {
    // 5. Check if the required environment variables exist
    if (!process.env.KIT_KEY) {
      throw new Error("Missing KIT_KEY environment variable");
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error("Missing PRIVATE_KEY environment variable");
    }

    // 6. Extract parameters from the request body
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;

    // 7. Validate the request body
    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({ error: "Missing required fields: tokenIn, tokenOut, amountIn" });
    }

    // 8. Initialize the Circle App Kit SDK
    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY,
    });

    // 9. Prepare swap parameters exactly as defined in the official documentation
    // The slippage configuration is handled internally by the SDK.
    // Documentation: https://docs.arc.network/app-kit/swap
    const params = {
      from: { adapter, chain: "Arc_Testnet" },
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      amountIn: amountIn.toString(),
      config: { kitKey: process.env.KIT_KEY },
    };

    // 10. Execute the swap
    const result = await kit.swap(params);

    // 11. Send a successful JSON response back to the frontend
    return res.status(200).json({
      success: true,
      transactionHash: result.transactionHash
    });

  } catch (error) {
    console.error("Swap error:", error);
    // 12. Catch any error and return a proper JSON error message
    return res.status(500).json({
      success: false,
      error: error.message || "An internal server error occurred."
    });
  }
}
