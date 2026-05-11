import { useGetDashboardStats, useGetRecentActivity, useGetCategoryBreakdown } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingBag, CheckCircle, Clock, TrendingUp, Users, Calendar, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: categoryData, isLoading: catLoading } = useGetCategoryBreakdown();

  if (statsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { title: "Today's Orders", value: stats?.today_orders || 0, icon: ShoppingBag, color: 'text-blue-500' },
    { title: 'Pending Orders', value: stats?.pending_orders || 0, icon: Clock, color: 'text-amber-500' },
    { title: 'Deliveries Today', value: stats?.delivery_today || 0, icon: Truck, color: 'text-indigo-500' },
    { title: 'Completed', value: stats?.completed_orders || 0, icon: CheckCircle, color: 'text-emerald-500' },
    { title: 'Total Revenue', value: `$${stats?.total_revenue?.toFixed(2) || 0}`, icon: DollarSign, color: 'text-primary' },
    { title: 'This Month', value: `$${stats?.this_month_revenue?.toFixed(2) || 0}`, icon: TrendingUp, color: 'text-green-500' },
    { title: 'Pending Payments', value: stats?.pending_payments || 0, icon: Calendar, color: 'text-red-500' },
    { title: 'Total Customers', value: stats?.total_customers || 0, icon: Users, color: 'text-purple-500' },
  ];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-serif font-bold">Dashboard</h1>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {catLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {categoryData?.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-muted-foreground">{cat.category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex py-8 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {activity?.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-none">{item.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activity || activity.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
