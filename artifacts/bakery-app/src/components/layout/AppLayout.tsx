import { BottomNav } from './BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-white/8 backdrop-blur-xl"
        style={{ background: 'rgba(20,15,8,0.88)' }}
      >
        <h1 className="text-lg font-serif font-bold text-primary tracking-wide">{t.appName}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[140px]">{user?.email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">{t.signOut}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
