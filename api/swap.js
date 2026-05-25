import { AppKit } from "@circle-fin/app-kit";
import { BridgeKit } from "@circle-fin/bridge-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;

    // -------------------- SWAP (on Arc Testnet) --------------------
    if (body.tokenIn && body.tokenOut && body.amountIn) {
      const { tokenIn, tokenOut, amountIn, walletAddress } = body;

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
      const transaction = {
        to: swapCall.to,
        data: swapCall.data,
        value: swapCall.value || '0x0',
        gas: swapCall.gas || 500000,
        gasPrice: swapCall.gasPrice,
      };
      return res.status(200).json(transaction);
    }

    // -------------------- BRIDGE (cross‑chain USDC) --------------------
    if (body.fromChain && body.toChain && body.amount) {
      const { fromChain, toChain, amount, walletAddress } = body;

      const adapter = createViemAdapterFromPrivateKey({
        privateKey: process.env.PRIVATE_KEY,
      });

      // ✅ Correct instantiation of BridgeKit
      const bridgeKit = new BridgeKit();

      // ✅ Use bridgeKit.bridge() as per official docs
      const result = await bridgeKit.bridge({
        from: { adapter, chain: fromChain },
        to: { adapter, chain: toChain },
        amount: amount.toString(),
      });

      const transaction = {
        to: result.transaction.to,
        data: result.transaction.data,
        value: result.transaction.value || '0x0',
        gas: result.transaction.gasLimit || 500000,
        gasPrice: result.transaction.gasPrice,
      };
      return res.status(200).json(transaction);
    }

    // If neither swap nor bridge parameters are provided
    return res.status(400).json({ error: 'Invalid request: missing swap or bridge parameters' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
