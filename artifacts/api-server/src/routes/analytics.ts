import { Router, type IRouter } from "express";
import { eq, sql, gte } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  GetRevenueChartQueryParams,
  GetDashboardStatsResponse,
  GetRevenueChartResponse,
  GetCategoryBreakdownResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/dashboard", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [statsRow] = await db
    .select({
      total_revenue: sql<number>`coalesce(sum(total_amount), 0)::float`,
      total_customers: sql<number>`count(distinct customer_name || phone_number)::int`,
      pending_payments: sql<number>`coalesce(sum(case when payment_status != 'Paid' then remaining_balance else 0 end), 0)::float`,
    })
    .from(ordersTable);

  const [todayRow] = await db
    .select({
      today_orders: sql<number>`count(*)::int`,
      delivery_today: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.delivery_date, today));

  const [pendingRow] = await db
    .select({
      pending_orders: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.order_status, "Pending"));

  const [completedRow] = await db
    .select({
      completed_orders: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.order_status, "Delivered"));

  const [monthRow] = await db
    .select({
      this_month_revenue: sql<number>`coalesce(sum(total_amount), 0)::float`,
    })
    .from(ordersTable)
    .where(gte(ordersTable.delivery_date, startOfMonth));

  const stats = {
    today_orders: todayRow?.today_orders ?? 0,
    delivery_today: todayRow?.delivery_today ?? 0,
    pending_orders: pendingRow?.pending_orders ?? 0,
    completed_orders: completedRow?.completed_orders ?? 0,
    total_revenue: Number(statsRow?.total_revenue) || 0,
    pending_payments: Number(statsRow?.pending_payments) || 0,
    total_customers: statsRow?.total_customers ?? 0,
    this_month_revenue: Number(monthRow?.this_month_revenue) || 0,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/analytics/revenue", async (req, res): Promise<void> => {
  const parsed = GetRevenueChartQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const days = parsed.data.days ?? 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromDateStr = fromDate.toISOString().split("T")[0];

  const rows = await db
    .select({
      date: sql<string>`date(created_at)::text`,
      revenue: sql<number>`coalesce(sum(total_amount), 0)::float`,
      orders: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(gte(ordersTable.delivery_date, fromDateStr))
    .groupBy(sql`date(created_at)`)
    .orderBy(sql`date(created_at)`);

  const data = rows.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue),
    orders: r.orders,
  }));

  res.json(GetRevenueChartResponse.parse(data));
});

router.get("/analytics/category-breakdown", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: ordersTable.category,
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(total_amount), 0)::float`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.category)
    .orderBy(sql`count(*) desc`);

  const data = rows.map((r) => ({
    category: r.category,
    count: r.count,
    revenue: Number(r.revenue),
  }));

  res.json(GetCategoryBreakdownResponse.parse(data));
});

router.get("/analytics/recent-activity", async (_req, res): Promise<void> => {
  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(sql`${ordersTable.created_at} desc`)
    .limit(10);

  const activities = recentOrders.map((o) => ({
    id: o.id,
    type: o.payment_status === "Paid" ? "payment" : "order",
    message:
      o.payment_status === "Paid"
        ? `${o.customer_name} completed payment for ${o.item_name}`
        : `New order: ${o.item_name} for ${o.customer_name}`,
    timestamp: o.created_at.toISOString(),
    customer_name: o.customer_name,
    amount: Number(o.total_amount),
  }));

  res.json(GetRecentActivityResponse.parse(activities));
});

export default router;
