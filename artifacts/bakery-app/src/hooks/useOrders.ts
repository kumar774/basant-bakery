import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchOrders,
  insertOrder,
  patchOrder,
  removeOrder,
  paidOrder,
  updateOrderStatus,
} from '@/lib/supabaseOrders';
import type { CreateOrderInput, UpdateOrderInput, Order } from '@/lib/supabaseOrders';

export const ORDERS_KEY = ['sb-orders'] as const;

/**
 * One Supabase Realtime subscription per hook instance.
 * Uses a unique random channel name so concurrent mounts (or React
 * Strict Mode's double-effect invocation) never clash on the same
 * channel, which would throw "cannot add callbacks after subscribe()".
 */
function useRealtimeInvalidate() {
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const name = `orders-rt-${Math.random().toString(36).slice(2, 9)}`;
    const ch = supabase
      .channel(name)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => void qc.invalidateQueries({ queryKey: ORDERS_KEY })
      )
      .subscribe();
    channelRef.current = ch;
    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // qc is stable (created once in App) — empty deps is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** All orders, kept live via Realtime. Used by dashboard / analytics / customers. */
export function useAllOrders() {
  useRealtimeInvalidate();
  return useQuery({
    queryKey: ORDERS_KEY,
    queryFn: () => fetchOrders(),
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Filtered orders for the Orders list page.
 * Has its own Realtime subscription so it stays live even when the
 * user is on the Orders page (not the Dashboard).
 * Channel names are unique so there is no clash with useAllOrders.
 */
export function useFilteredOrders(filters?: { search?: string; status?: string }) {
  useRealtimeInvalidate();
  return useQuery({
    queryKey: [...ORDERS_KEY, 'filtered', filters ?? {}],
    queryFn: () => fetchOrders(filters),
    staleTime: 10_000,
    retry: 1,
  });
}

export function useDashboardStats() {
  const { data: orders = [], isLoading, error } = useAllOrders();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];

    const today_orders      = orders.filter((o) => o.pickup_date === today).length;
    const pending_orders    = orders.filter((o) => o.order_status === 'Pending').length;
    const completed_orders  = orders.filter((o) => o.order_status === 'Delivered').length;
    const total_revenue     = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
    const this_month_revenue = orders
      .filter((o) => (o.created_at ?? '') >= startOfMonth)
      .reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
    const pending_payments  = orders
      .filter((o) => o.payment_status !== 'Paid')
      .reduce((s, o) => s + Number(o.remaining_payment ?? 0), 0);
    const total_customers   = new Set(
      orders.map((o) => `${o.customer_name ?? ''}|${o.customer_phone ?? ''}`)
    ).size;

    return {
      today_orders, pickup_today: today_orders,
      pending_orders, completed_orders,
      total_revenue, this_month_revenue,
      pending_payments, total_customers,
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
          ? `${o.customer_name} — payment complete for ${o.item_name}`
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
      const cat = o.item_category ?? 'Other';
      const prev = map.get(cat) ?? { count: 0, revenue: 0 };
      map.set(cat, { count: prev.count + 1, revenue: prev.revenue + Number(o.total_amount ?? 0) });
    }
    return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }));
  }, [orders]);
  return { breakdown, isLoading };
}

export function useRevenueChart(days: number) {
  const { data: orders = [], isLoading } = useAllOrders();
  const data = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      if (!o.created_at || o.created_at < cutoffStr) continue;
      const date = o.created_at.split('T')[0];
      const prev = map.get(date) ?? { revenue: 0, orders: 0 };
      map.set(date, { revenue: prev.revenue + Number(o.total_amount ?? 0), orders: prev.orders + 1 });
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
    const map = new Map<string, {
      id: string; name: string; phone_number: string;
      total_orders: number; total_spent: number; last_order_date: string | null;
    }>();
    for (const o of orders) {
      const key = `${o.customer_name ?? ''}|${o.customer_phone ?? ''}`;
      const prev = map.get(key);
      if (prev) {
        prev.total_orders += 1;
        prev.total_spent  += Number(o.total_amount ?? 0);
        if (!prev.last_order_date || (o.created_at ?? '') > prev.last_order_date)
          prev.last_order_date = o.created_at;
      } else {
        map.set(key, {
          id: key, name: o.customer_name ?? '', phone_number: o.customer_phone ?? '',
          total_orders: 1, total_spent: Number(o.total_amount ?? 0),
          last_order_date: o.created_at ?? null,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => (b.last_order_date ?? '').localeCompare(a.last_order_date ?? '')
    );
  }, [orders]);
  return { customers, isLoading };
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderInput) => insertOrder(data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderInput }) => patchOrder(id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeOrder(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useMarkOrderPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paidOrder(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['order_status'] }) =>
      updateOrderStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}
