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

export default function Login() {
  const { session } = useAuth();
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
    else toast.success('Signed up successfully!');
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0f0d0b] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ThreeBackground />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md p-8 backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#d4a844] mb-2">Sweet Crumbs</h1>
          <p className="text-gray-400">Premium Bakery Management</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border-gray-700 text-white focus:border-[#d4a844]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/50 border-gray-700 text-white focus:border-[#d4a844]"
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="flex-1 bg-[#d4a844] text-black hover:bg-[#f5c842]"
            >
              Sign In
            </Button>
            <Button 
              onClick={handleSignUp}
              disabled={loading}
              variant="outline"
              className="flex-1 border-[#d4a844] text-[#d4a844] hover:bg-[#d4a844]/10"
            >
              Sign Up
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
