import { z } from "zod";

export const PurchaseOrderLineSchema = z.object({
  productId: z.number().min(1, "El ID del producto es requerido"),
  productName: z.string().optional(),
  qty: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.coerce.number().min(0, "El precio unitario no puede ser negativo"),
});

export type PurchaseOrderLineInput = z.infer<typeof PurchaseOrderLineSchema>;

export const PurchaseOrderSchema = z
  .object({
    supplierId: z.number().min(1, "El ID de proveedor es requerido"),
    companyId: z.number().min(1, "El ID de empresa es requerido"),
    warehouseId: z.number().optional(),
    orderDate: z.string().optional(),
    items: z.array(PurchaseOrderLineSchema).optional(),
    lines: z.array(PurchaseOrderLineSchema).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => (data.items && data.items.length > 0) || (data.lines && data.lines.length > 0), {
    message: "Debe incluir al menos un producto en la orden de compra",
  });

export type PurchaseOrderInput = z.infer<typeof PurchaseOrderSchema>;

export const ReceivePurchaseSchema = z.object({
  warehouseId: z.number().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export type ReceivePurchaseInput = z.infer<typeof ReceivePurchaseSchema>;

export const SupplierReturnSchema = z.object({
  reason: z.enum(["MERCANCIA_DANADA", "ERROR_SURTIDO", "EXCESO_INVENTARIO", "OTRO"]).default("MERCANCIA_DANADA"),
  locationId: z.coerce.number().optional(),
  items: z
    .array(
      z.object({
        productId: z.number(),
        productName: z.string().optional(),
        qty: z.number().positive("La cantidad devuelta debe ser mayor a 0"),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1, "Debe seleccionar al menos un producto a devolver"),
  notes: z.string().optional(),
});

export type SupplierReturnInput = z.infer<typeof SupplierReturnSchema>;

// Recepciones de Almacén (Goods Receipts)
export interface GoodsReceiptRecord {
  id: string;
  receiptSeq: string; // REC-ALM-2026-00001
  companyId: number;
  purchaseOrderId: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  receiptDate: string;
  items: Array<{
    productId: number;
    productName: string;
    productCode: string;
    qtyOrdered: number;
    qtyReceived: number;
    lotNumber?: string;
    expiryDate?: string;
    unitPrice: number;
  }>;
  totalQty: number;
  totalAmount: number;
  status: "RECEIVED" | "PARTIAL" | "RETURNED";
  notes?: string;
}

// Facturas de Compra de Proveedor (Vendor Bills / CxP)
export const VendorInvoiceSchema = z.object({
  companyId: z.number().min(1),
  supplierId: z.number().min(1),
  supplierName: z.string().min(1),
  supplierTaxNbr: z.string().optional().default("XAXX010101000"),
  purchaseOrderId: z.number().optional(),
  orderNumber: z.string().optional(),
  invoiceNumber: z.string().min(1, "El número de factura del proveedor es requerido"),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  autoReceive: z.boolean().optional().default(true), // Entrada rápida directa a inventario
  warehouseId: z.number().optional().default(1),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number(),
      productName: z.string(),
      productCode: z.string().optional(),
      qty: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      lotNumber: z.string().optional(),
      expiryDate: z.string().optional(),
    })
  ).min(1, "Debe incluir al menos un producto"),
  notes: z.string().optional(),
});

export type VendorInvoiceInput = z.input<typeof VendorInvoiceSchema>;

export interface VendorInvoiceRecord {
  id: string;
  invoiceSeq: string; // FP-2026-00001
  vendorInvoiceNumber: string; // Factura original del proveedor (ej. F-9821)
  companyId: number;
  purchaseOrderId?: number;
  orderNumber?: string;
  receiptSeq?: string; // Remisión de entrada REC-ALM-2026-XXXXX
  warehouseName?: string;
  supplierId: number;
  supplierName: string;
  supplierTaxNbr: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  status: "DRAFT" | "PENDING_PAYMENT" | "PAID";
  items: Array<{
    productId: number;
    productName: string;
    productCode?: string;
    qty: number;
    unitPrice: number;
    total: number;
    lotNumber?: string;
  }>;
  notes?: string;
}
