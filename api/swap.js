import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { privateKeyToAccount } from 'viem/accounts';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET route – used by frontend to display backend wallet address
  if (req.method === 'GET') {
    try {
      const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
      return res.status(200).json({ backendAddress: account.address });
    } catch (err) {
      return res.status(500).json({ error: "Cannot derive backend address" });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.KIT_KEY) throw new Error("Missing KIT_KEY");
    if (!process.env.PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY");

    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;
    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({ error: "Missing tokenIn, tokenOut, or amountIn" });
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
      config: { kitKey: process.env.KIT_KEY },
    };

    const result = await kit.swap(params);

    // Return transaction object that the frontend can directly send via wallet
    const transaction = {
      to: result.to,
      data: result.data,
      value: result.value || "0x0",
      gas: result.gas || 500000,
      gasPrice: result.gasPrice,
    };

    console.log("Swap transaction prepared:", transaction);
    return res.status(200).json(transaction);
  } catch (error) {
    console.error("Swap error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Swap preparation failed"
    });
  }
}
