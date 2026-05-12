import { Link, useLocation } from 'wouter';
import { Home, ShoppingBag, Users, BarChart3, Settings, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const tabs = [
  { href: '/',          icon: Home,       labelKey: 'dashboard'  as const },
  { href: '/orders',    icon: ShoppingBag, labelKey: 'orders'    as const },
  { href: '/customers', icon: Users,       labelKey: 'customers' as const },
  { href: '/analytics', icon: BarChart3,   labelKey: 'analytics' as const },
  { href: '/settings',  icon: Settings,    labelKey: 'settings'  as const },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const isActive = (href: string) =>
    href === '/' ? location === '/' : location.startsWith(href);

  return (
    <>
      {/* FAB — New Order */}
      <Link href="/orders/new">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          className="fixed bottom-[76px] right-4 z-50 w-14 h-14 rounded-full bg-primary flex items-center justify-center"
          style={{ boxShadow: '0 4px 28px rgba(212,168,68,0.5)' }}
          aria-label="New Order"
        >
          <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </motion.button>
      </Link>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-[68px] border-t bg-background/95 backdrop-blur-xl"
      >
        <div className="flex h-full items-center justify-around px-1 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link key={tab.href} href={tab.href}>
                <motion.div
                  whileTap={{ scale: 0.86 }}
                  className="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl cursor-pointer select-none"
                >
                  {/* Active pill */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-primary/12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={{ y: active ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </motion.div>

                  <span
                    className={`text-[10px] font-medium mt-0.5 leading-none transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {t[tab.labelKey]}
                  </span>

                  {active && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
