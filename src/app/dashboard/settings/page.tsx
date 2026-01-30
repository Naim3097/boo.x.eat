"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Store, MapPin } from "lucide-react";

export default function SettingsPage() {
  const { store, outlet, loading: storeLoading } = useStore();
  const [saving, setSaving] = useState(false);

  // Store settings
  const [storeName, setStoreName] = useState("");
  const [businessModel, setBusinessModel] = useState("");

  // Outlet settings
  const [outletName, setOutletName] = useState("");
  const [outletAddress, setOutletAddress] = useState("");

  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setBusinessModel(store.business_model || "");
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
      })
      .eq("id", store.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Store settings saved");
    }
    setSaving(false);
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

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-600" />
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
    </div>
  );
}
