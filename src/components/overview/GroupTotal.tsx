"use client";

import { useState, useMemo } from "react";
import { TIER_CONFIG, type TierKey } from "../../lib/constants";
import { calculateMemberTierTotal, convertToTTD, formatUSD, formatTTD } from "../../lib/calculations";
import type { BudgetItem, Member } from "../../lib/supabase/types";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "../../lib/icons";

interface GroupTotalProps {
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
  members: Member[];
  selectedMembers: string[];
}

type SortField = "name" | "budget" | "balanced" | "premium";

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function GroupTotal({ items, groupSize, usdToTtd, members, selectedMembers }: GroupTotalProps) {
  const activeMembers = members.filter((m) => m.is_active);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === "name"); }
  };

  const visibleMembers = selectedMembers.length > 0
    ? activeMembers.filter((m) => selectedMembers.includes(m.id))
    : activeMembers;

  const sorted = useMemo(() => {
    const memberData = visibleMembers.map((m) => ({
      member: m,
      budget: calculateMemberTierTotal("budget", items, m.id, activeMembers),
      balanced: calculateMemberTierTotal("balanced", items, m.id, activeMembers),
      premium: calculateMemberTierTotal("premium", items, m.id, activeMembers),
    }));
    return memberData.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === "name") return a.member.name.localeCompare(b.member.name) * dir;
      return (a[sortField] - b[sortField]) * dir;
    });
  }, [visibleMembers, items, activeMembers, sortField, sortAsc]);

  if (activeMembers.length === 0) return null;

  const SortTh = ({ field, label, className = "" }: { field: SortField; label: string; className?: string }) => {
    const active = sortField === field;
    return (
      <th className={`px-6 py-3 font-medium cursor-pointer hover:text-gray-200 select-none whitespace-nowrap ${className}`} onClick={() => handleSort(field)}>
        <span className="inline-flex items-center gap-1 justify-end">
          {label}
          {active ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />}
        </span>
      </th>
    );
  };

  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">Member Budgets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1a1a] text-left">
                  <SortTh field="name" label="Member" className="text-gray-400" />
                  {tiers.map((tier) => (
                    <SortTh key={tier} field={tier} label={TIER_CONFIG[tier].label} className={`text-right ${TIER_CONFIG[tier].color}`} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sorted.map(({ member, ...totals }) => (
                  <tr key={member.id} className="hover:bg-[#1a1a1a]">
                    <td className="px-6 py-3 font-medium text-gray-200">{member.name}</td>
                    {tiers.map((tier) => (
                      <td key={tier} className="px-6 py-3 text-right font-mono">
                        <div className="text-gray-200">{formatUSD(totals[tier])}</div>
                        <div className="text-xs text-gray-500">{formatTTD(convertToTTD(totals[tier], usdToTtd))}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    </div>
  );
}
