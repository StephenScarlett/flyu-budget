"use client";

import { Fragment } from "react";
import { TIER_CONFIG, CATEGORIES, type TierKey } from "../../lib/constants";
import type { BudgetItem } from "../../lib/supabase/types";
import { Check, X, CATEGORY_ICONS } from "../../lib/icons";

interface FeatureMatrixProps {
  items: BudgetItem[];
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

function itemIncludedInTier(item: BudgetItem, tier: TierKey): boolean {
  return item.tier === "all" || item.tier === tier || item.tier.includes(tier);
}

export default function FeatureMatrix({ items }: FeatureMatrixProps) {
  // Group items by category, preserving CATEGORIES order
  const grouped = CATEGORIES
    .map((cat) => ({
      key: cat.key,
      label: cat.label,
      items: items.filter((i) => i.category === cat.key && i.is_included),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h3 className="font-semibold text-white">What&apos;s Included</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1a]">
              <th className="px-6 py-3 text-left font-medium text-gray-400">Feature</th>
              {tiers.map((tier) => (
                <th
                  key={tier}
                  className={`px-6 py-3 text-center font-medium ${TIER_CONFIG[tier].color}`}
                >
                  {TIER_CONFIG[tier].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {grouped.map((group) => {
              const CatIcon = CATEGORY_ICONS[group.key];
              return (
                <Fragment key={group.key}>
                  <tr className="bg-[#111]">
                    <td colSpan={4} className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1.5">
                        {CatIcon && <CatIcon className="w-3.5 h-3.5 text-sky-400" />}
                        {group.label}
                      </span>
                    </td>
                  </tr>
                  {group.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1a1a1a]">
                      <td className="px-6 py-2.5 text-gray-300 pl-10">{item.name}</td>
                      {tiers.map((tier) => (
                        <td key={tier} className="px-6 py-2.5 text-center">
                          {itemIncludedInTier(item, tier) ? (
                            <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
