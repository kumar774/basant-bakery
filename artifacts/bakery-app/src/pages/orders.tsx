import { useState } from 'react';
import { useListOrders, useDeleteOrder, useMarkOrderPaid } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MoreVertical, Edit, Trash, DollarSign, Download, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderForm } from '@/components/orders/OrderForm';
import { useQueryClient } from '@tanstack/react-query';
import { getListOrdersQueryKey } from '@workspace/api-client-react';
import { toast } from 'sonner';
import type { Order } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
    case 'In Progress': return { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', border: 'rgba(96,165,250,0.3)' };
    case 'Ready': return { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' };
    case 'Delivered': return { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', border: 'rgba(167,139,250,0.3)' };
    case 'Cancelled': return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' };
    default: return { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' };
  }
}

function getPaymentColor(status: string) {
  switch (status) {
    case 'Paid': return { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)' };
    case 'Partial': return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
    case 'Unpaid': return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', border: 'rgba(248,113,113,0.3)' };
    default: return { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' };
  }
}

function ColorBadge({ label, colors }: { label: string; colors: ReturnType<typeof getStatusColor> }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
      {label}
    </span>
  );
}

function shareOnWhatsApp(order: Order, shareText: (o: Parameters<typeof shareText>[0]) => string) {
  const pickup_date = (() => {
    try { return format(new Date(order.delivery_date), 'dd MMM yyyy'); } catch { return order.delivery_date; }
  })();
  const text = shareText({
    customer_name: order.customer_name,
    phone_number: order.phone_number,
    item_name: order.item_name,
    category: order.category,
    quantity: order.quantity,
    total_amount: order.total_amount,
    advance_payment: order.advance_payment,
    remaining_balance: order.remaining_balance,
    pickup_date,
    order_status: order.order_status,
    payment_status: order.payment_status,
    notes: order.notes,
  });
  window.open(`https://wa.me/${order.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
}

function OrderCard({ order, onEdit, onDelete, onMarkPaid, onShare }: {
  order: Order;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  onShare: () => void;
}) {
  const { t } = useLanguage();
  const sc = getStatusColor(order.order_status);
  const pc = getPaymentColor(order.payment_status);
  const pickupLabel = order.order_status === 'Delivered' ? t.collected : order.order_status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      layout
      className="rounded-2xl border border-white/8 p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-foreground text-sm truncate">{order.customer_name}</div>
          <div className="text-xs text-muted-foreground">{order.phone_number}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onShare}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366' }}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={onEdit} className="text-sm">
                <Edit className="mr-2 h-3.5 w-3.5" />{t.edit}
              </DropdownMenuItem>
              {order.payment_status !== 'Paid' && (
                <DropdownMenuItem onClick={onMarkPaid} className="text-sm">
                  <DollarSign className="mr-2 h-3.5 w-3.5" />{t.markPaid}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-sm text-destructive focus:text-destructive">
                <Trash className="mr-2 h-3.5 w-3.5" />{t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-lg">{order.category}</span>
        <span className="text-sm text-foreground font-medium truncate flex-1">{order.item_name}</span>
        <span className="text-xs text-muted-foreground shrink-0">×{order.quantity}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-bold text-primary">₹{order.total_amount}</div>
          {order.remaining_balance > 0 && (
            <div className="text-[11px] text-muted-foreground">Bal: ₹{order.remaining_balance}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">{t.pickupDate}</div>
          <div className="text-xs font-medium text-foreground">
            {(() => { try { return format(new Date(order.delivery_date), 'dd MMM yy'); } catch { return '-'; } })()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ColorBadge label={pickupLabel} colors={sc} />
        <ColorBadge label={order.payment_status} colors={pc} />
      </div>
    </motion.div>
  );
}

export default function Orders() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useListOrders({
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
  });

  const deleteOrder = useDeleteOrder();
  const markPaid = useMarkOrderPaid();
  const queryClient = useQueryClient();

  const handleDelete = (id: string) => {
    if (confirm(t.confirmDelete)) {
      deleteOrder.mutate({ id }, {
        onSuccess: () => {
          toast.success(t.orderDeleted);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        },
      });
    }
  };

  const handleMarkPaid = (id: string) => {
    markPaid.mutate({ id }, {
      onSuccess: () => {
        toast.success(t.markedPaid);
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
    });
  };

  const handleExport = () => {
    if (!orders?.length) return;
    const csv = "data:text/csv;charset=utf-8,"
      + "Customer,Phone,Item,Category,Qty,Total,Advance,Balance,Pickup,Status,Payment\n"
      + orders.map(o =>
        `${o.customer_name},${o.phone_number},${o.item_name},${o.category},${o.quantity},${o.total_amount},${o.advance_payment},${o.remaining_balance},${o.delivery_date},${o.order_status},${o.payment_status}`
      ).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'basant-bakery-orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">{t.orders}</h1>
        <Button size="sm" variant="outline" onClick={handleExport}
          className="h-8 text-xs border-white/15 hover:bg-white/8">
          <Download className="mr-1.5 h-3.5 w-3.5" />{t.export}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t.searchOrders}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm rounded-xl bg-white/5 border-white/10 focus:border-primary"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[110px] h-10 text-xs rounded-xl bg-white/5 border-white/10">
            <SelectValue placeholder={t.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatuses}</SelectItem>
            <SelectItem value="Pending">{t.pending}</SelectItem>
            <SelectItem value="In Progress">{t.inProgress}</SelectItem>
            <SelectItem value="Ready">{t.ready}</SelectItem>
            <SelectItem value="Delivered">{t.collected}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {orders?.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground text-sm py-12"
            >
              {t.noOrders}
            </motion.p>
          ) : (
            <div className="space-y-3">
              {orders?.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onEdit={() => setEditingOrder(order)}
                  onDelete={() => handleDelete(order.id)}
                  onMarkPaid={() => handleMarkPaid(order.id)}
                  onShare={() => shareOnWhatsApp(order, t.orderShareText)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{t.editOrder}</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <OrderForm initialData={editingOrder} onSuccess={() => setEditingOrder(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
