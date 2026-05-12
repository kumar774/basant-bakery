import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Language } from '@/contexts/LanguageContext';

function SettingRow({ icon: Icon, title, desc, children }: {
  icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
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

      {/* Appearance + Language */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border bg-card px-4 shadow-sm">
        <SettingRow icon={theme === 'dark' ? Moon : Sun} title={t.darkMode} desc={t.darkModeDesc}>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
          />
        </SettingRow>
        <SettingRow icon={Globe} title={t.language} desc={t.languageDesc}>
          <div className="flex rounded-xl overflow-hidden border border-border bg-muted/40">
            {(['en', 'hi'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-3.5 py-1.5 text-xs font-semibold transition-all duration-200"
                style={{
                  background:  lang === l ? '#d4a844' : 'transparent',
                  color:       lang === l ? '#0f0d0b' : undefined,
                }}
              >
                <span className={lang !== l ? 'text-muted-foreground' : ''}>
                  {l === 'en' ? 'EN' : 'हि'}
                </span>
              </button>
            ))}
          </div>
        </SettingRow>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold bg-primary/15 text-primary shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? <User className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{t.signedInAs}</div>
            <div className="text-sm font-medium text-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-colors border border-destructive/40 text-destructive hover:bg-destructive/8"
        >
          <LogOut className="w-4 h-4" />
          {t.signOut}
        </button>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-[11px] text-muted-foreground pb-2"
      >
        {t.appName} &middot; v1.0
      </motion.div>
    </div>
  );
}
