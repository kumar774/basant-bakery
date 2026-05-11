import { OrderForm } from '@/components/orders/OrderForm';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewOrder() {
  const { t } = useLanguage();
  return (
    <div className="px-4 py-5 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-serif font-bold mb-5">{t.newOrder}</h1>
        <div className="rounded-2xl border border-white/8 p-4"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
          <OrderForm />
        </div>
      </motion.div>
    </div>
  );
}
