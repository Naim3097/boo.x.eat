"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import type { StaffUser } from "@/types/database";

type StaffRole = "owner" | "manager" | "cashier" | "kitchen" | "waiter";

const ROLE_CONFIG: Record<StaffRole, { label: string; color: string; icon: React.ElementType }> = {
  owner: { label: "Owner", color: "bg-purple-100 text-purple-700", icon: ShieldCheck },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700", icon: Shield },
  cashier: { label: "Cashier", color: "bg-green-100 text-green-700", icon: UserCircle },
  kitchen: { label: "Kitchen", color: "bg-orange-100 text-orange-700", icon: UserCircle },
  waiter: { label: "Waiter", color: "bg-teal-100 text-teal-700", icon: UserCircle },
};

export default function StaffPage() {
  const { store, staffUser, loading: storeLoading } = useStore();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("cashier");
  const [pinCode, setPinCode] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStaff = useCallback(async () => {
    if (!store) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: true })
      .returns<StaffUser[]>();

    if (data) setStaff(data);
    setLoading(false);
  }, [store]);

  useEffect(() => {
    if (store) loadStaff();
  }, [store, loadStaff]);

  function openDialog(member?: StaffUser) {
    if (member) {
      setEditingStaff(member);
      setName(member.name);
      setEmail(member.email || "");
      setRole(member.role as StaffRole);
      setPinCode(member.pin_code);
    } else {
      setEditingStaff(null);
      setName("");
      setEmail("");
      setRole("cashier");
      // Generate random 6-digit PIN
      setPinCode(String(Math.floor(100000 + Math.random() * 900000)));
    }
    setDialogOpen(true);
  }

  async function saveStaff() {
    if (!store || !name.trim() || !pinCode.trim()) return;
    if (pinCode.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    if (editingStaff) {
      const { error } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          email: email.trim() || null,
          role,
          pin_code: pinCode.trim(),
        })
        .eq("id", editingStaff.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Staff updated");
    } else {
      // Check for duplicate PIN
      const duplicate = staff.some((s) => s.pin_code === pinCode.trim());
      if (duplicate) {
        toast.error("This PIN is already used by another staff member");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("users")
        .insert({
          store_id: store.id,
          name: name.trim(),
          email: email.trim() || null,
          role,
          pin_code: pinCode.trim(),
        });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Staff added");
    }

    setDialogOpen(false);
    setSaving(false);
    loadStaff();
  }

  async function deleteStaff(member: StaffUser) {
    if (member.role === "owner") {
      toast.error("Cannot delete the owner account");
      return;
    }
    if (!confirm(`Remove ${member.name} from staff?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("users").delete().eq("id", member.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Staff removed");
    loadStaff();
  }

  async function toggleActive(member: StaffUser) {
    if (member.role === "owner") return;
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ is_active: !member.is_active })
      .eq("id", member.id);
    if (error) { toast.error(error.message); return; }
    loadStaff();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts, roles, and PIN codes.
          </p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff List */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 mb-4">No staff members yet</p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role as StaffRole] || ROLE_CONFIG.cashier;
            const RoleIcon = roleConfig.icon;
            const isCurrentUser = staffUser?.id === member.id;
            const isActive = member.is_active !== false;

            return (
              <Card key={member.id} className={`${!isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleConfig.color}`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                        {isCurrentUser && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">You</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{member.email || "No email"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          PIN: {member.pin_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {member.role !== "owner" && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <button
                        onClick={() => toggleActive(member)}
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => openDialog(member)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => deleteStaff(member)}
                        className="p-1.5 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmad bin Ibrahim"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="kitchen">Kitchen</option>
                <option value="waiter">Waiter</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>PIN Code *</Label>
              <Input
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit PIN"
                maxLength={6}
              />
              <p className="text-xs text-gray-400">
                Staff use this PIN to log in on the POS terminal.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveStaff} disabled={saving || !name.trim() || !pinCode.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
