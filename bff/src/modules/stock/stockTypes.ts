import { z } from "zod";

// --- Almacenes / Bodegas ---
export const StockLocationSchema = z.object({
  name: z.string().min(2, "El nombre del almacén es requerido"),
  code: z.string().optional(),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
  usableOnSaleOrder: z.boolean().default(true),
  usableOnPurchaseOrder: z.boolean().default(true),
});

export type StockLocationInput = z.infer<typeof StockLocationSchema>;

// --- Traslados entre Almacenes ---
export const StockTransferItemSchema = z.object({
  productId: z.coerce.number().min(1, "El ID del producto es requerido"),
  productName: z.string().optional().default("Producto"),
  qty: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.coerce.number().min(0).optional().default(0),
});

export type StockTransferItemInput = z.infer<typeof StockTransferItemSchema>;

export const StockTransferSchema = z
  .object({
    companyId: z.coerce.number().min(1, "El ID de empresa es requerido"),
    fromWarehouseId: z.coerce.number().optional(),
    fromLocationId: z.coerce.number().optional(),
    toWarehouseId: z.coerce.number().optional(),
    toLocationId: z.coerce.number().optional(),
    items: z.array(StockTransferItemSchema).optional(),
    lines: z.array(StockTransferItemSchema).optional(),
    notes: z.string().optional(),
    description: z.string().optional(),
  })
  .transform((data) => {
    const fromWarehouseId = data.fromWarehouseId || data.fromLocationId || 0;
    const toWarehouseId = data.toWarehouseId || data.toLocationId || 0;
    const items = (data.items || data.lines || []).filter((i) => i.productId > 0 && i.qty > 0);
    const notes = data.notes || data.description || "Traslado interno";

    return {
      companyId: data.companyId,
      fromWarehouseId,
      toWarehouseId,
      items,
      notes,
    };
  })
  .refine((data) => data.fromWarehouseId > 0, { message: "El almacén de origen es requerido" })
  .refine((data) => data.toWarehouseId > 0, { message: "El almacén de destino es requerido" })
  .refine((data) => data.items.length > 0, { message: "Debe incluir al menos un producto a trasladar" });

export type StockTransferInput = z.infer<typeof StockTransferSchema>;

// --- Ajustes de Inventario ---
export type StockAdjustmentReason =
  | "INITIAL_INVENTORY"
  | "PHYSICAL_COUNT_SURPLUS"
  | "PHYSICAL_COUNT_SHORTAGE"
  | "DAMAGED_WASTE"
  | "EXPIRED"
  | "INTERNAL_CONSUMPTION"
  | "THEFT_LOSS"
  | "ENTRY_ERROR"
  | "OTHER";

export interface StockAdjustmentRecord {
  id: string;
  voucherSeq: string;
  date: string;
  companyId: number;
  warehouseId: number;
  warehouseName: string;
  warehouseCode?: string;
  productId: number;
  productName: string;
  productCode: string;
  categoryName?: string;
  uomCode?: string;
  previousStock: number;
  physicalQty: number;
  deltaQty: number;
  adjustmentType: "INFLOW" | "OUTFLOW" | "NO_CHANGE";
  unitCost: number;
  totalImpactValue: number;
  reason: StockAdjustmentReason | string;
  reasonLabel: string;
  notes?: string;
  stockMoveId: number;
  responsibleName?: string;
  status: "APPLIED";
}

export const StockAdjustmentSchema = z
  .object({
    companyId: z.coerce.number().min(1, "El ID de empresa es requerido"),
    warehouseId: z.coerce.number().optional(),
    locationId: z.coerce.number().optional(),
    productId: z.coerce.number().min(1, "El ID del producto es requerido"),
    productName: z.string().optional(),
    productCode: z.string().optional(),
    physicalQty: z.coerce.number().optional(),
    adjustedQty: z.coerce.number().optional(),
    reason: z.string().optional().default("PHYSICAL_COUNT_SURPLUS"),
    notes: z.string().optional(),
    responsibleName: z.string().optional(),
  })
  .transform((data) => {
    const warehouseId = data.warehouseId || data.locationId || 0;
    const physicalQty =
      data.physicalQty !== undefined
        ? data.physicalQty
        : data.adjustedQty !== undefined
        ? data.adjustedQty
        : 0;
    const notes = data.notes || "";

    return {
      companyId: data.companyId,
      warehouseId,
      productId: data.productId,
      productName: data.productName || "Producto",
      productCode: data.productCode,
      physicalQty,
      reason: data.reason || "PHYSICAL_COUNT_SURPLUS",
      notes,
      responsibleName: data.responsibleName || "Responsable de Almacén",
    };
  })
  .refine((data) => data.warehouseId > 0, { message: "El almacén es requerido" });

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

// --- Valoración de Inventario por Bodega ---
export interface ProductStockValuationItem {
  productId: number;
  productName: string;
  productCode: string;
  category: string;
  locationId: number;
  locationName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  salePrice: number;
  totalCostValue: number;
  totalSaleValue: number;
  marginValue: number;
  marginPercent: number;
  isLowStock: boolean;
  uomCode: string;
}

export interface WarehouseValuation {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  totalSkus: number;
  totalUnits: number;
  totalCostValuation: number;
  totalSaleValuation: number;
  projectedMargin: number;
  projectedMarginPercent: number;
  percentageOfTotal: number;
  criticalStockCount: number;
  items: ProductStockValuationItem[];
}

export interface InventoryValuationSummary {
  companyId: number;
  generatedAt: string;
  totalCompanyCostValuation: number;
  totalCompanySaleValuation: number;
  totalCompanyUnits: number;
  totalActiveSkus: number;
  totalCriticalItems: number;
  overallGrossMarginPercent: number;
  warehouses: WarehouseValuation[];
  selectedWarehouseId?: number;
}
