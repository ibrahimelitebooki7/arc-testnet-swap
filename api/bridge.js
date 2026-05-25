import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { privateKeyToAccount } from 'viem/accounts';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.KIT_KEY) throw new Error("Missing KIT_KEY");
    if (!process.env.PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY");

    const { sourceChain, destChain, amount, recipient, token = "USDC" } = req.body;

    if (!sourceChain || !destChain || !amount) {
      return res.status(400).json({ error: "Missing required fields: sourceChain, destChain, amount" });
    }

    // At least one chain must be Arc Testnet (as required)
    if (!sourceChain.includes("Arc") && !destChain.includes("Arc")) {
      return res.status(400).json({ error: "One side must be Arc Testnet" });
    }

    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY,
    });

    // Bridge via Circle's App Kit (which internally uses CCTP)
    // The recipient is the address on the destination chain (user's wallet or custom)
    const result = await kit.bridge({
      from: { adapter, chain: sourceChain },
      to: { adapter, chain: destChain },
      amount: amount.toString(),
      recipient: recipient,
      token: token,        // "USDC"
      config: { kitKey: process.env.KIT_KEY },
    });

    console.log("Bridge result:", JSON.stringify(result, null, 2));

    return res.status(200).json({
      success: true,
      transactionHash: result.transactionHash,
      fullResult: result,
    });

  } catch (error) {
    console.error("Bridge error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Bridge failed",
    });
  }
}
