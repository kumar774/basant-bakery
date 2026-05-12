import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderForm } from "@/components/orders/OrderForm";
import { toast } from "sonner";
import type { Order } from "@/lib/supabaseOrders";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  DollarSign,
  Download,
  MessageCircle,
  AlertCircle,
  X,
  XCircle,
} from "lucide-react";
import {
  useFilteredOrders,
  useDeleteOrder,
  useMarkOrderPaid,
  useUpdateOrderStatus,
} from "@/hooks/useOrders";

/* ── Status colour map (semantic: works in dark & light) ─────────────── */
function statusStyle(s: string) {
  switch (s) {
    case "Pending":
      return { bg: "#f59e0b1a", text: "#d97706", border: "#f59e0b44" };
    case "In Progress":
      return { bg: "#3b82f61a", text: "#2563eb", border: "#3b82f644" };
    case "Ready":
      return { bg: "#10b9811a", text: "#059669", border: "#10b98144" };
    case "Collected":
      return { bg: "#8b5cf61a", text: "#7c3aed", border: "#8b5cf644" };
    case "Cancelled":
      return { bg: "#ef44441a", text: "#dc2626", border: "#ef444444" };
    default:
      return { bg: "#8888881a", text: "#666", border: "#88888844" };
  }
}

function payStyle(s: string) {
  switch (s) {
    case "Paid":
      return { bg: "#10b9811a", text: "#059669", border: "#10b98144" };
    case "Partial":
      return { bg: "#f59e0b1a", text: "#d97706", border: "#f59e0b44" };
    case "Unpaid":
      return { bg: "#ef44441a", text: "#dc2626", border: "#ef444444" };
    default:
      return { bg: "#8888881a", text: "#666", border: "#88888844" };
  }
}

function PayChip({
  label,
  style,
}: {
  label: string;
  style: ReturnType<typeof payStyle>;
}) {
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border leading-none"
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {label}
    </span>
  );
}

