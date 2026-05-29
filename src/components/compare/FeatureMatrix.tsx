"use client";

import { Fragment, useState, useMemo } from "react";
import { TIER_CONFIG, CATEGORIES, type TierKey } from "../../lib/constants";
import type { BudgetItem } from "../../lib/supabase/types";
import { Check, X, CATEGORY_ICONS, ChevronUp, ChevronDown, ChevronsUpDown } from "../../lib/icons";

interface FeatureMatrixProps {
  items: BudgetItem[];
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

function itemIncludedInTier(item: BudgetItem, tier: TierKey): boolean {
  return item.tier === "all" || item.tier === tier || item.tier.includes(tier);
}

type FeatureSortField = "name" | "budget" | "balanced" | "premium";

export default function FeatureMatrix({ items }: FeatureMatrixProps) {
  const [sortField, setSortField] = useState<FeatureSortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: FeatureSortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === "name"); }
  };

  // Group items by category, sort items within each group
  const grouped = useMemo(() => {
    return CATEGORIES
      .map((cat) => ({
        key: cat.key,
        label: cat.label,
        items: [...items.filter((i) => i.category === cat.key && i.is_included)].sort((a, b) => {
          const dir = sortAsc ? 1 : -1;
          if (sortField === "name") return a.name.localeCompare(b.name) * dir;
          const aVal = itemIncludedInTier(a, sortField) ? 1 : 0;
          const bVal = itemIncludedInTier(b, sortField) ? 1 : 0;
          return (aVal - bVal) * dir;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [items, sortField, sortAsc]);

  const SortTh = ({ field, label, className = "" }: { field: FeatureSortField; label: string; className?: string }) => {
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
        <h3 className="font-semibold text-white">What&apos;s Included</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a1a1a]">
              <SortTh field="name" label="Feature" className="text-left text-gray-400" />
              {tiers.map((tier) => (
                <SortTh key={tier} field={tier} label={TIER_CONFIG[tier].label} className={`text-center ${TIER_CONFIG[tier].color}`} />
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
