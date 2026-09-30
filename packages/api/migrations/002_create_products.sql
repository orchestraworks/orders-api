create table products (
  id integer generated always as identity primary key,
  sku text not null unique,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  created_at timestamptz not null default now()
);
