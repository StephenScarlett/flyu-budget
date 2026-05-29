"use client";

import { TIER_CONFIG, type TierKey } from "../../lib/constants";
import { calculateMemberTierTotal, convertToTTD, formatUSD, formatTTD } from "../../lib/calculations";
import type { BudgetItem, Member } from "../../lib/supabase/types";

interface GroupTotalProps {
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
  members: Member[];
  selectedMember: string | null;
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function GroupTotal({ items, groupSize, usdToTtd, members, selectedMember }: GroupTotalProps) {
  const activeMembers = members.filter((m) => m.is_active);

  if (activeMembers.length === 0) return null;

  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">Member Budgets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1a1a] text-left">
                  <th className="px-6 py-3 font-medium text-gray-400">Member</th>
                  {tiers.map((tier) => (
                    <th key={tier} className={`px-6 py-3 font-medium text-right ${TIER_CONFIG[tier].color}`}>
                      {TIER_CONFIG[tier].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(selectedMember ? activeMembers.filter((m) => m.id === selectedMember) : activeMembers).map((member) => (
                  <tr key={member.id} className="hover:bg-[#1a1a1a]">
                    <td className="px-6 py-3 font-medium text-gray-200">{member.name}</td>
                    {tiers.map((tier) => {
                      const total = calculateMemberTierTotal(tier, items, member.id, activeMembers);
                      return (
                        <td key={tier} className="px-6 py-3 text-right font-mono">
                          <div className="text-gray-200">{formatUSD(total)}</div>
                          <div className="text-xs text-gray-500">{formatTTD(convertToTTD(total, usdToTtd))}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    </div>
  );
}
