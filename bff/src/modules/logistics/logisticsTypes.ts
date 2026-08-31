import { z } from "zod";

export const CreateLotSchema = z.object({
  companyId: z.number().int().positive(),
  productId: z.number().int().positive(),
  productName: z.string(),
  lotNumber: z.string().min(2),
  stockQty: z.number().positive(),
  expiryDate: z.string(), // YYYY-MM-DD
  warehouseId: z.number().int().positive().default(1),
});
export type CreateLotPayload = z.infer<typeof CreateLotSchema>;

export const CreateDeliveryNoteSchema = z.object({
  companyId: z.number().int().positive(),
  partnerId: z.number().int().positive(),
  partnerName: z.string(),
  driverName: z.string().min(2, "Nombre del chofer requerido"),
  licensePlates: z.string().min(2, "Placas del vehículo requeridas"),
  items: z.array(
    z.object({
      productId: z.number(),
      productName: z.string(),
      qty: z.number().positive(),
      lotNumber: z.string().optional(),
    })
  ).min(1, "Debe incluir al menos 1 producto"),
  destinationAddress: z.string().min(3),
  notes: z.string().optional(),
});
export type CreateDeliveryNotePayload = z.infer<typeof CreateDeliveryNoteSchema>;

export const CreateAdjustmentSchema = z.object({
  companyId: z.number().int().positive(),
  productId: z.number().int().positive(),
  productName: z.string(),
  beforeQty: z.number().nonnegative(),
  countedQty: z.number().nonnegative(),
  reason: z.enum(["MERMA", "ROTURA", "CONTEO_FISICO", "CADUCIDAD"]),
  notes: z.string().optional(),
});
export type CreateAdjustmentPayload = z.infer<typeof CreateAdjustmentSchema>;
