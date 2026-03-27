export interface TierLimits {
  tier: string;
  maxOutlets: number;
  maxStaff: number;
  hasInventory: boolean;
  hasManualEntry: boolean;
  hasAdvancedReports: boolean;
  hasMultiOutlet: boolean;
  price: number;
}

const TIER_MAP: Record<string, TierLimits> = {
  starter: {
    tier: "starter",
    maxOutlets: 1,
    maxStaff: 5,
    hasInventory: false,
    hasManualEntry: false,
    hasAdvancedReports: false,
    hasMultiOutlet: false,
    price: 0,
  },
  growth: {
    tier: "growth",
    maxOutlets: 3,
    maxStaff: 15,
    hasInventory: true,
    hasManualEntry: true,
    hasAdvancedReports: true,
    hasMultiOutlet: true,
    price: 49.9,
  },
  pro: {
    tier: "pro",
    maxOutlets: 10,
    maxStaff: 50,
    hasInventory: true,
    hasManualEntry: true,
    hasAdvancedReports: true,
    hasMultiOutlet: true,
    price: 149.9,
  },
};

export function getTierLimits(tier: string | null | undefined): TierLimits {
  return TIER_MAP[tier || "starter"] || TIER_MAP.starter;
}

export function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    starter: "Starter",
    growth: "Growth",
    pro: "Pro",
  };
  return names[tier] || "Starter";
}
