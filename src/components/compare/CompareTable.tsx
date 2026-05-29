"use client";

import { TIER_CONFIG, CATEGORIES, type TierKey } from "../../lib/constants";
import { convertToTTD, formatUSD, formatTTD, calculateTierTotal } from "../../lib/calculations";
import type { BudgetItem, Member } from "../../lib/supabase/types";
import { TIER_ICONS, CATEGORY_ICONS } from "../../lib/icons";

interface CompareTableProps {
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
  members: Member[];
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function CompareTable({ items, groupSize, usdToTtd, members }: CompareTableProps) {
  function getCategoryTotal(category: string, tier: TierKey): number {
    const catItems = items.filter((i) => i.category === category && i.is_included);
    const included = catItems.filter(
      (i) => i.tier === "all" || i.tier === tier || i.tier.includes(tier)
    );
    let total = 0;
    for (const item of included) {
      if (item.cost_type === "per_person") total += item.cost_usd;
      else if (item.cost_type === "total_group") total += item.cost_usd / groupSize;
      else if (item.cost_type === "per_room") total += item.cost_usd / 2;
    }
    return total;
  }

  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1a]">
              <th className="px-6 py-3 text-left font-medium text-gray-400">Category</th>
              {tiers.map((tier) => {
                const Icon = TIER_ICONS[tier];
                return (
                  <th
                    key={tier}
                    className={`px-6 py-3 text-right font-medium ${TIER_CONFIG[tier].color}`}
                  >
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <Icon className={`w-4 h-4 ${TIER_CONFIG[tier].iconColor}`} />
                      {TIER_CONFIG[tier].label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {CATEGORIES.map((cat) => {
              const hasItems = items.some((i) => i.category === cat.key);
              if (!hasItems) return null;
              const CatIcon = CATEGORY_ICONS[cat.key];

              return (
                <tr key={cat.key} className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-3 font-medium text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      {CatIcon && <CatIcon className="w-4 h-4 text-sky-400" />}
                      {cat.label}
                    </span>
                  </td>
                  {tiers.map((tier) => {
                    const total = getCategoryTotal(cat.key, tier);
                    return (
                      <td key={tier} className="px-6 py-3 text-right font-mono text-gray-200">
                        {formatUSD(total)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="bg-[#1a1a1a] font-bold border-t-2 border-gray-700">
              <td className="px-6 py-3 text-white">Total Per Person</td>
              {tiers.map((tier) => {
                const total = calculateTierTotal(tier, items, groupSize);
                return (
                  <td key={tier} className={`px-6 py-3 text-right font-mono ${TIER_CONFIG[tier].color}`}>
                    <div>{formatUSD(total)}</div>
                    <div className="text-xs font-normal text-gray-400">
                      {formatTTD(convertToTTD(total, usdToTtd))}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
