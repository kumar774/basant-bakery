import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategoryBreakdown, useRevenueChart } from '@/hooks/useOrders';
import { useChartTheme } from '@/hooks/useTheme';

const COLORS = ['#d4a844', '#8a5a19', '#f5c842', '#c084fc', '#34d399'];

function ChartCard({ title, loading, children, delay = 0 }: {
  title: string; loading: boolean; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
      </div>
      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="h-52 px-2 pb-4">{children}</div>
      )}
    </motion.div>
  );
}

export default function Analytics() {
  const { t } = useLanguage();
  const theme = useChartTheme();
  const [days, setDays] = useState(30);
  const { data: revenueData, isLoading: revLoading } = useRevenueChart(days);
  const { breakdown, isLoading: catLoading } = useCategoryBreakdown();

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
    <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">{t.analytics}</h1>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[120px] h-9 text-xs rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t.last7Days}</SelectItem>
            <SelectItem value="14">{t.last14Days}</SelectItem>
            <SelectItem value="30">{t.last30Days}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ChartCard title={t.revenueOverTime} loading={revLoading} delay={0.05}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#d4a844" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#d4a844" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis dataKey="date" stroke={theme.axis} fontSize={10} tickLine={false} axisLine={false}
              tick={{ fill: theme.axis }} />
            <YAxis stroke={theme.axis} fontSize={10} tickLine={false} axisLine={false}
              tick={{ fill: theme.axis }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip {...tooltipProps} />
            <Area type="monotone" dataKey="revenue" stroke="#d4a844" strokeWidth={2}
              fillOpacity={1} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t.revenueByCategory} loading={catLoading} delay={0.12}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={breakdown} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
            <XAxis dataKey="category" stroke={theme.axis} fontSize={9} tickLine={false} axisLine={false}
              tick={{ fill: theme.axis }} />
            <YAxis stroke={theme.axis} fontSize={10} tickLine={false} axisLine={false}
              tick={{ fill: theme.axis }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip {...tooltipProps} cursor={{ fill: theme.cursor }} />
            <Bar dataKey="revenue" fill="#d4a844" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t.ordersByCategory} loading={catLoading} delay={0.2}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={breakdown} cx="50%" cy="45%" innerRadius={50} outerRadius={78}
              paddingAngle={4} dataKey="count" nameKey="category">
              {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip {...tooltipProps} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(v) => <span style={{ color: theme.legend }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
