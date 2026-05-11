import { Router, type IRouter } from "express";
import { ilike, or, sql } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  ListCustomersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/customers", async (req, res): Promise<void> => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search } = parsed.data;

  const conditions = search
    ? or(
        ilike(ordersTable.customer_name, `%${search}%`),
        ilike(ordersTable.phone_number, `%${search}%`)
      )
    : undefined;

  const rows = await db
    .select({
      name: ordersTable.customer_name,
      phone_number: ordersTable.phone_number,
      total_orders: sql<number>`count(*)::int`,
      total_spent: sql<number>`sum(${ordersTable.total_amount})::float`,
      last_order_date: sql<string>`max(${ordersTable.created_at})::text`,
    })
    .from(ordersTable)
    .where(conditions)
    .groupBy(ordersTable.customer_name, ordersTable.phone_number)
    .orderBy(sql`count(*) desc`);

  const customers = rows.map((r, i) => ({
    id: `${r.name}-${r.phone_number}-${i}`,
    name: r.name,
    phone_number: r.phone_number,
    total_orders: r.total_orders,
    total_spent: Number(r.total_spent) || 0,
    last_order_date: r.last_order_date,
  }));

  res.json(ListCustomersResponse.parse(customers));
});

export default router;
