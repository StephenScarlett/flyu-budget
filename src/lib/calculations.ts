import type { BudgetItem } from "./supabase/types";
import type { Member } from "./supabase/types";
import type { TierKey } from "./constants";

/**
 * Check if a budget item applies to a specific member.
 * If member_ids is null/empty, it applies to all members.
 */
export function itemAppliesToMember(item: BudgetItem, memberId: string): boolean {
  if (!item.member_ids || item.member_ids.length === 0) return true;
  return item.member_ids.includes(memberId);
}

/**
 * Calculate per-person total for a given tier (across all members).
 */
export function calculateTierTotal(
  tier: TierKey,
  items: BudgetItem[],
  groupSize: number
): number {
  const included = items.filter(
    (item) => item.is_included && (item.tier === "all" || item.tier === tier || item.tier.includes(tier))
  );

  let perPerson = 0;
  for (const item of included) {
    if (item.cost_type === "per_person") {
      perPerson += item.cost_usd;
    } else if (item.cost_type === "total_group") {
      perPerson += item.cost_usd / groupSize;
    } else if (item.cost_type === "per_room") {
      perPerson += item.cost_usd / 2;
    } else if (item.cost_type === "split_between") {
      const splitCount = item.member_ids?.length || groupSize;
      perPerson += item.cost_usd / splitCount;
    }
  }

  return Math.round(perPerson * 100) / 100;
}

/**
 * Calculate a specific member's total for a given tier.
 */
export function calculateMemberTierTotal(
  tier: TierKey,
  items: BudgetItem[],
  memberId: string,
  activeMembers: Member[]
): number {
  const included = items.filter(
    (item) =>
      item.is_included &&
      itemAppliesToMember(item, memberId) &&
      (item.tier === "all" || item.tier === tier || item.tier.includes(tier))
  );

  let total = 0;
  for (const item of included) {
    if (item.cost_type === "per_person") {
      total += item.cost_usd;
    } else if (item.cost_type === "total_group") {
      // Divide by number of members this item applies to
      const applicableCount = item.member_ids?.length || activeMembers.length;
      total += item.cost_usd / applicableCount;
    } else if (item.cost_type === "per_room") {
      total += item.cost_usd / 2;
    } else if (item.cost_type === "split_between") {
      const splitCount = item.member_ids?.length || activeMembers.length;
      total += item.cost_usd / splitCount;
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Convert USD to TTD.
 */
export function convertToTTD(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}

/**
 * Calculate monthly savings needed per tier.
 */
export function calculateMonthlySavings(
  totalPerPerson: number,
  tripDate: string | null
): number {
  if (!tripDate) return 0;
  const now = new Date();
  const trip = new Date(tripDate);
  const diffMs = trip.getTime() - now.getTime();
  const months = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
  return Math.round((totalPerPerson / months) * 100) / 100;
}

/**
 * Format a number as USD currency.
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as TTD currency.
 */
export function formatTTD(amount: number): string {
  return `TT$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
}
