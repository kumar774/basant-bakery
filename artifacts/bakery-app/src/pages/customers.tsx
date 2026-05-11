import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/hooks/useOrders';

export default function Customers() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const { customers, isLoading } = useCustomers();

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone_number.includes(search)
      )
    : customers;

  return (
    <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif font-bold">{t.customers}</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder={t.searchCustomers} value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm rounded-xl bg-white/5 border-white/10 focus:border-primary" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-muted-foreground text-sm py-12">
              {t.noCustomers}
            </motion.p>
          ) : (
            <div className="space-y-3">
              {filtered.map((c, i) => (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} layout
                  className="rounded-2xl border border-white/8 p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm"
                      style={{ background: 'rgba(212,168,68,0.15)', color: '#d4a844' }}>
                      {c.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.phone_number}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-primary">₹{c.total_spent.toFixed(0)}</div>
                      <div className="text-[11px] text-muted-foreground">{t.totalSpent}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/6 grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-base font-bold">{c.total_orders}</div>
                      <div className="text-[10px] text-muted-foreground">{t.totalOrders}</div>
                    </div>
                    <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-xs font-medium">
                        {c.last_order_date ? format(new Date(c.last_order_date), 'dd MMM yy') : '—'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{t.lastOrder}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
