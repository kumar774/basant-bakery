import { OrderForm } from '@/components/orders/OrderForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function NewOrder() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-primary">New Order</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderForm />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
