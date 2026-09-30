# Orders service

A small HTTP service for customers, products and orders, backed by Postgres.

- `packages/api` is the Fastify service.
- `packages/core` holds the domain helpers shared by the service: money parsing and formatting, and request validation.

Money is stored as integer cents and sent over the API as decimal strings such as `"19.99"`.

## Prerequisites

- Node 22 (see `.nvmrc`)
- pnpm (run `corepack enable` to get the pinned version)
- Docker, for the local database

## Getting started

```sh
corepack enable
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:seed
pnpm dev
```

The service listens on http://localhost:3000.

## Tests

```sh
pnpm test
```

The `core` tests need nothing. The `api` tests run against the database from `docker compose` and empty its tables, so run `pnpm db:seed` again afterwards if you want the sample data back.

## API

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | Checks the database connection |
| POST | `/customers` | Creates a customer: `{ "name", "email" }` |
| GET | `/customers?q=` | Lists customers; `q` searches name and email |
| GET | `/customers/:id` | Returns one customer |
| POST | `/products` | Creates a product: `{ "sku", "name", "price" }` |
| GET | `/products` | Lists products |
| POST | `/orders` | Creates an order: `{ "customerId", "lines": [{ "productId", "quantity" }] }` |
| GET | `/orders?page=&pageSize=` | Lists orders, newest first |
| GET | `/orders/:id` | Returns one order with its lines and total |
| PATCH | `/orders/:id` | Changes an order's status: `{ "status" }` |

Order statuses are `pending`, `paid`, `shipped` and `canceled`.
