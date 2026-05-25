import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;
    if (!tokenIn || !tokenOut || !amountIn || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!process.env.KIT_KEY || !process.env.PRIVATE_KEY) {
      return res.status(500).json({ error: "Server misconfigured: missing KIT_KEY or PRIVATE_KEY" });
    }

    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY,
    });

    const params = {
      from: { adapter, chain: "Arc_Testnet" },
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      userAddress: walletAddress,   // critical
      config: { kitKey: process.env.KIT_KEY },
    };

    const result = await kit.swap(params);

    // Validate result
    if (!result.to || !result.data) {
      throw new Error("Swap preparation returned invalid transaction data");
    }

    const transaction = {
      to: result.to,
      data: result.data,
      value: result.value || '0x0',
      gas: result.gas || 500000,
      gasPrice: result.gasPrice,
    };
    return res.status(200).json(transaction);
  } catch (error) {
    console.error("Swap error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
