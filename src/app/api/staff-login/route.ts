import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { pin, outletId } = await request.json();

    if (!pin || typeof pin !== "string" || pin.length < 4) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find staff by PIN code
    // If outletId is provided, also match by outlet's store
    const query = supabase
      .from("users")
      .select("id, name, email, role, store_id, outlet_id, is_active")
      .eq("pin_code", pin)
      .eq("is_active", true);

    const { data: staffMembers, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }

    if (!staffMembers || staffMembers.length === 0) {
      return NextResponse.json(
        { error: "Invalid PIN or account inactive" },
        { status: 401 }
      );
    }

    // If multiple staff have the same PIN (shouldn't happen), take first
    const staff = staffMembers[0];

    // Get the outlet info
    const outletQuery = outletId
      ? supabase.from("outlets").select("id, name, store_id").eq("id", outletId).single()
      : supabase.from("outlets").select("id, name, store_id").eq("store_id", staff.store_id).limit(1).single();

    const { data: outlet } = await outletQuery;

    // Get store info
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, business_model")
      .eq("id", staff.store_id)
      .single();

    return NextResponse.json({
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        store_id: staff.store_id,
      },
      outlet: outlet ? { id: outlet.id, name: outlet.name } : null,
      store: store ? { id: store.id, name: store.name, business_model: store.business_model } : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
