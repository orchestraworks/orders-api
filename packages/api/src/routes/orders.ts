import { CreateOrder, IdParam, PageQuery, UpdateOrder, formatPrice } from "@orders/core";
import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { withTransaction } from "../db";
import { HttpError, notFound } from "../errors";

type OrderSummaryRow = {
  id: number;
  customer_id: number;
  status: string;
  created_at: Date;
  line_count: number;
  total: string;
};

type OrderLineRow = {
  product_id: number;
  sku: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
};

const ORDER_SUMMARY = `
  select o.id, o.customer_id, o.status, o.created_at,
         count(l.id)::int as line_count,
         round(coalesce(sum(l.quantity * l.unit_price_cents), 0) / 100, 2) as total
  from orders o
  left join order_lines l on l.order_id = o.id`;

const toSummary = (row: OrderSummaryRow) => ({
  id: row.id,
  customerId: row.customer_id,
  status: row.status,
  createdAt: row.created_at,
  lineCount: row.line_count,
  total: row.total,
});

async function readOrder(db: pg.Pool | pg.PoolClient, id: number) {
  const { rows } = await db.query<OrderSummaryRow>(`${ORDER_SUMMARY} where o.id = $1 group by o.id`, [id]);
  if (rows.length === 0) {
    return undefined;
  }
  const lines = await db.query<OrderLineRow>(
    `select l.product_id, p.sku, p.name, l.quantity, l.unit_price_cents
     from order_lines l
     join products p on p.id = l.product_id
     where l.order_id = $1
     order by l.id`,
    [id],
  );
  return {
    ...toSummary(rows[0]),
    lines: lines.rows.map((line) => ({
      productId: line.product_id,
      sku: line.sku,
      name: line.name,
      quantity: line.quantity,
      unitPrice: formatPrice(line.unit_price_cents),
    })),
  };
}

export function orderRoutes(app: FastifyInstance, pool: pg.Pool) {
  app.post("/orders", async (request, reply) => {
    const input = CreateOrder.parse(request.body);

    const order = await withTransaction(pool, async (client) => {
      const customer = await client.query("select id from customers where id = $1", [input.customerId]);
      if (customer.rowCount === 0) {
        throw new HttpError(422, `Unknown customer ${input.customerId}`);
      }

      const productIds = [...new Set(input.lines.map((line) => line.productId))];
      const products = await client.query<{ id: number; price_cents: number }>(
        "select id, price_cents from products where id = any($1::int[])",
        [productIds],
      );
      const prices = new Map(products.rows.map((product) => [product.id, product.price_cents]));
      const missing = productIds.filter((id) => !prices.has(id));
      if (missing.length > 0) {
        throw new HttpError(422, `Unknown product ${missing.join(", ")}`);
      }

      const created = await client.query<{ id: number }>(
        "insert into orders (customer_id) values ($1) returning id",
        [input.customerId],
      );
      const orderId = created.rows[0].id;
      for (const line of input.lines) {
        await client.query(
          "insert into order_lines (order_id, product_id, quantity, unit_price_cents) values ($1, $2, $3, $4)",
          [orderId, line.productId, line.quantity, prices.get(line.productId)],
        );
      }
      return readOrder(client, orderId);
    });

    return reply.code(201).send(order);
  });

  app.get("/orders", async (request) => {
    const { page, pageSize } = PageQuery.parse(request.query);
    const { rows } = await pool.query<OrderSummaryRow>(
      `${ORDER_SUMMARY}
       group by o.id
       order by o.created_at desc, o.id desc
       limit $1 offset $2`,
      [pageSize, (page - 1) * pageSize],
    );
    return { page, pageSize, orders: rows.map(toSummary) };
  });

  app.get("/orders/:id", async (request) => {
    const { id } = IdParam.parse(request.params);
    const order = await readOrder(pool, id);
    if (!order) {
      throw notFound("Order");
    }
    return order;
  });

  app.patch("/orders/:id", async (request) => {
    const { id } = IdParam.parse(request.params);
    const { status } = UpdateOrder.parse(request.body);
    const updated = await pool.query("update orders set status = $1 where id = $2", [status, id]);
    if (updated.rowCount === 0) {
      throw notFound("Order");
    }
    return readOrder(pool, id);
  });
}
