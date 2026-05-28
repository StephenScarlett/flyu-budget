"use client";

import { TIER_CONFIG, type TierKey } from "../../lib/constants";
import { calculateTierTotal, convertToTTD, formatUSD, formatTTD } from "../../lib/calculations";
import type { BudgetItem } from "../../lib/supabase/types";
import { TIER_ICONS } from "../../lib/icons";

interface GroupTotalProps {
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function GroupTotal({ items, groupSize, usdToTtd }: GroupTotalProps) {
  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h3 className="font-semibold text-white">
          Group Total ({groupSize} people)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1a] text-left">
              <th className="px-6 py-3 font-medium text-gray-400">Tier</th>
              <th className="px-6 py-3 font-medium text-gray-400 text-right">Per Person (USD)</th>
              <th className="px-6 py-3 font-medium text-gray-400 text-right">Per Person (TTD)</th>
              <th className="px-6 py-3 font-medium text-gray-400 text-right">Group Total (USD)</th>
              <th className="px-6 py-3 font-medium text-gray-400 text-right">Group Total (TTD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {tiers.map((tier) => {
              const perPerson = calculateTierTotal(tier, items, groupSize);
              const perPersonTTD = convertToTTD(perPerson, usdToTtd);
              const groupTotal = perPerson * groupSize;
              const groupTTD = convertToTTD(groupTotal, usdToTtd);
              const config = TIER_CONFIG[tier];
              const Icon = TIER_ICONS[tier];

              return (
                <tr key={tier} className="hover:bg-[#1a1a1a]">
                  <td className={`px-6 py-3 font-medium ${config.color}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-gray-200">{formatUSD(perPerson)}</td>
                  <td className="px-6 py-3 text-right font-mono text-gray-500">{formatTTD(perPersonTTD)}</td>
                  <td className="px-6 py-3 text-right font-mono font-semibold text-white">{formatUSD(groupTotal)}</td>
                  <td className="px-6 py-3 text-right font-mono text-gray-500">{formatTTD(groupTTD)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
