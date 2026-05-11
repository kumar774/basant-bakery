import { useGetDashboardStats, useGetRecentActivity, useGetCategoryBreakdown } from '@workspace/api-client-react';
import { Loader2, DollarSign, ShoppingBag, CheckCircle, Clock, TrendingUp, Users, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['#d4a844', '#8a5a19', '#f5c842'];

function StatCard({ title, value, icon: Icon, color, delay }: {
  title: string; value: string | number; icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="rounded-2xl p-4 border border-white/8 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
      }}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 -translate-y-4 translate-x-4"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{title}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: categoryData, isLoading: catLoading } = useGetCategoryBreakdown();

  if (statsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { title: t.todayOrders, value: stats?.today_orders ?? 0, icon: ShoppingBag, color: '#60a5fa' },
    { title: t.pendingOrders, value: stats?.pending_orders ?? 0, icon: Clock, color: '#f59e0b' },
    { title: t.pickupToday, value: stats?.delivery_today ?? 0, icon: CalendarCheck, color: '#a78bfa' },
    { title: t.completed, value: stats?.completed_orders ?? 0, icon: CheckCircle, color: '#34d399' },
    { title: t.totalRevenue, value: `₹${stats?.total_revenue?.toFixed(0) ?? 0}`, icon: DollarSign, color: '#d4a844' },
    { title: t.thisMonth, value: `₹${stats?.this_month_revenue?.toFixed(0) ?? 0}`, icon: TrendingUp, color: '#4ade80' },
    { title: t.pendingPayments, value: `₹${stats?.pending_payments?.toFixed(0) ?? 0}`, icon: DollarSign, color: '#f87171' },
    { title: t.totalCustomers, value: stats?.total_customers ?? 0, icon: Users, color: '#c084fc' },
  ];

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">{t.dashboard}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <StatCard key={s.title} {...s} delay={i * 0.04} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
      >
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-primary">{t.salesByCategory}</h2>
        </div>
        {catLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center gap-4 px-4 pb-4">
            <div className="h-44 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData || []} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    paddingAngle={4} dataKey="count" nameKey="category">
                    {categoryData?.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(20,12,4,0.95)', borderColor: 'rgba(212,168,68,0.2)', borderRadius: '10px', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 shrink-0">
              {categoryData?.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div>
                    <div className="text-xs font-medium text-foreground">{cat.category}</div>
                    <div className="text-[10px] text-muted-foreground">{cat.count} orders</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.3 }}
        className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
      >
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-sm font-semibold text-primary">{t.recentActivity}</h2>
        </div>
        {activityLoading ? (
          <div className="flex py-8 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-3">
            {activity?.slice(0, 5).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug truncate">{item.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
              </motion.div>
            ))}
            {(!activity || activity.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">{t.noActivity}</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
