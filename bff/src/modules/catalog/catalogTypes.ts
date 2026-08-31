import { z } from "zod";

// --- Unidades de Medida (UoM) ---
export const UnitOfMeasureSchema = z.object({
  code: z.string().min(1, "El código es requerido"), // ej: PZA, KGM, LTR, MTR, XBX, E48
  name: z.string().min(2, "El nombre es requerido"), // ej: Pieza, Kilogramo, Litro, Caja
  symbol: z.string().optional().default("pza"),
  category: z.string().optional().default("UNIT"), // UNIT, WEIGHT, VOLUME, LENGTH, SERVICE
});

export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;

// --- Categorías / Familias de Producto ---
export const ProductCategorySchema = z.object({
  name: z.string().min(2, "El nombre de categoría es requerido"),
  code: z.string().min(1, "El código es requerido"),
  description: z.string().optional(),
  parentId: z.number().optional(),
});

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

// --- Productos / Servicios ---
export const ProductSchema = z.object({
  name: z.string().min(2, "El nombre del producto es requerido"),
  code: z.string().min(1, "El código es requerido"),
  barCode: z.string().optional(),
  salePrice: z.coerce.number().min(0, "El precio de venta no puede ser negativo"),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  categoryId: z.number().optional().default(1),
  categoryName: z.string().optional(),
  uomCode: z.string().optional().default("PZA"),
  uomName: z.string().optional().default("Pieza"),
  taxRate: z.coerce.number().optional().default(16), // 16%, 8%, 0%, Exento
  minStock: z.coerce.number().optional().default(5),
  companyId: z.number().min(1, "El ID de empresa es requerido"),
});

export type ProductInput = z.infer<typeof ProductSchema>;

// --- Contactos de Socios Comerciales ---
export const PartnerContactSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1, "El nombre del contacto es requerido"),
  jobTitle: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  department: z.string().optional().default("General"),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
});

export type PartnerContact = z.infer<typeof PartnerContactSchema>;

// --- Socios Comerciales (Clientes / Proveedores) ---
export const PartnerSchema = z.object({
  name: z.string().min(2, "La razón social o nombre es requerido"),
  taxNbr: z.string().min(3, "El RFC / Tax ID es requerido"),
  partnerType: z.enum(["MORAL", "FISICA", "FINAL_CONSUMER", "DISTRIBUTOR", "GOVERNMENT"]).optional().default("MORAL"),
  fiscalRegime: z.string().optional().default("601 - General de Ley Personas Morales"),
  cfdiUsage: z.string().optional().default("G03 - Gastos en general"),
  contactPerson: z.string().optional().default(""),
  contactJobTitle: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  isCustomer: z.boolean().default(true),
  isSupplier: z.boolean().default(false),
  priceListCode: z.string().optional().default("PUBLIC"), // PUBLIC, WHOLESALE, DISTRIBUTOR
  creditLimit: z.coerce.number().min(0).optional().default(0),
  creditDays: z.coerce.number().min(0).optional().default(0),
  companyId: z.coerce.number().min(1).optional().default(13),
  contacts: z.array(PartnerContactSchema).optional().default([]),
});

export type PartnerInput = z.infer<typeof PartnerSchema>;

// --- Listas de Precios ---
export const PriceListSchema = z.object({
  code: z.string().min(1, "El código de tarifa es requerido"),
  name: z.string().min(2, "El nombre de la lista es requerido"),
  discountPct: z.coerce.number().min(0).max(100).default(0),
  description: z.string().optional(),
});

export type PriceListInput = z.infer<typeof PriceListSchema>;
