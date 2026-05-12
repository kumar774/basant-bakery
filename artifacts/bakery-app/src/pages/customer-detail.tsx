import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, ShoppingBag, IndianRupee, Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrdersByCustomer } from '@/hooks/useOrders';
import { useLocation } from 'wouter';
import type { Order } from '@/lib/supabaseOrders';

function statusStyle(s: string) {
  switch (s) {
    case 'Pending':   return { bg: '#f59e0b1a', text: '#d97706', border: '#f59e0b44' };
    case 'Ready':     return { bg: '#10b9811a', text: '#059669', border: '#10b98144' };
    case 'Delivered': return { bg: '#8b5cf61a', text: '#7c3aed', border: '#8b5cf644' };
    case 'Cancelled': return { bg: '#ef44441a', text: '#dc2626', border: '#ef444444' };
    default:          return { bg: '#8888881a', text: '#666',    border: '#88888844' };
  }
}

function payStyle(s: string) {
  switch (s) {
    case 'Paid':    return { bg: '#10b9811a', text: '#059669', border: '#10b98144' };
    case 'Partial': return { bg: '#f59e0b1a', text: '#d97706', border: '#f59e0b44' };
    case 'Unpaid':  return { bg: '#ef44441a', text: '#dc2626', border: '#ef444444' };
    default:        return { bg: '#8888881a', text: '#666',    border: '#88888844' };
  }
}

function Chip({ label, style }: { label: string; style: { bg: string; text: string; border: string } }) {
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border leading-none"
      style={{ background: style.bg, color: style.text, borderColor: style.border }}>
      {label}
    </span>
  );
}

function StatBox({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-lg font-bold text-foreground leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

interface CustomerDetailProps {
  phone: string;
}

export default function CustomerDetail({ phone }: CustomerDetailProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { orders, isLoading } = useOrdersByCustomer(phone);

  /* Derive customer name from orders */
  const customerName = orders[0]?.customer_name ?? phone;

  /* Stats */
  const totalSpent    = orders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
  const totalBalance  = orders.reduce((s, o) => s + Number(o.remaining_payment ?? 0), 0);

  const displayStatus = (o: Order) =>
    o.order_status === 'Delivered' ? t.collected
    : o.order_status === 'In Progress' ? t.inProgress
    : o.order_status === 'Pending' ? t.pending
    : o.order_status === 'Ready' ? t.ready
    : t.cancelled;

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation('/customers')}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/60 hover:bg-muted transition-colors active:scale-95 shrink-0">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-serif font-bold text-foreground truncate">{customerName}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Phone className="w-3 h-3" />{phone}
          </div>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2.5">
          <StatBox icon={ShoppingBag}   label={t.totalOrders} value={String(orders.length)} color="#60a5fa" />
          <StatBox icon={IndianRupee}   label={t.totalSpent}  value={`₹${totalSpent.toLocaleString('en-IN')}`} color="#d4a844" />
          <StatBox icon={Clock}         label={t.totalBalance} value={`₹${totalBalance.toLocaleString('en-IN')}`} color={totalBalance > 0 ? '#ef4444' : '#10b981'} />
        </motion.div>
      )}

      {/* Order history heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-widest">
          {t.orderHistory}
        </h2>
        {!isLoading && (
          <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
        )}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
          <div className="text-4xl">🍞</div>
          <p className="text-muted-foreground text-sm">{t.noOrderHistory}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const ss = statusStyle(order.order_status);
            const ps = payStyle(order.payment_status);
            const orderDate = (() => {
              try { return format(new Date(order.created_at), 'dd MMM yyyy'); }
              catch { return '—'; }
            })();
            const pickupDate = (() => {
              try { return format(new Date(order.pickup_date), 'dd MMM yy'); }
              catch { return '—'; }
            })();

            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden">

                {/* Order header: item + amount */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-card-foreground truncate">{order.item_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                        {order.item_category}
                      </span>
                      <span className="text-[11px] text-muted-foreground">×{order.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-primary">
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </div>
                    {Number(order.remaining_payment) > 0 && (
                      <div className="text-[11px] text-muted-foreground">
                        {t.balance}: ₹{Number(order.remaining_payment).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="px-4 pb-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Ordered: {orderDate}</span>
                  <span className="text-border">·</span>
                  <span>{t.pickupDate}: {pickupDate}</span>
                </div>

                {/* Status chips */}
                <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                  <Chip label={displayStatus(order)} style={ss} />
                  <Chip label={order.payment_status} style={ps} />
                  {order.notes && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                      📝 {order.notes}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
