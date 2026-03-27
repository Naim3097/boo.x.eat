"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, MapPin, Loader2, ToggleLeft, ToggleRight, Building2 } from "lucide-react";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import type { Outlet } from "@/types/database";

export default function OutletsPage() {
  const { store, loading: storeLoading, tierLimits } = useStore();
  const [allOutlets, setAllOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Outlet | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOutlets = useCallback(async () => {
    if (!store) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("outlets")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: true });
    if (data) setAllOutlets(data as Outlet[]);
    setLoading(false);
  }, [store]);

  useEffect(() => {
    if (store) loadOutlets();
  }, [store, loadOutlets]);

  if (!tierLimits.hasMultiOutlet && allOutlets.length <= 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outlets</h1>
          <p className="text-sm text-muted-foreground">Manage your restaurant outlets and locations.</p>
        </div>
        <UpgradePrompt
          feature="Multi-Outlet Management"
          requiredTier="growth"
          currentTier={store?.subscription_tier || "starter"}
        />
      </div>
    );
  }

  function openDialog(outlet?: Outlet) {
    if (outlet) {
      setEditing(outlet);
      setName(outlet.name);
      setAddress(outlet.address || "");
      setPhone(outlet.phone || "");
    } else {
      setEditing(null);
      setName("");
      setAddress("");
      setPhone("");
    }
    setDialogOpen(true);
  }

  async function saveOutlet() {
    if (!store || !name.trim()) return;

    // Check tier limit for new outlets
    if (!editing) {
      const activeCount = allOutlets.filter((o) => o.is_active).length;
      if (activeCount >= tierLimits.maxOutlets) {
        toast.error(`Your ${tierLimits.tier} plan allows up to ${tierLimits.maxOutlets} outlet(s). Upgrade to add more.`);
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      store_id: store.id,
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("outlets")
        .update(payload)
        .eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Outlet updated");
    } else {
      const { error } = await supabase
        .from("outlets")
        .insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Outlet created");
    }

    setDialogOpen(false);
    setSaving(false);
    loadOutlets();
  }

  async function toggleActive(outlet: Outlet) {
    const supabase = createClient();
    const { error } = await supabase
      .from("outlets")
      .update({ is_active: !outlet.is_active })
      .eq("id", outlet.id);
    if (error) { toast.error(error.message); return; }
    toast.success(outlet.is_active ? "Outlet deactivated" : "Outlet activated");
    loadOutlets();
  }

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outlets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant outlets and locations.{" "}
            <span className="text-gray-400">
              ({allOutlets.filter((o) => o.is_active).length}/{tierLimits.maxOutlets} outlets used)
            </span>
          </p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Outlet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allOutlets.map((outlet) => (
          <Card key={outlet.id} className={!outlet.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{outlet.name}</CardTitle>
                    {outlet.address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {outlet.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleActive(outlet)}
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    outlet.is_active ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {outlet.is_active ? (
                    <><ToggleRight className="w-4 h-4" /> Active</>
                  ) : (
                    <><ToggleLeft className="w-4 h-4" /> Inactive</>
                  )}
                </button>
                <Button variant="ghost" size="sm" onClick={() => openDialog(outlet)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Outlet" : "New Outlet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Outlet Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Branch, KL Outlet"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 123 Jalan Sultan, KL"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 03-1234 5678"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveOutlet} disabled={saving || !name.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
