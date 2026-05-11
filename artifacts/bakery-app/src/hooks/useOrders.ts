import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchOrders,
  insertOrder,
  patchOrder,
  removeOrder,
  paidOrder,
} from '@/lib/supabaseOrders';
import type { CreateOrderInput, UpdateOrderInput } from '@/lib/supabaseOrders';

export const ORDERS_KEY = ['sb-orders'] as const;

function useRealtimeInvalidate() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('orders-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => qc.invalidateQueries({ queryKey: ORDERS_KEY })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);
}

export function useAllOrders() {
  useRealtimeInvalidate();
  return useQuery({
    queryKey: ORDERS_KEY,
    queryFn: () => fetchOrders(),
    staleTime: 30_000,
  });
}

export function useFilteredOrders(filters?: { search?: string; status?: string }) {
  useRealtimeInvalidate();
  return useQuery({
    queryKey: [...ORDERS_KEY, 'filtered', filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 10_000,
  });
}

export function useDashboardStats() {
  const { data: orders = [], isLoading, error } = useAllOrders();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString().split('T')[0];

    const today_orders = orders.filter((o) => o.pickup_date === today).length;
    const pickup_today = today_orders;
    const pending_orders = orders.filter((o) => o.order_status === 'Pending').length;
    const completed_orders = orders.filter((o) => o.order_status === 'Delivered').length;
    const total_revenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
    const this_month_revenue = orders
      .filter((o) => o.created_at >= startOfMonth)
      .reduce((s, o) => s + Number(o.total_amount), 0);
    const pending_payments = orders
      .filter((o) => o.payment_status !== 'Paid')
      .reduce((s, o) => s + Number(o.remaining_payment), 0);
    const total_customers = new Set(
      orders.map((o) => `${o.customer_name}|${o.customer_phone}`)
    ).size;

    return {
      today_orders,
      pickup_today,
      pending_orders,
      completed_orders,
      total_revenue,
      this_month_revenue,
      pending_payments,
      total_customers,
    };
  }, [orders]);

  return { stats, isLoading, error };
}

export function useRecentActivity() {
  const { data: orders = [], isLoading } = useAllOrders();

  const activity = useMemo(() =>
    orders.slice(0, 10).map((o) => ({
      id: o.id,
      message:
        o.payment_status === 'Paid'
          ? `${o.customer_name} completed payment for ${o.item_name}`
          : `New order: ${o.item_name} for ${o.customer_name}`,
      timestamp: o.created_at,
    })),
    [orders]
  );

  return { activity, isLoading };
}

export function useCategoryBreakdown() {
  const { data: orders = [], isLoading } = useAllOrders();

  const breakdown = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const o of orders) {
      const cat = o.item_category;
      const existing = map.get(cat) ?? { count: 0, revenue: 0 };
      map.set(cat, {
        count: existing.count + 1,
        revenue: existing.revenue + Number(o.total_amount),
      });
    }
    return Array.from(map.entries()).map(([category, v]) => ({
      category,
      ...v,
    }));
  }, [orders]);

  return { breakdown, isLoading };
}

export function useRevenueChart(days: number) {
  const { data: orders = [], isLoading } = useAllOrders();

  const data = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const filtered = orders.filter((o) => o.created_at >= cutoffStr);
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const o of filtered) {
      const date = o.created_at.split('T')[0];
      const existing = map.get(date) ?? { revenue: 0, orders: 0 };
      map.set(date, {
        revenue: existing.revenue + Number(o.total_amount),
        orders: existing.orders + 1,
      });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }, [orders, days]);

  return { data, isLoading };
}

export function useCustomers() {
  const { data: orders = [], isLoading } = useAllOrders();

  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        phone_number: string;
        total_orders: number;
        total_spent: number;
        last_order_date: string | null;
      }
    >();

    for (const o of orders) {
      const key = `${o.customer_name}|${o.customer_phone}`;
      const existing = map.get(key);
      if (existing) {
        existing.total_orders += 1;
        existing.total_spent += Number(o.total_amount);
        if (
          !existing.last_order_date ||
          o.created_at > existing.last_order_date
        ) {
          existing.last_order_date = o.created_at;
        }
      } else {
        map.set(key, {
          id: key,
          name: o.customer_name,
          phone_number: o.customer_phone,
          total_orders: 1,
          total_spent: Number(o.total_amount),
          last_order_date: o.created_at,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (b.last_order_date ?? '').localeCompare(a.last_order_date ?? '')
    );
  }, [orders]);

  return { customers, isLoading };
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderInput) => insertOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderInput }) =>
      patchOrder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useMarkOrderPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paidOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}
