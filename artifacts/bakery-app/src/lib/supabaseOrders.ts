import { supabase } from './supabase';

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  item_category: 'Cake' | 'Pastry' | 'Decoration Item';
  item_name: string;
  quantity: number;
  total_amount: number;
  advance_payment: number;
  remaining_payment: number;
  payment_status: 'Unpaid' | 'Partial' | 'Paid';
  order_status: 'Pending' | 'In Progress' | 'Ready' | 'Delivered' | 'Cancelled';
  pickup_date: string;
  notes?: string | null;
  created_at: string;
};

export type CreateOrderInput = {
  customer_name: string;
  customer_phone: string;
  item_category: 'Cake' | 'Pastry' | 'Decoration Item';
  item_name: string;
  quantity: number;
  total_amount: number;
  advance_payment: number;
  order_status?: Order['order_status'];
  pickup_date: string;
  notes?: string;
};

export type UpdateOrderInput = Partial<CreateOrderInput>;

function computePayment(total: number, advance: number) {
  const remaining = Math.max(0, total - advance);
  const payment_status: Order['payment_status'] =
    remaining <= 0 && (advance > 0 || total === 0) ? 'Paid'
    : advance > 0 ? 'Partial'
    : 'Unpaid';
  return { remaining_payment: remaining, payment_status };
}

export async function fetchOrders(filters?: {
  search?: string;
  status?: string;
  payment_status?: string;
}): Promise<Order[]> {
  let q = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    const s = filters.search;
    q = q.or(
      `customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,item_name.ilike.%${s}%`
    );
  }
  if (filters?.status) q = q.eq('order_status', filters.status);
  if (filters?.payment_status) q = q.eq('payment_status', filters.payment_status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

export async function insertOrder(input: CreateOrderInput): Promise<Order> {
  const { remaining_payment, payment_status } = computePayment(
    input.total_amount,
    input.advance_payment
  );

  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...input,
      remaining_payment,
      payment_status,
      order_status: input.order_status ?? 'Pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
}

export async function patchOrder(id: string, input: UpdateOrderInput): Promise<Order> {
  const updateData: Record<string, unknown> = { ...input };

  if (input.total_amount !== undefined || input.advance_payment !== undefined) {
    const { data: existing, error: fetchErr } = await supabase
      .from('orders')
      .select('total_amount,advance_payment')
      .eq('id', id)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const total = input.total_amount ?? (existing?.total_amount ?? 0);
    const advance = input.advance_payment ?? (existing?.advance_payment ?? 0);
    const { remaining_payment, payment_status } = computePayment(
      Number(total),
      Number(advance)
    );
    updateData.remaining_payment = remaining_payment;
    updateData.payment_status = payment_status;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
}

export async function removeOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function paidOrder(id: string): Promise<Order> {
  const { data: existing, error: fe } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('id', id)
    .single();
  if (fe) throw new Error(fe.message);

  const { data, error } = await supabase
    .from('orders')
    .update({
      payment_status: 'Paid',
      remaining_payment: 0,
      advance_payment: existing.total_amount,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Order;
}
