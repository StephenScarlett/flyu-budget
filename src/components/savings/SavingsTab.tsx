"use client";

import { MILESTONES } from "../../lib/constants";
import {
  calculateMemberTierTotal,
  calculateMonthlySavings,
  convertToTTD,
  formatUSD,
  formatTTD,
} from "../../lib/calculations";
import type { BudgetItem, Member } from "../../lib/supabase/types";
import { ClipboardList, PartyPopper } from "../../lib/icons";

const staggerDelay = (i: number, base = 80) => i * base;

import MemberFilter from "../ui/MemberFilter";

interface SavingsTabProps {
  items: BudgetItem[];
  groupSize: number;
  usdToTtd: number;
  tripStart: string | null;
  members: Member[];
  selectedMembers: string[];
  onMemberChange: (ids: string[]) => void;
}

export default function SavingsTab({ items, groupSize, usdToTtd, tripStart, members, selectedMembers, onMemberChange }: SavingsTabProps) {
  const activeMembers = members.filter((m) => m.is_active);
  const filteredMembers = selectedMembers.length > 0 ? activeMembers.filter((m) => selectedMembers.includes(m.id)) : activeMembers;
  return (
    <div className="space-y-6">
      <MemberFilter members={members} selected={selectedMembers} onChange={onMemberChange} />
      {/* Per-Member Savings */}
      {filteredMembers.length > 0 && (
        <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white inline-flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-sky-400" />
              Member Savings
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Personalized monthly savings per member (Balanced tier)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1a1a] text-left">
                  <th className="px-6 py-3 font-medium text-gray-400">Member</th>
                  <th className="px-6 py-3 font-medium text-gray-400 text-right">Total (USD)</th>
                  <th className="px-6 py-3 font-medium text-gray-400 text-right">Total (TTD)</th>
                  <th className="px-6 py-3 font-medium text-gray-400 text-right">Monthly (USD)</th>
                  <th className="px-6 py-3 font-medium text-gray-400 text-right">Monthly (TTD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredMembers.map((member) => {
                  const total = calculateMemberTierTotal("balanced", items, member.id, activeMembers);
                  const monthly = calculateMonthlySavings(total, tripStart);
                  return (
                    <tr key={member.id} className="hover:bg-[#1a1a1a]">
                      <td className="px-6 py-3 font-medium text-gray-200">{member.name}</td>
                      <td className="px-6 py-3 text-right font-mono text-gray-200">{formatUSD(total)}</td>
                      <td className="px-6 py-3 text-right font-mono text-gray-500">{formatTTD(convertToTTD(total, usdToTtd))}</td>
                      <td className="px-6 py-3 text-right font-mono font-semibold text-sky-300">{formatUSD(monthly)}</td>
                      <td className="px-6 py-3 text-right font-mono text-gray-500">{formatTTD(convertToTTD(monthly, usdToTtd))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
