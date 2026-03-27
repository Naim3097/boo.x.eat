"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Delete, Loader2, LogIn } from "lucide-react";

interface StaffSession {
  staff: { id: string; name: string; role: string; store_id: string };
  outlet: { id: string; name: string } | null;
  store: { id: string; name: string; business_model: string } | null;
}

export default function POSLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  function handleDelete() {
    setPin((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setPin("");
  }

  async function handleSubmit() {
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPin("");
        toast.error(data.error || "Invalid PIN");
        setLoading(false);
        return;
      }

      // Store session in sessionStorage
      const session: StaffSession = data;
      sessionStorage.setItem("pos_session", JSON.stringify(session));

      toast.success(`Welcome, ${session.staff.name}!`);

      // Route based on role and business model
      const role = session.staff.role;
      const businessModel = session.store?.business_model;
      if (role === "kitchen") {
        router.push("/pos/kitchen");
      } else if (businessModel === "manual_entry") {
        router.push("/pos/cashier");
      } else {
        router.push("/pos/orders");
      }
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  // Auto-submit when 6 digits entered
  function handleDigitWithAutoSubmit(digit: string) {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 6) {
      // Defer to next tick so state updates
      setTimeout(() => {
        setLoading(true);
        fetch("/api/staff-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: newPin }),
        })
          .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
          .then(({ ok, data }) => {
            if (!ok) {
              setShake(true);
              setTimeout(() => setShake(false), 600);
              setPin("");
              toast.error(data.error || "Invalid PIN");
              setLoading(false);
              return;
            }
            sessionStorage.setItem("pos_session", JSON.stringify(data));
            toast.success(`Welcome, ${data.staff.name}!`);
            const role = data.staff.role;
            const bm = data.store?.business_model;
            if (role === "kitchen") {
              router.push("/pos/kitchen");
            } else if (bm === "manual_entry") {
              router.push("/pos/cashier");
            } else {
              router.push("/pos/orders");
            }
          })
          .catch(() => {
            toast.error("Something went wrong");
            setLoading(false);
          });
      }, 100);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">bx</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            boo<span className="text-primary-600">.x</span>.eat
          </h1>
          <p className="text-sm text-gray-500 mt-1">Enter your PIN to start</p>
        </div>

        {/* PIN Display */}
        <div className={`flex justify-center gap-3 mb-8 ${shake ? "animate-shake" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                i < pin.length
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {i < pin.length && (
                <div className="w-3 h-3 rounded-full bg-primary-600" />
              )}
            </div>
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitWithAutoSubmit(digit)}
              disabled={loading}
              className="h-16 rounded-xl bg-white border-2 border-gray-200 text-2xl font-semibold text-gray-800 hover:bg-gray-50 hover:border-primary-300 active:bg-primary-50 active:border-primary-500 transition-all disabled:opacity-50 shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading}
            className="h-16 rounded-xl bg-gray-100 border-2 border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigitWithAutoSubmit("0")}
            disabled={loading}
            className="h-16 rounded-xl bg-white border-2 border-gray-200 text-2xl font-semibold text-gray-800 hover:bg-gray-50 hover:border-primary-300 active:bg-primary-50 active:border-primary-500 transition-all disabled:opacity-50 shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-16 rounded-xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Manual submit for PINs shorter than 6 */}
        {pin.length >= 4 && pin.length < 6 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400 text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        )}

        {loading && pin.length === 6 && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        )}

        {/* Link to owner login */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Store owner?{" "}
          <a href="/login" className="text-primary-600 hover:underline">
            Sign in with email
          </a>
        </p>
      </div>

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
