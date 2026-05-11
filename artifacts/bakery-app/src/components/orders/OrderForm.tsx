import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOrder, useUpdateOrder } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListOrdersQueryKey } from '@workspace/api-client-react';
import type { Order } from '@workspace/api-client-react';
import { useLanguage } from '@/contexts/LanguageContext';

const formSchema = z.object({
  customer_name: z.string().min(1, 'Name is required'),
  phone_number: z.string().min(1, 'Phone is required'),
  category: z.enum(['Cake', 'Pastry', 'Decoration Item']),
  item_name: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().min(1),
  total_amount: z.coerce.number().min(0),
  advance_payment: z.coerce.number().min(0),
  delivery_date: z.string().min(1, 'Pickup date is required'),
  order_status: z.enum(['Pending', 'In Progress', 'Ready', 'Delivered', 'Cancelled']).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  initialData?: Order;
  onSuccess?: () => void;
}

function getAutoPaymentStatus(total: number, advance: number) {
  const balance = total - advance;
  if (balance <= 0 && advance > 0) return { label: 'Paid', color: '#34d399', bg: 'rgba(52,211,153,0.15)' };
  if (advance > 0 && balance > 0) return { label: 'Partial', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  return { label: 'Unpaid', color: '#f87171', bg: 'rgba(248,113,113,0.15)' };
}

export function OrderForm({ initialData, onSuccess }: OrderFormProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      customer_name: initialData.customer_name,
      phone_number: initialData.phone_number,
      category: initialData.category as 'Cake' | 'Pastry' | 'Decoration Item',
      item_name: initialData.item_name,
      quantity: initialData.quantity,
      total_amount: initialData.total_amount,
      advance_payment: initialData.advance_payment,
      delivery_date: initialData.delivery_date.split('T')[0],
      order_status: initialData.order_status as any,
      notes: initialData.notes || '',
    } : {
      customer_name: '',
      phone_number: '',
      category: 'Cake',
      item_name: '',
      quantity: 1,
      total_amount: 0,
      advance_payment: 0,
      delivery_date: new Date().toISOString().split('T')[0],
      order_status: 'Pending',
      notes: '',
    },
  });

  const watchTotal = form.watch('total_amount');
  const watchAdvance = form.watch('advance_payment');
  const balance = Math.max(0, watchTotal - watchAdvance);
  const payStatus = getAutoPaymentStatus(watchTotal, watchAdvance);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateOrder.mutate({ id: initialData.id, data }, {
        onSuccess: () => {
          toast.success(t.orderUpdated);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          if (onSuccess) onSuccess();
        },
        onError: () => toast.error(t.failedUpdate),
      });
    } else {
      createOrder.mutate({ data }, {
        onSuccess: () => {
          toast.success(t.orderCreated);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          if (onSuccess) onSuccess();
          else setLocation('/orders');
        },
        onError: () => toast.error(t.failedCreate),
      });
    }
  };

  const isPending = createOrder.isPending || updateOrder.isPending;

  const inputClass = "h-11 rounded-xl bg-white/5 border-white/10 focus:border-primary text-sm";
  const selectClass = "h-11 rounded-xl bg-white/5 border-white/10 text-sm";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">{t.customerDetails}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.customerName}</FormLabel>
                <FormControl><Input placeholder="Raju Kumar" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          <FormField control={form.control} name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.phoneNumber}</FormLabel>
                <FormControl><Input placeholder="+91 9876543210" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
        </div>

        <div className="space-y-1 pt-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">{t.orderDetails}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.category}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cake">🎂 Cake</SelectItem>
                    <SelectItem value="Pastry">🥐 Pastry</SelectItem>
                    <SelectItem value="Decoration Item">🎀 Decoration Item</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          <FormField control={form.control} name="item_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.itemName}</FormLabel>
                <FormControl><Input placeholder="Chocolate Truffle Cake" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.quantity}</FormLabel>
                <FormControl><Input type="number" min="1" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          <FormField control={form.control} name="delivery_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.pickupDate}</FormLabel>
                <FormControl><Input type="date" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
        </div>

        <div className="space-y-1 pt-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">{t.paymentDelivery}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.totalAmount}</FormLabel>
                <FormControl><Input type="number" min="0" step="0.01" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          <FormField control={form.control} name="advance_payment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">{t.advancePayment}</FormLabel>
                <FormControl><Input type="number" min="0" step="0.01" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
        </div>

        <div className="flex items-center justify-between rounded-xl p-3 border border-white/8"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div>
            <div className="text-xs text-muted-foreground">{t.remainingBalance}</div>
            <div className="text-xl font-bold text-primary">₹{balance.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">{t.paymentStatus}</div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: payStatus.bg, color: payStatus.color }}>
              {payStatus.label}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground -mt-2">{t.autoPaymentNote}</p>

        <div className="space-y-1 pt-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">{t.statusNotes}</p>
        </div>

        <FormField control={form.control} name="order_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.orderStatus}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pending">{t.pending}</SelectItem>
                  <SelectItem value="In Progress">{t.inProgress}</SelectItem>
                  <SelectItem value="Ready">{t.ready}</SelectItem>
                  <SelectItem value="Delivered">{t.collected}</SelectItem>
                  <SelectItem value="Cancelled">{t.cancelled}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

        <FormField control={form.control} name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t.notes}</FormLabel>
              <FormControl>
                <Textarea placeholder={t.specialInstructions}
                  className="rounded-xl bg-white/5 border-white/10 focus:border-primary text-sm resize-none"
                  rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

        <div className="flex gap-3 pt-2">
          {!onSuccess && (
            <Button type="button" variant="outline"
              className="flex-1 h-11 rounded-xl border-white/15 text-sm"
              onClick={() => setLocation('/orders')}>
              {t.cancel}
            </Button>
          )}
          <Button type="submit" disabled={isPending}
            className="flex-1 h-11 rounded-xl text-sm font-semibold"
            style={{ background: '#d4a844', color: '#0f0d0b' }}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? t.updateOrder : t.createOrder}
          </Button>
        </div>
      </form>
    </Form>
  );
}
