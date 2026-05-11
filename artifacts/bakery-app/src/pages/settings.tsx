import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Moon, Sun, Globe, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Language } from '@/contexts/LanguageContext';

function SettingRow({ icon: Icon, title, desc, children }: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/6 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(212,168,68,0.12)' }}>
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { t, lang, setLang } = useLanguage();
  const { user, signOut } = useAuth();

  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-serif font-bold">{t.settings}</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/8 px-4"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
      >
        <SettingRow icon={theme === 'dark' ? Moon : Sun} title={t.darkMode} desc={t.darkModeDesc}>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
          />
        </SettingRow>

        <SettingRow icon={Globe} title={t.language} desc={t.languageDesc}>
          <div className="flex rounded-xl overflow-hidden border border-white/15"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {(['en', 'hi'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                style={{
                  background: lang === l ? '#d4a844' : 'transparent',
                  color: lang === l ? '#0f0d0b' : 'rgba(255,255,255,0.5)',
                }}
              >
                {l === 'en' ? 'EN' : 'हि'}
              </button>
            ))}
          </div>
        </SettingRow>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border border-white/8 p-4"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ background: 'rgba(212,168,68,0.2)', color: '#d4a844' }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{user?.email}</div>
            <div className="text-xs text-muted-foreground">Basant Bakery</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-colors border border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          {t.signOut}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-[11px] text-muted-foreground pb-2"
      >
        {t.appName} • v1.0
      </motion.div>
    </div>
  );
}