/* ── WhatsApp ────────────────────────────────────────────────────────── */
function whatsappShare(order: Order, shareText: (o: unknown) => string) {
  const pickup_date = (() => {
    try {
      return format(new Date(order.pickup_date), "dd MMM yyyy");
    } catch {
      return order.pickup_date;
    }
  })();
  const uiStatus = order.order_status;
  const text = shareText({
    customer_name: order.customer_name,
    phone_number: order.customer_phone,
    item_name: order.item_name,
    category: order.item_category,
    quantity: order.quantity,
    total_amount: order.total_amount,
    advance_payment: order.advance_payment,
    remaining_balance: order.remaining_payment,
    pickup_date,
    order_status: uiStatus,
    payment_status: order.payment_status,
    notes: order.notes,
  });
  window.open(
    `https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
    "_blank",
  );
}

/* ── Order card ─────────────────────────────────────────────────────── */
function OrderCard({
  order,
  onEdit,
  onDelete,
  onMarkPaid,
  onCancelOrder,
  onStatusChange,
  onShare,
}: {
  order: Order;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  onCancelOrder: () => void;
  onStatusChange: (status: Order["order_status"]) => void;
  onShare: () => void;
}) {
  const { t } = useLanguage();
  const ps = payStyle(order.payment_status);

  /* Map DB values to 4-step simplified UI */
  const SIMPLIFIED = ["Pending", "Ready", "Collected", "Cancelled"] as const;
  const selectValue: (typeof SIMPLIFIED)[number] = SIMPLIFIED.includes(
    order.order_status as (typeof SIMPLIFIED)[number],
  )
    ? (order.order_status as (typeof SIMPLIFIED)[number])
    : "Pending";

  const ss = statusStyle(selectValue);

  const statusLabel = (v: string) => {
    if (v === "Pending") return t.pending;
    if (v === "Ready") return t.ready;
     if (v === "Collected") return t.collected;
    if (v === "Cancelled") return t.cancelled;
    return v;
  };

  const formattedPickup = (() => {
    try {
      return format(new Date(order.pickup_date), "dd MMM yy");
    } catch {
      return "—";
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      layout
      className="rounded-2xl border bg-card shadow-sm overflow-hidden"
    >
      {/* Top row: name + actions */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-card-foreground truncate">
            {order.customer_name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {order.customer_phone}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onShare}
            aria-label="Share on WhatsApp"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "#25d36618", color: "#25d366" }}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="More actions"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[170px]">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="mr-2 h-3.5 w-3.5 text-primary" />
                {t.edit}
              </DropdownMenuItem>
              {order.payment_status !== "Paid" && (
                <DropdownMenuItem onClick={onMarkPaid}>
                  <DollarSign className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                  {t.markPaid}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {order.order_status !== "Cancelled" && (
                <DropdownMenuItem
                  onClick={onCancelOrder}
                  className="text-amber-600 focus:text-amber-600"
                >
                  <XCircle className="mr-2 h-3.5 w-3.5" />
                  {t.cancelOrder}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Item row */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg shrink-0">
          {order.item_category}
        </span>
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {order.item_name}
        </span>
        <span className="text-xs text-muted-foreground shrink-0 font-medium">
          ×{order.quantity}
        </span>
      </div>

      {/* Amount + pickup */}
      <div className="px-4 pb-3 flex items-end justify-between">
        <div>
          <div className="text-lg font-bold text-primary leading-none">
            ₹{Number(order.total_amount).toLocaleString("en-IN")}
          </div>
          {Number(order.remaining_payment) > 0 && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t.balance}: ₹
              {Number(order.remaining_payment).toLocaleString("en-IN")}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t.pickupDate}
          </div>
          <div className="text-xs font-semibold text-foreground mt-0.5">
            {formattedPickup}
          </div>
        </div>
      </div>

      {/* Status row: inline dropdown + payment chip */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <Select
          value={selectValue}
          onValueChange={(v) => onStatusChange(v as Order["order_status"])}
        >
          <SelectTrigger
            className="h-[26px] w-auto text-[11px] font-bold rounded-full border px-2.5 py-0 gap-1 focus:ring-0 focus:ring-offset-0 shrink-0"
            style={{
              background: ss.bg,
              color: ss.text,
              borderColor: ss.border,
            }}
          >
            <SelectValue>{statusLabel(selectValue)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">⏳ {t.pending}</SelectItem>
            <SelectItem value="Ready">✅ {t.ready}</SelectItem>
            <SelectItem value="Collected">📦 {t.collected}</SelectItem>
            <SelectItem value="Cancelled">❌ {t.cancelled}</SelectItem>
          </SelectContent>
        </Select>
        <PayChip label={order.payment_status} style={ps} />
      </div>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function Orders() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const {
    data: orders = [],
    isLoading,
    error,
  } = useFilteredOrders({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const deleteOrder = useDeleteOrder();
  const markPaid = useMarkOrderPaid();
  const updateStatus = useUpdateOrderStatus();

  const handleDelete = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    deleteOrder.mutate(id, {
      onSuccess: () => toast.success(t.orderDeleted),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleMarkPaid = (id: string) => {
    markPaid.mutate(id, {
      onSuccess: () => toast.success(t.markedPaid),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleCancelOrder = (id: string) => {
    if (!confirm(t.confirmCancel)) return;
    updateStatus.mutate(
      { id, status: "Cancelled" },
      {
        onSuccess: () => toast.success(t.markedCancelled),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleStatusChange = (id: string, status: Order["order_status"]) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () =>
          toast.success(
           status === "Ready"
                ? t.markedReady
                :status === "Collected"
            ? t.markedCollected
            :status === "Cancelled"
                  ? t.markedCancelled
                  : t.orderUpdated,
          ),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleExport = () => {
    if (!orders.length) {
      toast.info("No orders to export");
      return;
    }
    const rows = [
      "Customer,Phone,Item,Category,Qty,Total,Advance,Balance,Pickup,Status,Payment",
      ...orders.map((o) =>
        [
          `"${o.customer_name}"`,
          o.customer_phone,
          `"${o.item_name}"`,
          o.item_category,
          o.quantity,
          o.total_amount,
          o.advance_payment,
          o.remaining_payment,
          o.pickup_date,
          o.order_status,
          o.payment_status,
        ].join(","),
      ),
    ].join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(rows)}`;
    link.download = `basant-bakery-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">{t.orders}</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          className="h-8 text-xs gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          {t.export}
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t.searchOrders}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-[100px] h-10 text-xs rounded-xl">
            <SelectValue placeholder={t.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatuses}</SelectItem>
            <SelectItem value="Pending">{t.pending}</SelectItem>
            <SelectItem value="Ready">{t.ready}</SelectItem>
            <SelectItem value="Collected">{t.collected}</SelectItem>
            <SelectItem value="Cancelled">{t.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm border border-destructive/30 bg-destructive/8 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{(error as Error).message}</span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-14">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 gap-2 text-center"
            >
              <div className="text-4xl">🍞</div>
              <p className="text-muted-foreground text-sm">{t.noOrders}</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onEdit={() => setEditingOrder(order)}
                  onDelete={() => handleDelete(order.id)}
                  onMarkPaid={() => handleMarkPaid(order.id)}
                  onCancelOrder={() => handleCancelOrder(order.id)}
                  onStatusChange={(s) => handleStatusChange(order.id, s)}
                  onShare={() => whatsappShare(order, t.orderShareText)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
      >
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{t.editOrder}</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <OrderForm
              initialData={editingOrder}
              onSuccess={() => setEditingOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
