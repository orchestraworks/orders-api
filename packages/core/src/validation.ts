import { z } from "zod";
import { parsePrice } from "./money";

const Price = z.string().transform((value, ctx) => {
  try {
    return parsePrice(value);
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price must look like 19.99" });
    return z.NEVER;
  }
});

export const CreateCustomer = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
});
export type CreateCustomer = z.infer<typeof CreateCustomer>;

export const CreateProduct = z.object({
  sku: z.string().trim().regex(/^[A-Z0-9-]{3,32}$/, "SKU must be 3-32 uppercase letters, digits or dashes"),
  name: z.string().trim().min(1).max(200),
  price: Price,
});
export type CreateProduct = z.infer<typeof CreateProduct>;

export const OrderStatus = z.enum(["pending", "paid", "shipped", "canceled"]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const CreateOrder = z.object({
  customerId: z.number().int().positive(),
  lines: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(1000),
      }),
    )
    .min(1),
});
export type CreateOrder = z.infer<typeof CreateOrder>;

export const UpdateOrder = z.object({
  status: OrderStatus,
});
export type UpdateOrder = z.infer<typeof UpdateOrder>;

export const PageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PageQuery = z.infer<typeof PageQuery>;

export const CustomerQuery = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});

export const IdParam = z.object({
  id: z.coerce.number().int().positive(),
});
