import { useGetRevenueChart, useGetCategoryBreakdown } from '@workspace/api-client-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['#d4a844', '#8a5a19', '#f5c842'];

function ChartCard({ title, loading, children, delay = 0 }: {
  title: string; loading: boolean; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl border border-white/8 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
    >
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="h-52 px-2 pb-4">{children}</div>
      )}
    </motion.div>
  );
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(20,12,4,0.95)',
    borderColor: 'rgba(212,168,68,0.2)',
    borderRadius: '10px',
    fontSize: 11,
  },
};

export default function Analytics() {
  const { t } = useLanguage();
  const [days, setDays] = useState('30');
  const { data: revenueData, isLoading: revLoading } = useGetRevenueChart({ days: parseInt(days) });
  const { data: categoryData, isLoading: catLoading } = useGetCategoryBreakdown();

  return (
    <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">{t.analytics}</h1>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[120px] h-9 text-xs rounded-xl bg-white/5 border-white/10">
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
          <AreaChart data={revenueData || []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4a844" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#d4a844" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={(v) => `₹${v}`} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="revenue" stroke="#d4a844" strokeWidth={2}
              fillOpacity={1} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t.revenueByCategory} loading={catLoading} delay={0.12}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData || []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="category" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={(v) => `₹${v}`} />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="revenue" fill="#d4a844" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t.ordersByCategory} loading={catLoading} delay={0.2}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={categoryData || []} cx="50%" cy="45%" innerRadius={52} outerRadius={80}
              paddingAngle={4} dataKey="count" nameKey="category">
              {categoryData?.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
