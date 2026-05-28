"use client";

import { TIER_CONFIG, MILESTONES, type TierKey } from "../../lib/constants";
import {
  calculateTierTotal,
  calculateMonthlySavings,
  convertToTTD,
  formatUSD,
  formatTTD,
} from "../../lib/calculations";
import type { BudgetItem } from "../../lib/supabase/types";
import { TIER_ICONS, ClipboardList, PartyPopper } from "../../lib/icons";

const staggerDelay = (i: number, base = 80) => i * base;

interface SavingsTabProps {
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
  tripStart: string | null;
}

const tiers: TierKey[] = ["budget", "balanced", "premium"];

export default function SavingsTab({ items, groupSize, usdToTtd, tripStart }: SavingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiers.map((tier, i) => {
          const config = TIER_CONFIG[tier];
          const total = calculateTierTotal(tier, items, groupSize);
          const monthly = calculateMonthlySavings(total, tripStart);
          const monthlyTTD = convertToTTD(monthly, usdToTtd);

          return (
            <div
              key={tier}
              className={`rounded-xl border ${config.border} ${config.bg} p-6 text-center animate-fade-up`}
              style={{ animationDelay: `${staggerDelay(i)}ms` }}
            >
              {(() => { const Icon = TIER_ICONS[tier]; return <Icon className={`w-7 h-7 mx-auto ${config.iconColor}`} />; })()}
              <h3 className={`text-lg font-bold ${config.color} mt-2`}>
                {config.label}
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">Save monthly</p>
              <p className={`text-2xl font-extrabold ${config.color}`}>
                {formatUSD(monthly)}
              </p>
              <p className="text-sm text-gray-400">{formatTTD(monthlyTTD)}/mo</p>
              <hr className={`my-3 ${config.border}`} />
              <p className="text-xs text-gray-500">
                Total: {formatUSD(total)} / {formatTTD(convertToTTD(total, usdToTtd))}
              </p>
            </div>
          );
        })}
      </div>

      {/* Milestones */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white inline-flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-400" />
            Payment Milestones
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Recommended booking timeline for best prices
          </p>
        </div>
        <div className="divide-y divide-gray-800">
          {MILESTONES.map((milestone, i) => {
            const tripDate = tripStart ? new Date(tripStart) : new Date("2027-02-01");
            const targetDate = new Date(tripDate);
            targetDate.setMonth(targetDate.getMonth() - milestone.months);
            const now = new Date();
            const isPast = targetDate < now;
            const isCurrent =
              !isPast &&
              i < MILESTONES.length - 1 &&
              new Date(
                new Date(tripDate).setMonth(
                  tripDate.getMonth() - (MILESTONES[i + 1]?.months ?? 0)
                )
              ) >= now;

            return (
              <div
                key={milestone.label}
                className={`flex items-start gap-4 px-6 py-4 animate-fade-up ${
                  isCurrent ? "bg-sky-950/30" : isPast ? "opacity-40" : ""
                }`}
                style={{ animationDelay: `${staggerDelay(i, 50) + 200}ms` }}
              >
                <div
                  className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                    isPast
                      ? "bg-gray-700"
                      : isCurrent
                      ? "bg-sky-400 ring-4 ring-sky-900/50"
                      : "bg-gray-600"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-200">{milestone.label}</p>
                    <p className="text-xs text-gray-500">
                      {targetDate.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{milestone.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
