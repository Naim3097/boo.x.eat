"use client";

import { ChevronDown, MapPin, Building2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Outlet } from "@/types/database";

interface OutletSwitcherProps {
  outlets: Outlet[];
  activeOutlet: Outlet | null;
  onSwitch: (outletId: string | null) => void;
  showAllOption?: boolean;
}

export function OutletSwitcher({ outlets, activeOutlet, onSwitch, showAllOption = false }: OutletSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (outlets.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Outlet</p>
          <p className="text-sm font-medium text-gray-900 truncate">
            {activeOutlet ? activeOutlet.name : "All Outlets"}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {showAllOption && (
            <button
              onClick={() => { onSwitch(null); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                !activeOutlet ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
              All Outlets
            </button>
          )}
          {outlets.map((o) => (
            <button
              key={o.id}
              onClick={() => { onSwitch(o.id); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                activeOutlet?.id === o.id ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <div className="min-w-0">
                <p className="truncate">{o.name}</p>
                {o.address && <p className="text-xs text-gray-400 truncate">{o.address}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
