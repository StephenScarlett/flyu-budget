"use client";

import { useMemo, useState } from "react";
import { TIER_CONFIG, CATEGORIES, type TierKey, type CategoryKey } from "../../lib/constants";
import {
  calculateMemberTierTotal,
  calculateMonthlySavings,
  convertToTTD,
  formatUSD,
  formatTTD,
  itemAppliesToMember,
} from "../../lib/calculations";
import { TIER_ICONS, CATEGORY_ICONS } from "../../lib/icons";
import type { BudgetItem, Member } from "../../lib/supabase/types";

interface MemberProfileProps {
  member: Member;
  members: Member[];
  items: BudgetItem[];
  usdToTtd: number;
  tripStart: string | null;
  onBack: () => void;
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function MemberProfile({
  member,
  members,
  items,
  usdToTtd,
  tripStart,
  onBack,
}: MemberProfileProps) {
  const activeMembers = useMemo(() => members.filter((m) => m.is_active), [members]);

  const tierTotals = useMemo(() => {
    return tiers.map((tier) => {
      const total = calculateMemberTierTotal(tier, items, member.id, activeMembers);
      const ttd = convertToTTD(total, usdToTtd);
      const monthly = calculateMonthlySavings(total, tripStart);
      const monthlyTtd = convertToTTD(monthly, usdToTtd);
      return { tier, total, ttd, monthly, monthlyTtd };
    });
  }, [items, member.id, activeMembers, usdToTtd, tripStart]);

  const itemsByCategory = useMemo(() => {
    const memberItems = items.filter((item) => item.is_included && itemAppliesToMember(item, member.id));
    const grouped: Record<string, BudgetItem[]> = {};
    for (const item of memberItems) {
      if (item.category === "package" && item.package_categories && item.package_categories.length > 0) {
        // Distribute package items into their constituent categories
        for (const cat of item.package_categories) {
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        }
      } else {
        const cat = item.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      }
    }
    return grouped;
  }, [items, member.id]);

  const totalItemCount = useMemo(
    () => items.filter((item) => itemAppliesToMember(item, member.id)).length,
    [items, member.id]
  );

  const balanced = tierTotals.find((t) => t.tier === "balanced")!;
  const [selectedTier, setSelectedTier] = useState<TierKey>("balanced");
  const activeTier = tierTotals.find((t) => t.tier === selectedTier)!;
  const activeTierConfig = TIER_CONFIG[selectedTier];

  // Calculate what this member actually pays for an item
  function memberCostForItem(item: BudgetItem): number {
    if (item.cost_type === "per_person") return item.cost_usd;
    if (item.cost_type === "total_group") {
      const applicable = item.member_ids?.length || activeMembers.length;
      return Math.round((item.cost_usd / applicable) * 100) / 100;
    }
    if (item.cost_type === "per_room") return Math.round((item.cost_usd / 2) * 100) / 100;
    if (item.cost_type === "split_between") {
      const splitCount = item.member_ids?.length || activeMembers.length;
      return Math.round((item.cost_usd / splitCount) * 100) / 100;
    }
    return item.cost_usd;
  }

  const COST_TYPE_LABELS: Record<string, string> = {
    per_person: "Per person",
    total_group: "Split across group",
    per_room: "Per room (÷2)",
    split_between: "Split between selected",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sticky back bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-sky-300 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile hero card */}
        <div className="relative rounded-2xl border border-gray-800 bg-gradient-to-br from-[#141414] to-[#0f1a2e] p-6 sm:p-8 mb-8 overflow-hidden animate-fade-in">
          {/* Decorative gradient blob */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/6 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-sky-500/30" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-sky-600/20">
                {member.name.charAt(0)}
              </div>
            )}

