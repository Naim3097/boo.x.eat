import { z } from "zod";

// ========== Staff Login ==========
export const staffLoginSchema = z.object({
  pin: z
    .string()
    .min(4, "PIN must be at least 4 digits")
    .max(6, "PIN must be at most 6 digits")
    .regex(/^\d+$/, "PIN must contain only digits"),
  outletId: z.string().uuid().optional(),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

// ========== Order Creation ==========
export const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  item_name: z.string().min(1, "Item name is required").max(200),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100),
  unit_price: z.number().min(0),
  subtotal: z.number().min(0),
  special_instructions: z.string().max(500).nullable().optional(),
  variants_json: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
      })
    )
    .nullable()
    .optional(),
});

export const createOrderSchema = z.object({
  outlet_id: z.string().uuid("Invalid outlet ID"),
  table_id: z.string().uuid("Invalid table ID").optional().nullable(),
  order_type: z.enum(["dine_in", "takeaway", "delivery"]),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  customer_phone: z.string().max(20).optional().nullable(),
  delivery_address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ========== Menu Item ==========
export const menuItemSchema = z.object({
  store_id: z.string().uuid(),
  name_en: z.string().min(1, "English name is required").max(200),
  name_ms: z.string().max(200).nullable().optional(),
  description_en: z.string().max(1000).nullable().optional(),
  description_ms: z.string().max(1000).nullable().optional(),
  base_price: z.number().min(0, "Price must be non-negative").max(99999),
  image_url: z.string().url().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

// ========== Category ==========
export const categorySchema = z.object({
  store_id: z.string().uuid(),
  name_en: z.string().min(1, "English name is required").max(100),
  name_ms: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ========== Variant ==========
export const variantSchema = z.object({
  menu_item_id: z.string().uuid(),
  group_name: z.string().min(1, "Group name is required").max(100),
  name_en: z.string().min(1, "English name is required").max(100),
  name_ms: z.string().max(100).nullable().optional(),
  price_adjustment: z.number().min(-9999).max(9999).optional(),
  is_default: z.boolean().optional(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export type VariantInput = z.infer<typeof variantSchema>;

// ========== Table Management ==========
export const tableSchema = z.object({
  outlet_id: z.string().uuid(),
  table_number: z.string().min(1, "Table number is required").max(20),
  capacity: z.number().int().min(1).max(100).optional(),
  status: z.enum(["available", "occupied", "reserved"]).optional(),
});

export type TableInput = z.infer<typeof tableSchema>;

// ========== Payment ==========
export const cashPaymentSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export const generateQrSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export type CashPaymentInput = z.infer<typeof cashPaymentSchema>;
export type GenerateQrInput = z.infer<typeof generateQrSchema>;
