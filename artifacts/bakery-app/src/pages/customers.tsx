import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers } from '@/hooks/useOrders';
import { useLocation } from 'wouter';

export default function Customers() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [, setLocation] = useLocation();
  const { customers, isLoading } = useCustomers();

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone_number.includes(search)
      )
    : customers;

  const handleCustomerTap = (phone: string) => {
    setLocation(`/customers/${encodeURIComponent(phone)}`);
  };

  return (
    <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif font-bold">{t.customers}</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input placeholder={t.searchCustomers} value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm rounded-xl" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 gap-2 text-center">
              <div className="text-4xl">👤</div>
              <p className="text-muted-foreground text-sm">{t.noCustomers}</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} layout
                  onClick={() => handleCustomerTap(c.phone_number)}
                  className="w-full text-left rounded-2xl border bg-card shadow-sm p-4 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm bg-primary/15 text-primary">
                      {c.name[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-card-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.phone_number}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-bold text-primary">
                          ₹{c.total_spent.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t.totalSpent}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2.5 text-center bg-muted/40">
                      <div className="text-base font-bold text-foreground">{c.total_orders}</div>
                      <div className="text-[10px] text-muted-foreground">{t.totalOrders}</div>
                    </div>
                    <div className="rounded-xl p-2.5 text-center bg-muted/40">
                      <div className="text-xs font-semibold text-foreground">
                        {c.last_order_date
                          ? format(new Date(c.last_order_date), 'dd MMM yy')
                          : '—'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{t.lastOrder}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
