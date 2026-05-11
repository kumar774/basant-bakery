import { useAuth } from '@/contexts/AuthContext';
import { Redirect, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session && location !== '/login') {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
