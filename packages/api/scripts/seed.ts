import { createPool, withTransaction } from "../src/db";

const pool = createPool();

try {
  await withTransaction(pool, async (client) => {
    await client.query("truncate order_lines, orders, products, customers restart identity cascade");

    await client.query(`
      insert into customers (name, email) values
        ('Ada Lovelace', 'ada@example.com'),
        ('Grace Hopper', 'grace@example.com'),
        ('Alan Turing', 'alan@example.com'),
        ('Katherine Johnson', 'katherine@example.com'),
        ('Margaret Hamilton', 'margaret@example.com')`);

    await client.query(`
      insert into products (sku, name, price_cents) values
        ('MUG-01', 'Coffee mug', 1299),
        ('TEE-01', 'T-shirt', 2500),
        ('STK-01', 'Sticker pack', 499),
        ('NB-01', 'Notebook', 899),
        ('BTL-01', 'Water bottle', 1999)`);

    await client.query(`
      insert into orders (customer_id, status) values
        (1, 'paid'), (2, 'pending'), (3, 'shipped'), (4, 'paid'),
        (5, 'pending'), (1, 'shipped'), (2, 'canceled'), (3, 'paid'),
        (4, 'pending'), (5, 'paid'), (1, 'pending'), (2, 'shipped')`);

    await client.query(`
      insert into order_lines (order_id, product_id, quantity, unit_price_cents)
      select v.order_id, v.product_id, v.quantity, p.price_cents
      from (values
        (1, 1, 2), (1, 3, 1),
        (2, 2, 1),
        (3, 5, 1),
        (4, 4, 3),
        (5, 1, 1), (5, 2, 1),
        (6, 3, 4),
        (7, 5, 2),
        (8, 2, 2),
        (9, 4, 1),
        (10, 1, 1),
        (11, 3, 2),
        (12, 5, 1), (12, 4, 1)
      ) as v (order_id, product_id, quantity)
      join products p on p.id = v.product_id`);
  });
  console.log("seeded 5 customers, 5 products and 12 orders");
} finally {
  await pool.end();
}
