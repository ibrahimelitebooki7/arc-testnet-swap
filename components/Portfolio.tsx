"use client";

import { useAccount, useChainId } from "wagmi";
import { useEffect, useState } from "react";
import axios from "axios";

interface Token {
  contract_name: string;
  contract_ticker_symbol: string;
  balance: string;
  quote: number;
  quote_rate: number;
  logo_url: string;
}

export default function Portfolio() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [defiPositions, setDefiPositions] = useState<any[]>([]);
  const [riskAlert, setRiskAlert] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [totalUsd, setTotalUsd] = useState(0);

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Token balances via Covalent (GoldRush)
        const tokenRes = await axios.get(`/api/covalent?address=${address}&chainId=${chainId}`);
        const rawTokens = tokenRes.data.data?.items || [];
        const formatted = rawTokens
          .filter((t: any) => Number(t.balance) > 0)
          .map((t: any) => ({
            contract_name: t.contract_name,
            contract_ticker_symbol: t.contract_ticker_symbol,
            balance: (Number(t.balance) / 10 ** t.contract_decimals).toFixed(4),
            quote: t.quote || 0,
            quote_rate: t.quote_rate || 0,
            logo_url: t.logo_url || "",
          }));
        setTokens(formatted);
        const total = formatted.reduce((sum, t) => sum + (t.quote || 0), 0);
        setTotalUsd(total);

        // 2. DeFi positions via Zerion (optional, will gracefully fail if no key)
        try {
          const defiRes = await axios.get(`/api/zerion?address=${address}`);
          setDefiPositions(defiRes.data.data || []);
        } catch (e) { console.log("Zerion not configured"); }

        // 3. Risk alert via Pyth simulation
        const pythRes = await axios.get(`/api/pyth?symbol=ETH/USD`);
        const volatility = pythRes.data.volatility_24h || 0;
        if (volatility > 5) {
          setRiskAlert(`⚠️ High ETH volatility: ${volatility}%`);
        } else {
          setRiskAlert("");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [address, chainId]);

  if (loading) return <div className="text-center py-20">Loading portfolio...</div>;

  return (
    <div className="space-y-8">
      {/* Total Value */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h2 className="text-xl font-semibold">Total Portfolio Value</h2>
        <p className="text-4xl font-bold text-green-600">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      </div>

      {/* Risk Alert */}
      {riskAlert && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-700">{riskAlert}</p>
        </div>
      )}

      {/* Tokens Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b font-semibold text-lg">🪙 Token Balances</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="p-3 text-left">Token</th><th>Balance</th><th>Price</th><th>Value (USD)</th></tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.contract_ticker_symbol} className="border-t">
                  <td className="p-3 flex items-center gap-2">
                    <img src={t.logo_url || "/fallback.png"} className="w-6 h-6 rounded-full" />
                    {t.contract_name} ({t.contract_ticker_symbol})
                  </td>
                  <td className="p-3">{t.balance}</td>
                  <td className="p-3">${t.quote_rate?.toFixed(4)}</td>
                  <td className="p-3 font-medium">${t.quote?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DeFi Positions */}
      {defiPositions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="font-semibold text-lg mb-3">🏦 DeFi Positions</h2>
          {defiPositions.map((pos, idx) => (
            <div key={idx} className="flex justify-between border-b py-2">
              <span>{pos.protocol || "Unknown"} – {pos.asset || "Asset"}</span>
              <span>${(pos.value_usd || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
