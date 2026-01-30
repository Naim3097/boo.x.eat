"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Store, Outlet, StaffUser } from "@/types/database";

interface StoreContext {
  store: Store | null;
  outlet: Outlet | null;
  staffUser: StaffUser | null;
  loading: boolean;
}

export function useStore(): StoreContext {
  const [store, setStore] = useState<Store | null>(null);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get the user's staff record (which links to store)
      const { data: staff } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single()
        .then((res) => ({ data: res.data as StaffUser | null }));

      if (!staff) {
        setLoading(false);
        return;
      }

      setStaffUser(staff);

      // Get the store
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("id", staff.store_id)
        .single()
        .then((res) => ({ data: res.data as Store | null }));

      if (storeData) setStore(storeData);

      // Get the first outlet (or the staff's assigned outlet)
      const outletQuery = staff.outlet_id
        ? supabase.from("outlets").select("*").eq("id", staff.outlet_id).single()
        : supabase.from("outlets").select("*").eq("store_id", staff.store_id).limit(1).single();

      const { data: outletData } = await outletQuery.then((res) => ({ data: res.data as Outlet | null }));
      if (outletData) setOutlet(outletData);

      setLoading(false);
    }

    load();
  }, []);

  return { store, outlet, staffUser, loading };
}
