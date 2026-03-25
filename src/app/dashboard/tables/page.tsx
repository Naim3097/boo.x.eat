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
  QrCode,
  Download,
  Loader2,
  Users,
  Grid3X3,
} from "lucide-react";
import type { Table } from "@/types/database";
import QRCode from "qrcode";

type TableStatus = "available" | "occupied" | "reserved";

const STATUS_COLORS: Record<TableStatus, string> = {
  available: "bg-green-100 text-green-700 border-green-200",
  occupied: "bg-red-100 text-red-700 border-red-200",
  reserved: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const STATUS_DOT: Record<TableStatus, string> = {
  available: "bg-green-500",
  occupied: "bg-red-500",
  reserved: "bg-yellow-500",
};

export default function TablesPage() {
  const { outlet, loading: storeLoading } = useStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [saving, setSaving] = useState(false);

  // Bulk add dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFrom, setBulkFrom] = useState("");
  const [bulkTo, setBulkTo] = useState("");
  const [bulkCapacity, setBulkCapacity] = useState("4");
  const [bulkSaving, setBulkSaving] = useState(false);

  // QR dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const loadTables = useCallback(async () => {
    if (!outlet) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("outlet_id", outlet.id)
      .order("table_number", { ascending: true })
      .returns<Table[]>();

    if (data) setTables(data);
    setLoading(false);
  }, [outlet]);

  useEffect(() => {
    if (outlet) loadTables();
  }, [outlet, loadTables]);

  // ========== SINGLE TABLE CRUD ==========

  function openDialog(table?: Table) {
    if (table) {
      setEditingTable(table);
      setTableNumber(table.table_number);
      setCapacity(String(table.capacity || 4));
    } else {
      setEditingTable(null);
      // Auto-suggest next table number
      const maxNum = tables.reduce((max, t) => {
        const n = parseInt(t.table_number);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      setTableNumber(String(maxNum + 1));
      setCapacity("4");
    }
    setDialogOpen(true);
  }

  async function saveTable() {
    if (!outlet || !tableNumber.trim()) return;
    setSaving(true);
    const supabase = createClient();

    if (editingTable) {
      const { error } = await supabase
        .from("tables")
        .update({
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity) || 4,
        })
        .eq("id", editingTable.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Table updated");
    } else {
      // Check for duplicate table number
      const exists = tables.some((t) => t.table_number === tableNumber.trim());
      if (exists) {
        toast.error(`Table ${tableNumber.trim()} already exists`);
        setSaving(false);
        return;
      }

      const { data: newTable, error } = await supabase
        .from("tables")
        .insert({
          outlet_id: outlet.id,
          table_number: tableNumber.trim(),
          capacity: parseInt(capacity) || 4,
        })
        .select("id")
        .single();
      if (error) { toast.error(error.message); setSaving(false); return; }

      // Persist QR code URL
      if (newTable) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const qrUrl = `${baseUrl}/order/${outlet.id}/${newTable.id}`;
        await supabase.from("tables").update({ qr_code_url: qrUrl }).eq("id", newTable.id);
      }
      toast.success("Table created");
    }

    setDialogOpen(false);
    setSaving(false);
    loadTables();
  }

  async function deleteTable(id: string) {
    if (!confirm("Delete this table? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("tables").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Table deleted");
    loadTables();
  }

  async function updateStatus(table: Table, status: TableStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from("tables")
      .update({ status })
      .eq("id", table.id);
    if (error) { toast.error(error.message); return; }
    loadTables();
  }

  // ========== BULK ADD ==========

  async function bulkAddTables() {
    if (!outlet) return;
    const from = parseInt(bulkFrom);
    const to = parseInt(bulkTo);
    if (isNaN(from) || isNaN(to) || from > to || to - from > 200) {
      toast.error("Invalid range. Max 200 tables at once.");
      return;
    }

    setBulkSaving(true);
    const supabase = createClient();

    const existingNumbers = new Set(tables.map((t) => t.table_number));
    const newTables = [];
    for (let i = from; i <= to; i++) {
      const num = String(i);
      if (!existingNumbers.has(num)) {
        newTables.push({
          outlet_id: outlet.id,
          table_number: num,
          capacity: parseInt(bulkCapacity) || 4,
        });
      }
    }

    if (newTables.length === 0) {
      toast.error("All table numbers in this range already exist");
      setBulkSaving(false);
      return;
    }

    const { data: createdTables, error } = await supabase
      .from("tables")
      .insert(newTables)
      .select("id");
    if (error) { toast.error(error.message); setBulkSaving(false); return; }

    // Persist QR URLs for newly created tables
    if (createdTables && createdTables.length > 0) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const updates = createdTables.map((t: { id: string }) => ({
        id: t.id,
        qr_code_url: `${baseUrl}/order/${outlet.id}/${t.id}`,
      }));
      for (const update of updates) {
        await supabase.from("tables").update({ qr_code_url: update.qr_code_url }).eq("id", update.id);
      }
    }

    toast.success(`${newTables.length} tables created`);
    setBulkDialogOpen(false);
    setBulkSaving(false);
    loadTables();
  }

  // ========== QR CODE ==========

  function getOrderUrl(table: Table): string {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/order/${outlet!.id}/${table.id}`;
  }

  async function showQR(table: Table) {
    setQrTable(table);
    setQrDialogOpen(true);
    const url = getOrderUrl(table);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);

    // Persist the order URL to the table record
    const supabase = createClient();
    await supabase.from("tables").update({ qr_code_url: url }).eq("id", table.id);
  }

  async function downloadQR(table: Table) {
    const url = getOrderUrl(table);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    });

    const link = document.createElement("a");
    link.download = `table-${table.table_number}-qr.png`;
    link.href = dataUrl;
    link.click();
  }

  async function downloadAllQR() {
    for (const table of tables) {
      await downloadQR(table);
      // Small delay to prevent browser blocking multiple downloads
      await new Promise((r) => setTimeout(r, 200));
    }
    toast.success("All QR codes downloaded");
  }

  // Stats
  const available = tables.filter((t) => (t.status || "available") === "available").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;
  const reserved = tables.filter((t) => t.status === "reserved").length;

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
          <h1 className="text-2xl font-bold tracking-tight">Table Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure tables and generate QR codes for customer ordering.
          </p>
        </div>
        <div className="flex gap-2">
          {tables.length > 0 && (
            <Button variant="outline" onClick={downloadAllQR}>
              <Download className="w-4 h-4 mr-2" />
              All QR Codes
            </Button>
          )}
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Grid3X3 className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Button
            onClick={() => openDialog()}
            className="bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-2xl font-bold">{available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-2xl font-bold">{occupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{reserved}</p>
                <p className="text-xs text-muted-foreground">Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Grid3X3 className="w-12 h-12 text-dark-200 mb-4" />
            <p className="text-dark-500 mb-4">No tables yet</p>
            <div className="flex gap-2">
              <Button onClick={() => setBulkDialogOpen(true)} variant="outline">
                <Grid3X3 className="w-4 h-4 mr-2" />
                Bulk Add Tables
              </Button>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add a Table
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {tables.map((table) => {
            const status = (table.status || "available") as TableStatus;
            return (
              <Card
                key={table.id}
                className={`relative group border-2 ${STATUS_COLORS[status]}`}
              >
                <CardContent className="p-4 text-center">
                  {/* Status dot */}
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                  </div>

                  {/* Table number */}
                  <p className="text-2xl font-bold mb-1">{table.table_number}</p>

                  {/* Capacity */}
                  <div className="flex items-center justify-center gap-1 text-xs opacity-70 mb-3">
                    <Users className="w-3 h-3" />
                    <span>{table.capacity || 4} seats</span>
                  </div>

                  {/* Status selector */}
                  <select
                    value={status}
                    onChange={(e) => updateStatus(table, e.target.value as TableStatus)}
                    className="w-full text-xs rounded-md border bg-white/50 px-2 py-1 mb-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => showQR(table)}
                      className="p-1.5 hover:bg-white/50 rounded"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadQR(table)}
                      className="p-1.5 hover:bg-white/50 rounded"
                      title="Download QR"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDialog(table)}
                      className="p-1.5 hover:bg-white/50 rounded"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="p-1.5 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Table Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? "Edit Table" : "Add Table"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Table Number *</Label>
              <Input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 1, A1, VIP-1"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Seating Capacity</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveTable} disabled={saving || !tableNumber.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Tables</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create multiple numbered tables at once. Existing table numbers will be skipped.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={bulkFrom}
                  onChange={(e) => setBulkFrom(e.target.value)}
                  placeholder="1"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>To Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={bulkTo}
                  onChange={(e) => setBulkTo(e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Seating Capacity (all)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={bulkAddTables}
                disabled={bulkSaving || !bulkFrom || !bulkTo}
              >
                {bulkSaving ? "Creating..." : "Create Tables"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Preview Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Table {qrTable?.table_number} - QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {qrDataUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR code for table ${qrTable?.table_number}`}
                  className="w-64 h-64 mx-auto rounded-xl border"
                />
                <p className="text-xs text-muted-foreground break-all">
                  {qrTable && getOrderUrl(qrTable)}
                </p>
                <Button
                  onClick={() => qrTable && downloadQR(qrTable)}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
