"use client";

import { useState, useMemo } from "react";
import { TIER_CONFIG, CATEGORIES, type TierKey } from "../../lib/constants";
import { convertToTTD, formatUSD, formatTTD, calculateTierTotal } from "../../lib/calculations";
import type { BudgetItem, Member } from "../../lib/supabase/types";
import { TIER_ICONS, CATEGORY_ICONS, ChevronUp, ChevronDown, ChevronsUpDown } from "../../lib/icons";

interface CompareTableProps {
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
  members: Member[];
}

type CompareSortField = "category" | "budget" | "balanced" | "premium";

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function CompareTable({ items, groupSize, usdToTtd, members }: CompareTableProps) {
  const [sortField, setSortField] = useState<CompareSortField>("category");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: CompareSortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === "category"); }
  };

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
      else if (item.cost_type === "split_between") total += item.cost_usd / (item.member_ids?.length || groupSize);
    }
    return total;
  }

  const rows = useMemo(() => {
    const data = CATEGORIES
      .filter((cat) => items.some((i) => i.category === cat.key))
      .map((cat) => ({
        key: cat.key,
        label: cat.label,
        budget: getCategoryTotal(cat.key, "budget"),
        balanced: getCategoryTotal(cat.key, "balanced"),
        premium: getCategoryTotal(cat.key, "premium"),
      }));
    return data.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === "category") return a.label.localeCompare(b.label) * dir;
      return (a[sortField] - b[sortField]) * dir;
    });
  }, [items, sortField, sortAsc, groupSize]);

  const SortTh = ({ field, label, className = "", children }: { field: CompareSortField; label: string; className?: string; children?: React.ReactNode }) => {
    const active = sortField === field;
    return (
      <th className={`px-6 py-3 font-medium cursor-pointer hover:text-gray-200 select-none whitespace-nowrap ${className}`} onClick={() => handleSort(field)}>
        <span className="inline-flex items-center gap-1 justify-end">
          {children ?? label}
          {active ? (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />}
        </span>
      </th>
    );
  };

  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1a]">
              <SortTh field="category" label="Category" className="text-left text-gray-400" />
              {tiers.map((tier) => {
                const Icon = TIER_ICONS[tier];
                return (
                  <SortTh key={tier} field={tier} label={TIER_CONFIG[tier].label} className={`text-right ${TIER_CONFIG[tier].color}`}>
                    <Icon className={`w-4 h-4 ${TIER_CONFIG[tier].iconColor}`} />
                    {TIER_CONFIG[tier].label}
                  </SortTh>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map((row) => {
              const CatIcon = CATEGORY_ICONS[row.key];
              return (
                <tr key={row.key} className="hover:bg-[#1a1a1a]">
                  <td className="px-6 py-3 font-medium text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      {CatIcon && <CatIcon className="w-4 h-4 text-sky-400" />}
                      {row.label}
                    </span>
                  </td>
                  {tiers.map((tier) => (
                    <td key={tier} className="px-6 py-3 text-right font-mono text-gray-200">
                      {formatUSD(row[tier])}
                    </td>
                  ))}
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
