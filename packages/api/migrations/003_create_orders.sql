create type order_status as enum ('pending', 'paid', 'shipped', 'canceled');

create table orders (
  id integer generated always as identity primary key,
  customer_id integer not null references customers (id),
  status order_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders (customer_id);

create table order_lines (
  id integer generated always as identity primary key,
  order_id integer not null references orders (id) on delete cascade,
  product_id integer not null references products (id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);

create index order_lines_order_id_idx on order_lines (order_id);
