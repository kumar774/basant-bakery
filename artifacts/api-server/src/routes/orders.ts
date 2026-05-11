import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, or, sql } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  ListOrdersResponse,
  CreateOrderBody,
  GetOrderParams,
  GetOrderResponse,
  UpdateOrderParams,
  UpdateOrderBody,
  UpdateOrderResponse,
  DeleteOrderParams,
  MarkOrderPaidParams,
  MarkOrderPaidResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, payment_status, search, date_from, date_to } = parsed.data;
  const conditions = [];

  if (status) {
    conditions.push(eq(ordersTable.order_status, status));
  }
  if (payment_status) {
    conditions.push(eq(ordersTable.payment_status, payment_status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(ordersTable.customer_name, `%${search}%`),
        ilike(ordersTable.phone_number, `%${search}%`),
        ilike(ordersTable.item_name, `%${search}%`)
      )
    );
  }
  if (date_from) {
    conditions.push(gte(ordersTable.delivery_date, date_from));
  }
  if (date_to) {
    conditions.push(lte(ordersTable.delivery_date, date_to));
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${ordersTable.created_at} desc`);

  const mapped = orders.map((o) => ({
    ...o,
    total_amount: Number(o.total_amount),
    advance_payment: Number(o.advance_payment),
    remaining_balance: Number(o.remaining_balance),
    created_at: o.created_at.toISOString(),
    updated_at: o.updated_at.toISOString(),
  }));

  res.json(ListOrdersResponse.parse(mapped));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { total_amount, advance_payment, ...rest } = parsed.data;
  const remaining_balance = (total_amount ?? 0) - (advance_payment ?? 0);

  const [order] = await db
    .insert(ordersTable)
    .values({
      ...rest,
      total_amount: String(total_amount),
      advance_payment: String(advance_payment ?? 0),
      remaining_balance: String(remaining_balance),
      order_status: rest.order_status ?? "Pending",
      payment_status: remaining_balance <= 0 ? "Paid" : (advance_payment ?? 0) > 0 ? "Partial" : "Unpaid",
    })
    .returning();

  res.status(201).json(
    GetOrderResponse.parse({
      ...order,
      total_amount: Number(order.total_amount),
      advance_payment: Number(order.advance_payment),
      remaining_balance: Number(order.remaining_balance),
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
    })
  );
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(
    GetOrderResponse.parse({
      ...order,
      total_amount: Number(order.total_amount),
      advance_payment: Number(order.advance_payment),
      remaining_balance: Number(order.remaining_balance),
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
    })
  );
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.total_amount !== undefined) {
    updateData.total_amount = String(parsed.data.total_amount);
  }
  if (parsed.data.advance_payment !== undefined) {
    updateData.advance_payment = String(parsed.data.advance_payment);
  }

  if (parsed.data.total_amount !== undefined || parsed.data.advance_payment !== undefined) {
    const [existing] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const total = parsed.data.total_amount ?? Number(existing.total_amount);
    const advance = parsed.data.advance_payment ?? Number(existing.advance_payment);
    const remaining = total - advance;

    updateData.remaining_balance = String(remaining);
    if (!parsed.data.payment_status) {
      updateData.payment_status = remaining <= 0 ? "Paid" : advance > 0 ? "Partial" : "Unpaid";
    }
  }

  const [order] = await db
    .update(ordersTable)
    .set(updateData as Partial<typeof ordersTable.$inferInsert>)
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(
    UpdateOrderResponse.parse({
      ...order,
      total_amount: Number(order.total_amount),
      advance_payment: Number(order.advance_payment),
      remaining_balance: Number(order.remaining_balance),
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
    })
  );
});

router.delete("/orders/:id", async (req, res): Promise<void> => {
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .delete(ordersTable)
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/orders/:id/mark-paid", async (req, res): Promise<void> => {
  const params = MarkOrderPaidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({
      payment_status: "Paid",
      remaining_balance: "0",
      advance_payment: existing.total_amount,
    })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  res.json(
    MarkOrderPaidResponse.parse({
      ...order,
      total_amount: Number(order.total_amount),
      advance_payment: Number(order.advance_payment),
      remaining_balance: Number(order.remaining_balance),
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
    })
  );
});

export default router;
