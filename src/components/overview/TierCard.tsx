"use client";

import { TIER_CONFIG, type TierKey } from "../../lib/constants";
import { calculateMemberTierTotal, convertToTTD, formatUSD, formatTTD } from "../../lib/calculations";
import type { BudgetItem, Member } from "../../lib/supabase/types";
import { TIER_ICONS } from "../../lib/icons";

interface MemberOverviewCardProps {
  member: Member;
  items: BudgetItem[];
  activeMembers: Member[];
  usdToTtd: number;
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function MemberOverviewCard({ member, items, activeMembers, usdToTtd }: MemberOverviewCardProps) {
  const balanced = calculateMemberTierTotal("balanced", items, member.id, activeMembers);
  const balancedTTD = convertToTTD(balanced, usdToTtd);

  return (
    <div className="rounded-xl border border-gray-800 bg-[#141414] p-6 transition-all hover:border-sky-600">
      <div className="flex items-center gap-3 mb-5">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.name} className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-sky-900/40 flex items-center justify-center text-sky-300 text-base font-bold">
            {member.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-white">{member.name}</h3>
          <p className="text-xs text-gray-500">{member.is_single ? "Single room" : "Shared room"}</p>
        </div>
      </div>
      <div className="text-center mb-5">
        <p className="text-3xl font-extrabold text-sky-300">{formatUSD(balanced)}</p>
        <p className="text-sm text-gray-500 mt-1">{formatTTD(balancedTTD)}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const total = calculateMemberTierTotal(tier, items, member.id, activeMembers);
          const totalTTD = convertToTTD(total, usdToTtd);
          const config = TIER_CONFIG[tier];
          const Icon = TIER_ICONS[tier];
          return (
            <div key={tier} className={`text-center rounded-lg ${config.bg} py-3 px-2`}>
              <Icon className={`w-4 h-4 mx-auto ${config.iconColor} mb-1`} />
              <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
              <p className="text-sm font-mono text-gray-200 mt-1.5">{formatUSD(total)}</p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{formatTTD(totalTTD)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
