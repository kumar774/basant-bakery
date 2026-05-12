import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import NewOrder from "@/pages/orders-new";
import Customers from "@/pages/customers";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Page({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute><AppLayout><Page><Dashboard /></Page></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/orders/new">
        <ProtectedRoute><AppLayout><Page><NewOrder /></Page></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute><AppLayout><Page><Orders /></Page></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute><AppLayout><Page><Customers /></Page></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute><AppLayout><Page><Analytics /></Page></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><AppLayout><Page><Settings /></Page></AppLayout></ProtectedRoute>
      </Route>
      <Route>
        <ProtectedRoute><AppLayout><Page><NotFound /></Page></AppLayout></ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AuthProvider>
                <Router />
              </AuthProvider>
            </WouterRouter>
          </LanguageProvider>
          <Toaster position="top-center" theme="dark" richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
