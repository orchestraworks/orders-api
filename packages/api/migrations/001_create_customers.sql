create table customers (
  id integer generated always as identity primary key,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);
