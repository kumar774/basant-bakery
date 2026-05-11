import { pgTable, text, uuid, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customer_name: text("customer_name").notNull(),
  phone_number: text("phone_number").notNull(),
  category: text("category").notNull(),
  item_name: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  advance_payment: numeric("advance_payment", { precision: 10, scale: 2 }).notNull().default("0"),
  remaining_balance: numeric("remaining_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  delivery_date: text("delivery_date").notNull(),
  order_status: text("order_status").notNull().default("Pending"),
  payment_status: text("payment_status").notNull().default("Unpaid"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
