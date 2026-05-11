import { useState } from 'react';
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

const formSchema = z.object({
  customer_name: z.string().min(1, 'Name is required'),
  phone_number: z.string().min(1, 'Phone is required'),
  category: z.enum(['Cake', 'Pastry', 'Decoration Item']),
  item_name: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().min(1),
  total_amount: z.coerce.number().min(0),
  advance_payment: z.coerce.number().min(0),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  order_status: z.enum(['Pending', 'In Progress', 'Ready', 'Delivered', 'Cancelled']).optional(),
  payment_status: z.enum(['Unpaid', 'Partial', 'Paid']).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  initialData?: Order;
  onSuccess?: () => void;
}

export function OrderForm({ initialData, onSuccess }: OrderFormProps) {
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
      category: initialData.category as any,
      item_name: initialData.item_name,
      quantity: initialData.quantity,
      total_amount: initialData.total_amount,
      advance_payment: initialData.advance_payment,
      delivery_date: initialData.delivery_date.split('T')[0],
      order_status: initialData.order_status as any,
      payment_status: initialData.payment_status as any,
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
      payment_status: 'Unpaid',
      notes: '',
    },
  });

  const watchTotal = form.watch('total_amount');
  const watchAdvance = form.watch('advance_payment');
  const balance = Math.max(0, watchTotal - watchAdvance);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateOrder.mutate({ id: initialData.id, data }, {
        onSuccess: () => {
          toast.success('Order updated successfully');
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          if (onSuccess) onSuccess();
        },
        onError: () => toast.error('Failed to update order'),
      });
    } else {
      createOrder.mutate({ data }, {
        onSuccess: () => {
          toast.success('Order created successfully');
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          if (onSuccess) onSuccess();
          else setLocation('/orders');
        },
        onError: () => toast.error('Failed to create order'),
      });
    }
  };

  const isPending = createOrder.isPending || updateOrder.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer Details</h3>
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Details</h3>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cake">Cake</SelectItem>
                      <SelectItem value="Pastry">Pastry</SelectItem>
                      <SelectItem value="Decoration Item">Decoration Item</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Chocolate Truffle Cake" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment & Delivery</h3>
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Total Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="advance_payment"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Advance ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="pt-2">
              <span className="text-sm font-medium text-muted-foreground">Remaining Balance: </span>
              <span className="text-lg font-bold text-primary">${balance.toFixed(2)}</span>
            </div>
            
            <FormField
              control={form.control}
              name="delivery_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status & Notes</h3>
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="order_status"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Order Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Ready">Ready</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special instructions..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          {!onSuccess && (
            <Button type="button" variant="outline" onClick={() => setLocation('/orders')}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Order' : 'Create Order'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