            {/* Name + info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{member.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs font-medium border border-sky-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
                  </svg>
                  {member.is_single ? "Single room" : "Shared room"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-medium border border-violet-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                  </svg>
                  {totalItemCount} budget items
                </span>
              </div>
              {member.notes && (
                <p className="text-sm text-gray-400 mt-2 italic">{member.notes}</p>
              )}
              {/* Contact inline */}
              {(member.email || member.phone) && (
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  {member.email && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                      {member.email}
                    </span>
                  )}
                  {member.phone && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                      {member.phone}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Big total for selected tier */}
            <div className="text-right sm:text-right mt-2 sm:mt-0">
              <p className={`text-xs uppercase tracking-wider mb-1 ${activeTierConfig.color}`}>{activeTierConfig.label} Tier</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-sky-100">
                {formatUSD(activeTier.total)}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{formatTTD(activeTier.ttd)}</p>
            </div>
          </div>
        </div>

        {/* Tier selector cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          {tierTotals.map(({ tier, total, ttd, monthly, monthlyTtd }, i) => {
            const config = TIER_CONFIG[tier];
            const Icon = TIER_ICONS[tier];
            const isSelected = selectedTier === tier;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`rounded-2xl border text-left bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-4 sm:p-5 animate-fade-up transition-all cursor-pointer ${
                  isSelected
                    ? `${config.border} ring-1 ${tier === "budget" ? "ring-emerald-500/40" : tier === "balanced" ? "ring-sky-500/40" : "ring-amber-500/40"}`
                    : "border-gray-800 opacity-60 hover:opacity-80"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.iconColor}`} />
                  </div>
                  <h3 className={`text-xs sm:text-sm font-bold ${config.color}`}>{config.label}</h3>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-0.5">{formatUSD(total)}</p>
                <p className="text-xs sm:text-sm text-gray-500">{formatTTD(ttd)}</p>
                {monthly > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-800/60">
                    <div className="flex items-baseline justify-between">
                      <p className="text-[10px] sm:text-xs text-gray-500">Monthly</p>
                      <p className={`text-sm font-bold ${config.color}`}>{formatUSD(monthly)}</p>
                    </div>
                    <p className="text-[10px] text-gray-600 text-right">{formatTTD(monthlyTtd)}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Category breakdown — filtered to selected tier */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-bold text-white mb-4">
            What You&apos;re Paying For
            <span className={`text-sm font-normal ml-2 ${activeTierConfig.color}`}>({activeTierConfig.label})</span>
          </h2>
          <div className="space-y-5">
            {CATEGORIES.filter((cat) => cat.key !== "package").map((cat) => {
              const allCatItems = itemsByCategory[cat.key];
              if (!allCatItems || allCatItems.length === 0) return null;
              // Filter to items that apply to the selected tier
              const catItems = allCatItems.filter(
                (item) => item.tier === "all" || item.tier === selectedTier || item.tier.includes(selectedTier)
              );
              if (catItems.length === 0) return null;
              const CatIcon = CATEGORY_ICONS[cat.key as CategoryKey];
              const catYouPay = catItems.reduce((sum, item) => sum + memberCostForItem(item), 0);
              const catYouPayTtd = convertToTTD(catYouPay, usdToTtd);
              return (
                <div key={cat.key} className="rounded-xl border border-gray-800 bg-[#141414] overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        {CatIcon && <CatIcon className="w-4 h-4 text-sky-400" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{cat.label}</h3>
                        <p className="text-xs text-gray-500">{catItems.length} item{catItems.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-sky-300">{formatUSD(catYouPay)}</p>
                      <p className="text-[10px] text-gray-500">{formatTTD(catYouPayTtd)}</p>
                    </div>
                  </div>
                  {/* Items */}
                  <div className="divide-y divide-gray-800/60">
                    {catItems.map((item) => {
                      const youPay = memberCostForItem(item);
                      const youPayTtd = convertToTTD(youPay, usdToTtd);
                      const isShared = item.cost_type !== "per_person";
                      return (
                        <div key={`${cat.key}-${item.id}`} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-200">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-white">{formatUSD(youPay)}</p>
                              <p className="text-[10px] text-gray-500">{formatTTD(youPayTtd)}</p>
                              {isShared && (
                                <p className="text-[10px] text-gray-600">{formatUSD(item.cost_usd)} total</p>
                              )}
                            </div>
                          </div>
                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[10px] text-gray-600">{COST_TYPE_LABELS[item.cost_type]}</span>
                            {item.is_optional && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400">Optional</span>
                            )}
                            {item.source_url && (
                              <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-500 hover:text-sky-400 underline underline-offset-2">
                                {item.source_label || "Source"}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
