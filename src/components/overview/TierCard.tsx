"use client";

import { TIER_CONFIG, type TierKey } from "../../lib/constants";
import { calculateTierTotal, convertToTTD, formatUSD, formatTTD } from "../../lib/calculations";
import type { BudgetItem } from "../../lib/supabase/types";
import { TIER_ICONS } from "../../lib/icons";

interface TierCardProps {
  tier: TierKey;
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
}

export default function TierCard({ tier, items, groupSize, usdToTtd }: TierCardProps) {
  const config = TIER_CONFIG[tier];
  const perPerson = calculateTierTotal(tier, items, groupSize);
  const perPersonTTD = convertToTTD(perPerson, usdToTtd);
  const Icon = TIER_ICONS[tier];

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} p-6 flex flex-col items-center text-center transition-all hover:border-sky-600`}
    >
      <Icon className={`w-8 h-8 mb-2 ${config.iconColor}`} />
      <h3 className={`text-lg font-bold ${config.color}`}>{config.label}</h3>
      <p className="text-xs text-gray-500 mt-1 mb-4">Per Person</p>

      <p className={`text-3xl font-extrabold ${config.color}`}>{formatUSD(perPerson)}</p>
      <p className="text-sm text-gray-500 mt-1">{formatTTD(perPersonTTD)}</p>
    </div>
  );
}
