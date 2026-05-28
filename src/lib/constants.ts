export type TierKey = "budget" | "balanced" | "premium";

export const TIER_CONFIG: Record<
  TierKey,
  { label: string; color: string; bg: string; border: string; iconColor: string }
> = {
  budget: {
    label: "Budget",
    color: "text-emerald-400",
    bg: "bg-emerald-950/40",
    border: "border-emerald-800",
    iconColor: "text-emerald-400",
  },
  balanced: {
    label: "Balanced",
    color: "text-sky-300",
    bg: "bg-sky-950/40",
    border: "border-sky-800",
    iconColor: "text-sky-300",
  },
  premium: {
    label: "Premium",
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800",
    iconColor: "text-amber-400",
  },
};

export const CATEGORIES = [
  { key: "flights", label: "Flights" },
  { key: "accommodation", label: "Accommodation" },
  { key: "tickets", label: "Tickets" },
  { key: "express", label: "Express Passes" },
  { key: "transport", label: "Transport" },
  { key: "food", label: "Food & Dining" },
  { key: "extras", label: "Extras" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<CategoryKey, (typeof CATEGORIES)[number]>;

export const TABS = [
  { key: "overview", label: "Overview" },
  { key: "costs", label: "All Costs" },
  { key: "compare", label: "Compare Tiers" },
  { key: "itinerary", label: "Itinerary" },
  { key: "savings", label: "Savings Plan" },
  { key: "members", label: "Members" },
  { key: "tips", label: "Links" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export const MILESTONES = [
  {
    months: 18,
    label: "Start saving",
    description: "Open a dedicated savings account or envelope",
  },
  {
    months: 12,
    label: "Book flights",
    description: "Lock in off-peak fares (Jan/Feb are cheapest)",
  },
  {
    months: 9,
    label: "Book accommodation",
    description: "Reserve Airbnb / hotel — free cancellation options preferred",
  },
  {
    months: 6,
    label: "Buy park tickets",
    description: "Universal 3-Day P2P + 2 Free & SeaWorld tickets",
  },
  {
    months: 3,
    label: "Book rental car",
    description: "Minivan reservation — prices rise closer to travel",
  },
  {
    months: 1,
    label: "Buy Express Passes",
    description: "If going Premium/Balanced tier — date-specific pricing",
  },
  {
    months: 0,
    label: "Trip time!",
    description: "February 2027 — Orlando here we come!",
  },
];
