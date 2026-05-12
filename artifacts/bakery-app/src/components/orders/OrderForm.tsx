import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useCreateOrder, useUpdateOrder } from '@/hooks/useOrders';
import type { Order } from '@/lib/supabaseOrders';
import { useLanguage } from '@/contexts/LanguageContext';

/* Simplified statuses: In Progress kept for backward-compat with existing data only */
const ORDER_STATUSES = ['Pending', 'In Progress', 'Ready', 'Delivered', 'Cancelled'] as const;

const formSchema = z.object({
  customer_name:    z.string().min(1, 'Name required'),
  customer_phone:   z.string().min(1, 'Phone required'),
  item_category:    z.enum(['Cake', 'Pastry', 'Decoration Item']),
  item_name:        z.string().min(1, 'Item name required'),
  quantity:         z.coerce.number().min(1),
  total_amount:     z.coerce.number().min(0),
  advance_payment:  z.coerce.number().min(0),
  pickup_date:      z.string().min(1, 'Pickup date required'),
  order_status:     z.enum(ORDER_STATUSES).default('Pending'),
  notes:            z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  initialData?: Order;
  onSuccess?: () => void;
}

function autoPayStatus(total: number, advance: number) {
  const rem = Math.max(0, total - advance);
  if (rem <= 0 && (advance > 0 || total === 0)) return { label: 'Paid',    color: '#059669', bg: '#10b98118' };
  if (advance > 0)                               return { label: 'Partial', color: '#d97706', bg: '#f59e0b18' };
  return                                                { label: 'Unpaid',  color: '#dc2626', bg: '#ef444418' };
}

export function OrderForm({ initialData, onSuccess }: OrderFormProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const isEditing = !!initialData;

  /* Normalise any legacy 'In Progress' when editing — keep the value intact */
  const defaultStatus = (initialData?.order_status ?? 'Pending') as FormValues['order_status'];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          customer_name:   initialData.customer_name,
          customer_phone:  initialData.customer_phone,
          item_category:   initialData.item_category,
          item_name:       initialData.item_name,
          quantity:        initialData.quantity,
          total_amount:    initialData.total_amount,
          advance_payment: initialData.advance_payment,
          pickup_date:     initialData.pickup_date,
          order_status:    defaultStatus,
          notes:           initialData.notes ?? '',
        }
      : {
          customer_name: '', customer_phone: '',
          item_category: 'Cake', item_name: '',
          quantity: 1, total_amount: 0, advance_payment: 0,
          pickup_date: new Date().toISOString().split('T')[0],
          order_status: 'Pending',
          notes: '',
        },
  });

  const total   = form.watch('total_amount');
  const advance = form.watch('advance_payment');
  const balance = Math.max(0, total - advance);
  const payStatus = autoPayStatus(total, advance);

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateOrder.mutate({ id: initialData.id, data: values }, {
        onSuccess: () => { toast.success(t.orderUpdated); onSuccess?.(); },
        onError:   (e) => toast.error(`${t.failedUpdate}: ${e.message}`),
      });
    } else {
      createOrder.mutate(values as Parameters<typeof createOrder.mutate>[0], {
        onSuccess: () => {
          toast.success(t.orderCreated);
          if (onSuccess) onSuccess(); else setLocation('/orders');
        },
        onError: (e) => toast.error(`${t.failedCreate}: ${e.message}`),
      });
    }
  };

  const isPending = createOrder.isPending || updateOrder.isPending;
  const isSuccess = createOrder.isSuccess || updateOrder.isSuccess;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Customer ────────────────────────────────────────────── */}
        <p className="text-xs font-semibold text-primary uppercase tracking-widest">{t.customerDetails}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="customer_name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.customerName}</FormLabel>
              <FormControl><Input placeholder="Raju Kumar" className="h-11 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="customer_phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.phoneNumber}</FormLabel>
              <FormControl><Input placeholder="+91 9876543210" className="h-11 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* ── Order ───────────────────────────────────────────────── */}
        <p className="text-xs font-semibold text-primary uppercase tracking-widest pt-1">{t.orderDetails}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="item_category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.category}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Cake">🎂 Cake</SelectItem>
                  <SelectItem value="Pastry">🥐 Pastry</SelectItem>
                  <SelectItem value="Decoration Item">🎀 Decoration Item</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="item_name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.itemName}</FormLabel>
              <FormControl><Input placeholder="Chocolate Truffle Cake" className="h-11 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.quantity}</FormLabel>
              <FormControl><Input type="number" min="1" className="h-11 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="pickup_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.pickupDate}</FormLabel>
              <FormControl><Input type="date" className="h-11 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* ── Payment ─────────────────────────────────────────────── */}
        <p className="text-xs font-semibold text-primary uppercase tracking-widest pt-1">{t.paymentDelivery}</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="total_amount" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.totalAmount}</FormLabel>
              <FormControl><Input type="number" min="0" step="1" className="h-11 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="advance_payment" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.advancePayment}</FormLabel>
              <FormControl><Input type="number" min="0" step="1" className="h-11 rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Auto-pay badge */}
        <div className="flex items-center justify-between rounded-xl p-3.5 border bg-muted/30">
          <div>
            <div className="text-[11px] text-muted-foreground mb-0.5">{t.remainingBalance}</div>
            <div className="text-xl font-bold text-primary">₹{balance.toFixed(0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground mb-1">{t.paymentStatus}</div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: payStatus.bg, color: payStatus.color }}>
              {payStatus.label}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-2">{t.autoPaymentNote}</p>

        {/* ── Status & Notes ───────────────────────────────────────── */}
        <p className="text-xs font-semibold text-primary uppercase tracking-widest pt-1">{t.statusNotes}</p>
        <FormField control={form.control} name="order_status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">{t.orderStatus}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Pending">⏳ {t.pending}</SelectItem>
                <SelectItem value="Ready">✅ {t.ready}</SelectItem>
                <SelectItem value="Delivered">📦 {t.collected}</SelectItem>
                <SelectItem value="Cancelled">❌ {t.cancelled}</SelectItem>
                {/* Show In Progress only when editing a legacy order that has it */}
                {isEditing && defaultStatus === 'In Progress' && (
                  <SelectItem value="In Progress">🔄 {t.inProgress}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">{t.notes}</FormLabel>
            <FormControl>
              <Textarea placeholder={t.specialInstructions}
                className="rounded-xl text-sm resize-none" rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex gap-3 pt-2">
          {!onSuccess && (
            <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl text-sm"
              onClick={() => setLocation('/orders')}>
              {t.cancel}
            </Button>
          )}
          <Button type="submit" disabled={isPending || isSuccess}
            className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all"
            style={{ background: isSuccess ? '#10b981' : '#d4a844', color: '#0f0d0b' }}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? t.updateOrder : t.createOrder}</>
            ) : isSuccess ? (
              <><CheckCircle2 className="mr-2 h-4 w-4" />Saved!</>
            ) : (
              isEditing ? t.updateOrder : t.createOrder
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
