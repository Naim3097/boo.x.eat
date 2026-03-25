import { createServerSupabaseClient } from "@/lib/supabase/server";
import { staffLoginSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const parsed = staffLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { pin, outletId } = parsed.data;

    const supabase = createServerSupabaseClient();

    // Fetch all active users via RPC (bypasses RLS since user isn't authenticated yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: staffMembers, error } = await (supabase as any)
      .rpc("verify_staff_pin", { pin_input: pin }) as { data: { id: string; name: string; email: string; role: string; store_id: string; outlet_id: string; is_active: boolean; pin_code: string }[] | null; error: { message: string } | null };

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

    // Find user by comparing PIN hash
    const staff = staffMembers.find((member: { pin_code: string }) =>
      bcrypt.compareSync(pin, member.pin_code)
    );

    if (!staff) {
      return NextResponse.json(
        { error: "Invalid PIN or account inactive" },
        { status: 401 }
      );
    }

    // Get the outlet info via RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: outletRows } = await (supabase as any)
      .rpc("get_staff_outlet", {
        p_store_id: staff.store_id,
        ...(outletId ? { p_outlet_id: outletId } : {}),
      }) as { data: { id: string; name: string; store_id: string }[] | null; error: unknown };
    const outlet = outletRows?.[0] || null;

    // Get store info via RPC (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: storeRows } = await (supabase as any)
      .rpc("get_staff_store", { p_store_id: staff.store_id }) as { data: { id: string; name: string; business_model: string }[] | null; error: unknown };
    const store = storeRows?.[0] || null;

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
