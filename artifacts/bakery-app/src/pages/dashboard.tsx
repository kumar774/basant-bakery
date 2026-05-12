import {
  Loader2, DollarSign, ShoppingBag, CheckCircle, Clock,
  TrendingUp, Users, CalendarCheck, AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats, useRecentActivity, useCategoryBreakdown } from '@/hooks/useOrders';
import { useChartTheme } from '@/hooks/useTheme';

const COLORS = ['#d4a844', '#8a5a19', '#f5c842', '#c084fc', '#34d399'];

function StatCard({ title, value, icon: Icon, color, delay }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className="rounded-2xl p-4 border bg-card shadow-sm relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.07] -translate-y-4 translate-x-4"
        style={{ background: color }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-card-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{title}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const theme = useChartTheme();
  const { stats, isLoading, error } = useDashboardStats();
  const { activity, isLoading: actLoading } = useRecentActivity();
  const { breakdown, isLoading: catLoading } = useCategoryBreakdown();

  const statCards = [
    { title: t.todayOrders,     value: stats.today_orders,                          icon: ShoppingBag,   color: '#60a5fa' },
    { title: t.pendingOrders,   value: stats.pending_orders,                        icon: Clock,         color: '#f59e0b' },
    { title: t.pickupToday,     value: stats.pickup_today,                          icon: CalendarCheck, color: '#a78bfa' },
    { title: t.completed,       value: stats.completed_orders,                      icon: CheckCircle,   color: '#34d399' },
    { title: t.totalRevenue,    value: `₹${stats.total_revenue.toLocaleString('en-IN')}`,       icon: DollarSign,    color: '#d4a844' },
    { title: t.thisMonth,       value: `₹${stats.this_month_revenue.toLocaleString('en-IN')}`,  icon: TrendingUp,    color: '#4ade80' },
    { title: t.pendingPayments, value: `₹${stats.pending_payments.toLocaleString('en-IN')}`,    icon: DollarSign,    color: '#f87171' },
    { title: t.totalCustomers,  value: stats.total_customers,                       icon: Users,         color: '#c084fc' },
  ];

  const tooltipProps = {
    contentStyle: {
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      borderRadius: '10px',
      fontSize: 11,
      color: theme.tooltipColor,
    },
  };

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold">{t.dashboard}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm border border-destructive/30 bg-destructive/8 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{(error as Error).message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.04} />)}
        </div>
      )}

      {/* Category pie */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-primary">{t.salesByCategory}</h2>
        </div>
        {catLoading ? (
          <div className="flex h-44 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center gap-4 px-4 pb-4">
            <div className="h-44 flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} cx="50%" cy="50%" innerRadius={46} outerRadius={70}
                    paddingAngle={4} dataKey="count" nameKey="category">
                    {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 shrink-0 min-w-[110px]">
              {breakdown.length === 0
                ? <p className="text-xs text-muted-foreground">No data yet</p>
                : breakdown.map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }} />
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

      {/* Recent activity */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
        className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="text-sm font-semibold text-primary">{t.recentActivity}</h2>
          {!actLoading && (
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60 flex items-center gap-1">
              Live
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          )}
        </div>
        {actLoading ? (
          <div className="flex py-8 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-3">
            {activity.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">{t.noActivity}</p>
              : activity.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.46 + i * 0.04 }}
                  className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-[7px] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{item.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
