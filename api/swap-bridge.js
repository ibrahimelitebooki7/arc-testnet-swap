import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tokenIn, tokenOut, amountIn, walletAddress } = req.body;

    // Validate required fields
    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({ error: 'Missing swap parameters: tokenIn, tokenOut, amountIn' });
    }

    const kit = new AppKit();
    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.PRIVATE_KEY,
    });

    const params = {
      from: { adapter, chain: 'Arc_Testnet' },
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      config: { kitKey: process.env.KIT_KEY },
      slippagePercent: 0.5,
    };

    const swapCall = await kit.swap(params);

    // Return transaction object exactly as the frontend expects
    const transaction = {
      to: swapCall.to,
      data: swapCall.data,
      value: swapCall.value || '0x0',
      gas: swapCall.gas || 500000,
      gasPrice: swapCall.gasPrice,
    };
    return res.status(200).json(transaction);
  } catch (error) {
    console.error('Swap error:', error);
    return res.status(500).json({ error: error.message });
  }
}
