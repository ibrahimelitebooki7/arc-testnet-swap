import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

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

    const { sourceChain, destChain, amount, recipient } = req.body;
    if (!sourceChain || !destChain || !amount) {
      return res.status(400).json({ error: "Missing sourceChain, destChain, or amount" });
    }
    if (!sourceChain.includes("Arc") && !destChain.includes("Arc")) {
      return res.status(400).json({ error: "One side must be Arc Testnet" });
    }

    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY,
    });

    // Get the burn transaction (user will sign it)
    const result = await kit.bridge({
      from: { adapter, chain: sourceChain },
      to: { adapter, chain: destChain },
      amount: amount.toString(),
      recipient: recipient,
      token: "USDC",
      config: { kitKey: process.env.KIT_KEY },
    });

    // Return transaction object for frontend to sign and send
    const transaction = {
      to: result.to,
      data: result.data,
      value: result.value || "0x0",
      gas: result.gas || 500000,
      gasPrice: result.gasPrice,
    };

    console.log("Bridge burn transaction prepared:", transaction);
    return res.status(200).json(transaction);
  } catch (error) {
    console.error("Bridge error:", error);
    return res.status(500).json({ error: error.message || "Bridge preparation failed" });
  }
}
