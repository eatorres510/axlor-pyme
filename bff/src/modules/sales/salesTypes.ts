import { z } from "zod";

export const SaleQuoteItemSchema = z.object({
  productId: z.number().int().positive(),
  productName: z.string().default("Producto"),
  productCode: z.string().default("SKU"),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountPct: z.number().min(0).max(100).default(0),
});
export type SaleQuoteItem = z.infer<typeof SaleQuoteItemSchema>;

export const CreateQuoteSchema = z.object({
  companyId: z.number().int().positive(),
  partnerId: z.number().int().nonnegative().default(1),
  partnerName: z.string().default("Cliente B2B"),
  priceListCode: z.string().default("PUBLIC"),
  validUntil: z.string().optional(),
  items: z.array(SaleQuoteItemSchema).min(1, "Debe incluir al menos 1 producto"),
  notes: z.string().optional(),
});
export type CreateQuotePayload = z.infer<typeof CreateQuoteSchema>;

export const CreateB2BOrderSchema = z.object({
  companyId: z.number().int().positive(),
  partnerId: z.number().int().nonnegative().default(1),
  partnerName: z.string().default("Cliente B2B"),
  quoteId: z.string().optional(),
  priceListCode: z.string().default("PUBLIC"),
  items: z.array(SaleQuoteItemSchema).min(1),
  paymentTerms: z.string().default("30_DIAS_CREDITO"),
  notes: z.string().optional(),
});
export type CreateB2BOrderPayload = z.infer<typeof CreateB2BOrderSchema>;
