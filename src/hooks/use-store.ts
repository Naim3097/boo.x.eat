"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTierLimits, type TierLimits } from "@/lib/subscription";
import type { Store, Outlet, StaffUser } from "@/types/database";

const ACTIVE_OUTLET_KEY = "booxeat-active-outlet";
const OUTLET_CHANGE_EVENT = "booxeat-outlet-change";

interface StoreContext {
  store: Store | null;
  outlet: Outlet | null;
  outlets: Outlet[];
  staffUser: StaffUser | null;
  loading: boolean;
  tierLimits: TierLimits;
  setActiveOutlet: (outletId: string | null) => void;
}

export function useStore(): StoreContext {
  const [store, setStore] = useState<Store | null>(null);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierLimits, setTierLimits] = useState<TierLimits>(getTierLimits("starter"));

  const loadOutlets = useCallback(async (storeId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("outlets")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("name", { ascending: true });
    return (data as Outlet[] | null) || [];
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      // Try getSession first (no lock), fall back to getUser
      let userId: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      }
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: staff } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", userId)
        .single()
        .then((res) => ({ data: res.data as StaffUser | null }));

      if (!staff) {
        setLoading(false);
        return;
      }

      setStaffUser(staff);

      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("id", staff.store_id)
        .single()
        .then((res) => ({ data: res.data as Store | null }));

      if (storeData) {
        setStore(storeData);
        setTierLimits(getTierLimits(storeData.subscription_tier));
      }

      // Load all outlets
      const allOutlets = await loadOutlets(staff.store_id);
      setOutlets(allOutlets);

      // Determine active outlet
      const savedOutletId = typeof window !== "undefined"
        ? localStorage.getItem(ACTIVE_OUTLET_KEY)
        : null;

      let activeOutlet: Outlet | null = null;

      if (savedOutletId === "all") {
        activeOutlet = null;
      } else if (savedOutletId) {
        activeOutlet = allOutlets.find((o) => o.id === savedOutletId) || null;
      }

      if (!activeOutlet && savedOutletId !== "all") {
        if (staff.outlet_id) {
          activeOutlet = allOutlets.find((o) => o.id === staff.outlet_id) || null;
        }
        if (!activeOutlet && allOutlets.length > 0) {
          activeOutlet = allOutlets[0];
        }
      }

      setOutlet(activeOutlet);
      setLoading(false);
    }

    load();
  }, [loadOutlets]);

  // Listen for outlet changes from other useStore instances
  useEffect(() => {
    function handleOutletChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail.outletId === null) {
        setOutlet(null);
      } else {
        const found = outlets.find((o) => o.id === detail.outletId) || null;
        setOutlet(found);
      }
    }

    window.addEventListener(OUTLET_CHANGE_EVENT, handleOutletChange);
    return () => window.removeEventListener(OUTLET_CHANGE_EVENT, handleOutletChange);
  }, [outlets]);

  const setActiveOutlet = useCallback((outletId: string | null) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_OUTLET_KEY, outletId || "all");
      // Notify all useStore instances
      window.dispatchEvent(
        new CustomEvent(OUTLET_CHANGE_EVENT, { detail: { outletId } })
      );
    }
    if (outletId === null) {
      setOutlet(null);
    } else {
      const found = outlets.find((o) => o.id === outletId) || null;
      setOutlet(found);
    }
  }, [outlets]);

  return { store, outlet, outlets, staffUser, loading, tierLimits, setActiveOutlet };
}
