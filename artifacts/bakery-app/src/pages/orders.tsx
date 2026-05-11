import { useState } from 'react';
import { useListOrders, useDeleteOrder, useMarkOrderPaid } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal, Edit, Trash, DollarSign, Download } from 'lucide-react';
import { Link } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderForm } from '@/components/orders/OrderForm';
import { useQueryClient } from '@tanstack/react-query';
import { getListOrdersQueryKey } from '@workspace/api-client-react';
import { toast } from 'sonner';
import type { Order } from '@workspace/api-client-react';
import { format } from 'date-fns';

export default function Orders() {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500/20 text-amber-500';
      case 'In Progress': return 'bg-blue-500/20 text-blue-500';
      case 'Ready': return 'bg-emerald-500/20 text-emerald-500';
      case 'Delivered': return 'bg-gray-500/20 text-gray-400';
      case 'Cancelled': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50';
      case 'Partial': return 'bg-amber-500/20 text-amber-500 border-amber-500/50';
      case 'Unpaid': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return '';
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      deleteOrder.mutate({ id }, {
        onSuccess: () => {
          toast.success('Order deleted');
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        }
      });
    }
  };

  const handleMarkPaid = (id: string) => {
    markPaid.mutate({ id }, {
      onSuccess: () => {
        toast.success('Marked as paid');
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      }
    });
  };

  const handleExport = () => {
    if (!orders?.length) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Customer,Phone,Item,Total,Balance,Status\n"
      + orders.map(o => `${o.id},${o.customer_name},${o.phone_number},${o.item_name},${o.total_amount},${o.remaining_balance},${o.order_status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold">Orders</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} className="border-border">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Link href="/orders/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Link>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers or phones..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading orders...</TableCell>
                  </TableRow>
                ) : orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders found.</TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{order.phone_number}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{order.item_name}</div>
                        <div className="text-xs text-muted-foreground">{order.category} &times; {order.quantity}</div>
                      </TableCell>
                      <TableCell>{format(new Date(order.delivery_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">${order.total_amount}</div>
                        <div className="text-xs text-muted-foreground">Bal: ${order.remaining_balance}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-0 ${getStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPaymentColor(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingOrder(order)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {order.payment_status !== 'Paid' && (
                              <DropdownMenuItem onClick={() => handleMarkPaid(order.id)}>
                                <DollarSign className="mr-2 h-4 w-4" /> Mark Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(order.id)}>
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
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
