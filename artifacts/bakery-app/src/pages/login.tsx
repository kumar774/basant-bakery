import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ThreeBackground } from '@/components/ThreeBackground';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Login() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Redirect to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) toast.error(error.message);
    else toast.success('Account created! You can now sign in.');
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0f0d0b] flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <ThreeBackground />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div
          className="rounded-3xl p-8 border border-white/10"
          style={{
            background: 'rgba(15,10,5,0.75)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,68,0.08)',
          }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(212,168,68,0.15)', border: '1px solid rgba(212,168,68,0.3)' }}
            >
              🍞
            </motion.div>
            <h1 className="text-3xl font-serif font-bold text-[#d4a844] tracking-wide">{t.appName}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.appTagline}</p>
          </div>

          <form className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-gray-400 text-sm">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-[#d4a844] h-12 rounded-xl text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-400 text-sm">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-[#d4a844] h-12 rounded-xl text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm font-semibold"
                style={{ background: '#d4a844', color: '#0f0d0b' }}
              >
                {loading ? '...' : t.signIn}
              </Button>
              <Button
                onClick={handleSignUp}
                disabled={loading}
                variant="outline"
                className="w-full h-12 rounded-xl text-sm border-white/15 text-[#d4a844] hover:bg-white/5"
              >
                {t.signUp}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
