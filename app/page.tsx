"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Portfolio from "@/components/Portfolio";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💰 Adaptive Portfolio</h1>
          <ConnectButton />
        </div>
        {isConnected ? <Portfolio /> : <div className="text-center py-20 text-gray-500">Connect your wallet to see your portfolio</div>}
      </div>
    </main>
  );
}
