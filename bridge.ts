import 'dotenv/config';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createViemAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2';
import { http, createWalletClient } from 'viem';
import { sepolia, arcTestnet } from 'viem/chains';

async function bridgeUSDC() {
  // 1. Initialize the adapter with your wallet's private key
  //    The adapter handles signing transactions on EVM chains[reference:3].
  const adapter = createViemAdapterFromPrivateKey({
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  });

  // 2. Instantiate the Bridge Kit
  const bridgeKit = new BridgeKit();

  console.log('🚀 Initiating USDC bridge from Sepolia to Arc Testnet...');

  try {
    // 3. Execute the bridge transfer
    const result = await bridgeKit.bridge({
      from: {
        adapter: adapter,
        chain: 'Ethereum_Sepolia', // Source chain ID[reference:4]
      },
      to: {
        adapter: adapter,
        chain: 'Arc_Testnet',     // Destination chain ID
      },
      amount: '1.00',             // Amount of USDC to bridge
    });

    console.log('✅ Bridge transaction submitted!');
    console.log(`   Transaction Hash: ${result.transactionHash}`);
    console.log(`   Status: ${result.status}`);
    // Note: result may also contain a 'sourceTransactionReceipt' and 'destinationTransactionReceipt'[reference:5].
  } catch (error) {
    console.error('❌ Bridge failed:', error);
  }
}

bridgeUSDC();
