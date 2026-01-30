"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface POSSession {
  staff: { id: string; name: string; role: string; store_id: string };
  outlet: { id: string; name: string } | null;
  store: { id: string; name: string; business_model: string } | null;
}

export function usePOSSession() {
  const router = useRouter();
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_session");
    if (!stored) {
      router.replace("/pos");
      return;
    }

    try {
      const parsed: POSSession = JSON.parse(stored);
      if (!parsed.staff?.id) {
        router.replace("/pos");
        return;
      }
      setSession(parsed);
    } catch {
      router.replace("/pos");
      return;
    }

    setLoading(false);
  }, [router]);

  function logout() {
    sessionStorage.removeItem("pos_session");
    router.replace("/pos");
  }

  return { session, loading, logout };
}
