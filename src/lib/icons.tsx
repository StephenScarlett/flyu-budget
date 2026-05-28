import {
  Plane,
  Home,
  Ticket,
  Zap,
  Car,
  UtensilsCrossed,
  ShoppingBag,
  BarChart3,
  Wallet,
  Scale,
  Calendar,
  PiggyBank,
  Lightbulb,
  Trash2,
  Link2,
  ClipboardList,
  Plus,
  X,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleDollarSign,
  Users,
  User,
  BedDouble,
  ExternalLink,
  PartyPopper,
  Shield,
  Star,
  Heart,
  Diamond,
  CalendarCheck,
  UserPlus,
  Mail,
  Phone,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

/* ─── Category Icons ─── */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  flights: Plane,
  accommodation: Home,
  tickets: Ticket,
  express: Zap,
  transport: Car,
  food: UtensilsCrossed,
  extras: ShoppingBag,
};

/* ─── Tab Icons ─── */
export const TAB_ICONS: Record<string, LucideIcon> = {
  overview: BarChart3,
  costs: Wallet,
  compare: Scale,
  itinerary: Calendar,
  savings: PiggyBank,
  members: Users,
  tips: Link2,
};

/* ─── Tier Icons ─── */
export const TIER_ICONS: Record<string, LucideIcon> = {
  budget: Shield,
  balanced: Diamond,
  premium: Star,
};

/* ─── Cost Type Icons ─── */
export const COST_TYPE_ICONS: Record<string, LucideIcon> = {
  per_person: User,
  total_group: Users,
  per_room: BedDouble,
};

/* ─── Misc Icons (re-export for convenience) ─── */
export {
  Trash2,
  Link2,
  ClipboardList,
  Plus,
  X,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleDollarSign,
  ExternalLink,
  PartyPopper,
  Calendar,
  Lightbulb,
  User,
  Users,
  BedDouble,
  UserPlus,
  Mail,
  Phone,
  StickyNote,
};

export type { LucideIcon };
