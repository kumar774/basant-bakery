import { supabase } from "./supabase";

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  item_category: "Cake" | "Pastry" | "Decoration Item";
  item_name: string;
  quantity: number;
  total_amount: number;
  advance_payment: number;
  remaining_payment: number;
  payment_status: "Unpaid" | "Partial" | "Paid";
  order_status: "Pending" | "Ready" | "Collected" | "Cancelled";
  pickup_date: string;
  notes?: string | null;
  created_at: string;
};

export type CreateOrderInput = {
  customer_name: string;
  customer_phone: string;
  item_category: "Cake" | "Pastry" | "Decoration Item";
  item_name: string;
  quantity: number;
  total_amount: number;
  advance_payment: number;
  order_status?: Order["order_status"];
  pickup_date: string;
  notes?: string;
};

export type UpdateOrderInput = Partial<CreateOrderInput>;

function supabaseError(msg: string, code?: string): Error {
  if (code === "42501" || msg.toLowerCase().includes("row-level security")) {
    return new Error(
      "Permission denied — enable RLS policies for the orders table in your Supabase dashboard, or disable RLS for development.",
    );
  }
  if (
    msg === "JWT expired" ||
    msg.toLowerCase().includes("not authenticated")
  ) {
    return new Error("Session expired — please sign in again.");
  }
  return new Error(msg);
}

function computePayment(total: number, advance: number) {
  const t = Math.max(0, Number(total) || 0);
  const a = Math.min(Math.max(0, Number(advance) || 0), t);
  const remaining = Math.max(0, t - a);
  const payment_status: Order["payment_status"] =
    remaining <= 0 && (a > 0 || t === 0)
      ? "Paid"
      : a > 0
        ? "Partial"
        : "Unpaid";
  return { remaining_payment: remaining, payment_status };
}

function normalise(row: Record<string, unknown>): Order {
  return {
    ...row,
    quantity: Number(row.quantity) || 1,
    total_amount: Number(row.total_amount) || 0,
    advance_payment: Number(row.advance_payment) || 0,
    remaining_payment: Number(row.remaining_payment) || 0,
  } as Order;
}

export async function fetchOrders(filters?: {
  search?: string;
  status?: string;
  payment_status?: string;
}): Promise<Order[]> {
  let q = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.search?.trim()) {
    const s = filters.search.trim();
    q = q.or(
      `customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,item_name.ilike.%${s}%`,
    );
  }
  if (filters?.status) q = q.eq("order_status", filters.status);
  if (filters?.payment_status)
    q = q.eq("payment_status", filters.payment_status);

  const { data, error } = await q;
  if (error) throw supabaseError(error.message, error.code);
  return ((data ?? []) as Record<string, unknown>[]).map(normalise);
}

export async function insertOrder(input: CreateOrderInput): Promise<Order> {
  const { remaining_payment, payment_status } = computePayment(
    input.total_amount,
    input.advance_payment,
  );

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      item_category: input.item_category,
      item_name: input.item_name.trim(),
      quantity: Number(input.quantity) || 1,
      total_amount: Number(input.total_amount) || 0,
      advance_payment: Number(input.advance_payment) || 0,
      remaining_payment,
      payment_status,
      order_status: input.order_status ?? "Pending",
      pickup_date: input.pickup_date,
      notes: input.notes?.trim() ?? null,
    })
    .select()
    .single();

  if (error) throw supabaseError(error.message, error.code);
  return normalise(data as Record<string, unknown>);
}

export async function patchOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<Order> {
  const update: Record<string, unknown> = {};

  if (input.customer_name !== undefined)
    update.customer_name = input.customer_name.trim();
  if (input.customer_phone !== undefined)
    update.customer_phone = input.customer_phone.trim();
  if (input.item_category !== undefined)
    update.item_category = input.item_category;
  if (input.item_name !== undefined) update.item_name = input.item_name.trim();
  if (input.quantity !== undefined)
    update.quantity = Number(input.quantity) || 1;
  if (input.order_status !== undefined)
    update.order_status = input.order_status;
  if (input.pickup_date !== undefined) update.pickup_date = input.pickup_date;
  if (input.notes !== undefined) update.notes = input.notes?.trim() ?? null;

  if (input.total_amount !== undefined || input.advance_payment !== undefined) {
    const { data: cur, error: fe } = await supabase
      .from("orders")
      .select("total_amount,advance_payment")
      .eq("id", id)
      .single();
    if (fe) throw supabaseError(fe.message, fe.code);

    const total =
      input.total_amount !== undefined
        ? Number(input.total_amount)
        : Number(cur.total_amount) || 0;
    const advance =
      input.advance_payment !== undefined
        ? Number(input.advance_payment)
        : Number(cur.advance_payment) || 0;
    const { remaining_payment, payment_status } = computePayment(
      total,
      advance,
    );

    update.total_amount = total;
    update.advance_payment = advance;
    update.remaining_payment = remaining_payment;
    update.payment_status = payment_status;
  }

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw supabaseError(error.message, error.code);
  return normalise(data as Record<string, unknown>);
}

export async function removeOrder(id: string): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw supabaseError(error.message, error.code);
}

/**
 * Marks an order fully paid.
 * Also advances order_status out of Pending / In Progress → Ready
 * (payment done means it's being prepared or is ready to collect).
 */
export async function paidOrder(id: string): Promise<Order> {
  const { data: cur, error: fe } = await supabase
    .from("orders")
    .select("total_amount, order_status")
    .eq("id", id)
    .single();
  if (fe) throw supabaseError(fe.message, fe.code);

  const total = Number(cur.total_amount) || 0;
  const shouldAdvanceStatus = cur.order_status === "Pending";

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "Paid",
      remaining_payment: 0,
      advance_payment: total,
      ...(shouldAdvanceStatus ? { order_status: "Ready" } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw supabaseError(error.message, error.code);
  return normalise(data as Record<string, unknown>);
}

export async function updateOrderStatus(
  id: string,
  status: Order["order_status"],
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw supabaseError(error.message, error.code);
  return normalise(data as Record<string, unknown>);
}
