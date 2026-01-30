"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { QrCode, ClipboardList, ArrowRight, ArrowLeft, Store, MapPin, Utensils } from "lucide-react";

type BusinessModel = "qr_ordering" | "manual_entry";

const STEPS = ["Store Info", "Business Model", "First Outlet"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Store Info
  const [storeName, setStoreName] = useState("");

  // Step 2: Business Model
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);

  // Step 3: Outlet Info
  const [outletName, setOutletName] = useState("");
  const [outletAddress, setOutletAddress] = useState("");
  const [tableCount, setTableCount] = useState(10);

  async function handleComplete() {
    if (!businessModel) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      // Create the store
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .insert({
          name: storeName,
          owner_id: user.id,
          business_model: businessModel,
        })
        .select("id")
        .single();

      if (storeError || !store) throw storeError || new Error("Failed to create store");

      // Create the first outlet
      const { data: outlet, error: outletError } = await supabase
        .from("outlets")
        .insert({
          store_id: store.id,
          name: outletName || storeName,
          address: outletAddress || null,
        })
        .select("id")
        .single();

      if (outletError || !outlet) throw outletError || new Error("Failed to create outlet");

      // Create the owner's staff record
      const { error: userError } = await supabase
        .from("users")
        .insert({
          store_id: store.id,
          auth_id: user.id,
          name: user.user_metadata?.full_name || user.email || "Owner",
          email: user.email,
          pin_code: "000000", // Default PIN, owner should change later
          role: "owner",
        });

      if (userError) throw userError;

      // Create tables for the outlet
      if (tableCount > 0) {
        const tables = Array.from({ length: tableCount }, (_, i) => ({
          outlet_id: outlet.id,
          table_number: String(i + 1),
          capacity: 4,
        }));

        const { error: tablesError } = await supabase
          .from("tables")
          .insert(tables);

        if (tablesError) throw tablesError;
      }

      toast.success("Store created! Welcome to boo.x.eat.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
      setLoading(false);
    }
  }

  function canProceed(): boolean {
    if (step === 0) return storeName.trim().length > 0;
    if (step === 1) return businessModel !== null;
    if (step === 2) return true;
    return false;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4 py-12">
      <Card className="w-full max-w-lg shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">bx</span>
            </div>
            <span className="text-xl font-bold text-dark-900">
              boo<span className="text-primary-600">.x</span>.eat
            </span>
          </div>
          <CardTitle className="text-2xl">Set up your restaurant</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </CardDescription>
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Store Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                <Store className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-center text-dark-500 text-sm mb-4">
                What&apos;s the name of your restaurant or business?
              </p>
              <div className="space-y-2">
                <Label htmlFor="storeName">Restaurant Name</Label>
                <Input
                  id="storeName"
                  type="text"
                  placeholder="e.g. Restoran Selera Kampung"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Model */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-accent-50 flex items-center justify-center mx-auto mb-2">
                <Utensils className="w-8 h-8 text-accent-600" />
              </div>
              <p className="text-center text-dark-500 text-sm mb-4">
                How do customers order at your restaurant?
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setBusinessModel("qr_ordering")}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    businessModel === "qr_ordering"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    businessModel === "qr_ordering" ? "bg-primary-100" : "bg-gray-100"
                  }`}>
                    <QrCode className={`w-5 h-5 ${
                      businessModel === "qr_ordering" ? "text-primary-600" : "text-gray-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">QR Ordering</p>
                    <p className="text-sm text-dark-500">
                      Customers scan a QR code, browse the menu on their phone, and place orders directly. Best for cafes, restaurants with fixed menus.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessModel("manual_entry")}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    businessModel === "manual_entry"
                      ? "border-accent-500 bg-accent-50"
                      : "border-gray-200 hover:border-accent-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    businessModel === "manual_entry" ? "bg-accent-100" : "bg-gray-100"
                  }`}>
                    <ClipboardList className={`w-5 h-5 ${
                      businessModel === "manual_entry" ? "text-accent-600" : "text-gray-500"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">Manual Entry</p>
                    <p className="text-sm text-dark-500">
                      Cashier records orders on a tablet. Customer selects food, cashier prices items. Best for economy rice, buffet-style, nasi campur.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First Outlet */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-center text-dark-500 text-sm mb-4">
                Set up your first outlet location.
              </p>
              <div className="space-y-2">
                <Label htmlFor="outletName">Outlet Name (optional)</Label>
                <Input
                  id="outletName"
                  type="text"
                  placeholder={storeName ? `${storeName} - Main` : "Main Branch"}
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outletAddress">Address (optional)</Label>
                <Input
                  id="outletAddress"
                  type="text"
                  placeholder="e.g. 123 Jalan Sultan, KL"
                  value={outletAddress}
                  onChange={(e) => setOutletAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tableCount">Number of Tables</Label>
                <Input
                  id="tableCount"
                  type="number"
                  min={1}
                  max={200}
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value))}
                />
                <p className="text-xs text-dark-400">
                  You can add or remove tables anytime from the dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                className="flex-1 bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
                onClick={handleComplete}
                disabled={loading || !canProceed()}
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
