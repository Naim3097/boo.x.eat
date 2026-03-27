"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, Store as StoreIcon, MapPin, Shield, Crown, Check, X, Sparkles, ArrowRight } from "lucide-react";
import bcrypt from "bcryptjs";
import { getTierLimits, getTierDisplayName } from "@/lib/subscription";

export default function SettingsPage() {
  const { store, outlet, staffUser, tierLimits, loading: storeLoading } = useStore();
  const [saving, setSaving] = useState(false);

  // Store settings
  const [storeName, setStoreName] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Outlet settings
  const [outletName, setOutletName] = useState("");
  const [outletAddress, setOutletAddress] = useState("");

  // Upgrade modal
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // PIN change
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setBusinessModel(store.business_model || "");
      setTaxRate(String(store.tax_rate ?? "0"));
    }
    if (outlet) {
      setOutletName(outlet.name);
      setOutletAddress(outlet.address || "");
    }
  }, [store, outlet]);

  async function saveStoreSettings() {
    if (!store) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("stores")
      .update({
        name: storeName.trim(),
        business_model: businessModel,
        tax_rate: parseFloat(taxRate) || 0,
      })
      .eq("id", store.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Store settings saved");
    }
    setSaving(false);
  }

  async function changePin() {
    if (!staffUser) return;
    if (!currentPin.trim()) {
      toast.error("Please enter your current PIN");
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      toast.error("New PIN must be 4-6 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("New PINs do not match");
      return;
    }

    setPinSaving(true);
    const supabase = createClient();

    // Fetch current user's hashed PIN
    const { data: userData } = await supabase
      .from("users")
      .select("pin_code")
      .eq("id", staffUser.id)
      .single();

    if (!userData) {
      toast.error("Could not verify current PIN");
      setPinSaving(false);
      return;
    }

    // Verify current PIN
    if (!bcrypt.compareSync(currentPin, userData.pin_code)) {
      toast.error("Current PIN is incorrect");
      setPinSaving(false);
      return;
    }

    // Update with new hashed PIN
    const { error } = await supabase
      .from("users")
      .update({ pin_code: bcrypt.hashSync(newPin, 10) })
      .eq("id", staffUser.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("PIN changed successfully");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    }
    setPinSaving(false);
  }

  async function upgradeTier(newTier: string) {
    if (!store) return;
    setUpgrading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("stores")
      .update({ subscription_tier: newTier })
      .eq("id", store.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Upgraded to ${getTierDisplayName(newTier)}! Refresh to see changes.`);
      setUpgradeOpen(false);
      window.location.reload();
    }
    setUpgrading(false);
  }

  async function saveOutletSettings() {
    if (!outlet) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("outlets")
      .update({
        name: outletName.trim(),
        address: outletAddress.trim() || null,
      })
      .eq("id", outlet.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Outlet settings saved");
    }
    setSaving(false);
  }

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your store profile and preferences.
        </p>
      </div>

      {/* Subscription Tier */}
      <Card className="border-primary-200 bg-gradient-to-br from-primary-50/50 to-accent-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary-600" />
              <CardTitle className="text-base">Subscription Plan</CardTitle>
            </div>
            <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">
              {getTierDisplayName(tierLimits.tier)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tierLimits.price > 0 ? (
            <p className="text-sm text-gray-600">
              RM {tierLimits.price.toFixed(2)}/month
            </p>
          ) : (
            <p className="text-sm text-gray-600">Free plan</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Max Outlets:</span>
              <span className="font-medium">{tierLimits.maxOutlets}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Max Staff:</span>
              <span className="font-medium">{tierLimits.maxStaff}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Multi-Outlet", enabled: tierLimits.hasMultiOutlet },
              { label: "Inventory Tracking", enabled: tierLimits.hasInventory },
              { label: "Manual Entry / Cashier Mode", enabled: tierLimits.hasManualEntry },
              { label: "Advanced Reports & Charts", enabled: tierLimits.hasAdvancedReports },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-2 text-sm">
                {feature.enabled ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-300" />
                )}
                <span className={feature.enabled ? "text-gray-700" : "text-gray-400"}>
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
          {tierLimits.tier !== "pro" && (
            <Button
              onClick={() => setUpgradeOpen(true)}
              className="w-full mt-2"
              variant="default"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {tierLimits.tier === "starter" ? "Upgrade Plan" : "Upgrade to Pro"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-primary-600" />
              Choose Your Plan
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {(["starter", "growth", "pro"] as const).map((tier) => {
              const limits = getTierLimits(tier);
              const isCurrent = tierLimits.tier === tier;
              const isDowngrade =
                (tierLimits.tier === "pro" && tier !== "pro") ||
                (tierLimits.tier === "growth" && tier === "starter");

              return (
                <div
                  key={tier}
                  className={`relative rounded-xl border-2 p-5 flex flex-col transition-all ${
                    isCurrent
                      ? "border-primary-500 bg-primary-50/50 shadow-md"
                      : "border-gray-200 hover:border-primary-300 hover:shadow-sm"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary-600 text-white">
                      Current
                    </span>
                  )}
                  <h3 className="text-lg font-bold capitalize">{getTierDisplayName(tier)}</h3>
                  <div className="mt-1 mb-4">
                    {limits.price > 0 ? (
                      <p className="text-2xl font-bold">
                        RM {limits.price.toFixed(0)}
                        <span className="text-sm font-normal text-gray-500">/mo</span>
                      </p>
                    ) : (
                      <p className="text-2xl font-bold">Free</p>
                    )}
                  </div>
                  <div className="space-y-2 flex-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span>{limits.maxOutlets} outlet{limits.maxOutlets > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span>{limits.maxStaff} staff</span>
                    </div>
                    {[
                      { label: "Multi-Outlet", on: limits.hasMultiOutlet },
                      { label: "Inventory", on: limits.hasInventory },
                      { label: "Cashier Mode", on: limits.hasManualEntry },
                      { label: "Advanced Reports", on: limits.hasAdvancedReports },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center gap-2">
                        {f.on ? (
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        )}
                        <span className={f.on ? "" : "text-gray-400"}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => upgradeTier(tier)}
                        disabled={upgrading}
                      >
                        {upgrading ? "Processing..." : "Downgrade"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => upgradeTier(tier)}
                        disabled={upgrading}
                      >
                        {upgrading ? "Processing..." : "Upgrade"}
                        {!upgrading && <ArrowRight className="w-4 h-4 ml-1" />}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            Plan changes take effect immediately. No payment integration yet — tiers are applied directly.
          </p>
        </DialogContent>
      </Dialog>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-primary-600" />
            <CardTitle className="text-base">Store Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Your restaurant name"
            />
          </div>
          <div className="space-y-2">
            <Label>Business Model</Label>
            <select
              value={businessModel}
              onChange={(e) => setBusinessModel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="qr_ordering">QR Ordering</option>
              <option value="manual_entry">Manual Entry</option>
            </select>
            <p className="text-xs text-gray-400">
              {businessModel === "qr_ordering"
                ? "Customers scan QR codes to view menu and place orders."
                : "Cashier manually enters orders on the POS."}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="e.g. 6"
            />
            <p className="text-xs text-gray-400">
              Tax will be applied to all new orders. Set to 0 for no tax.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={saveStoreSettings}
              disabled={saving || !storeName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Store"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Outlet Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            <CardTitle className="text-base">Outlet Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Outlet Name</Label>
            <Input
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              placeholder="e.g. Main Branch"
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={outletAddress}
              onChange={(e) => setOutletAddress(e.target.value)}
              placeholder="e.g. 123 Jalan Sultan, KL"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={saveOutletSettings}
              disabled={saving || !outletName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Outlet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security - Change PIN */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <CardTitle className="text-base">Security — Change PIN</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current PIN</Label>
            <Input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter current PIN"
              maxLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>New PIN</Label>
            <Input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="4-6 digits"
              maxLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New PIN</Label>
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Re-enter new PIN"
              maxLength={6}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={changePin}
              disabled={pinSaving || !currentPin || !newPin || !confirmPin}
            >
              <Save className="w-4 h-4 mr-2" />
              {pinSaving ? "Saving..." : "Change PIN"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
