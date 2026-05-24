import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;
    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize AppKit with your backend wallet key (used only for preparation)
    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY,
    });

    // ⭐ Prepare the swap params
    const params = {
      from: { adapter, chain: 'Arc_Testnet' },
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      config: { kitKey: process.env.KIT_KEY },
    };

    // ⭐ Instead of sending the tx, we now build the unsigned transaction data
    const swapCall = await kit.swap(params);
    // Transform swapCall into the shape your frontend expects
    const transaction = {
      to: swapCall.to,
      data: swapCall.data,
      value: swapCall.value,
      gas: swapCall.gas || 500000,
      gasPrice: swapCall.gasPrice,
    };
    return res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
