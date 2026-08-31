import { api } from "./client";

export interface UnitOfMeasure {
  code: string;
  name: string;
  symbol: string;
  category?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface ProductRecord {
  id: number;
  name: string;
  code: string;
  barCode?: string;
  salePrice: number;
  costPrice?: number;
  purchasePrice?: number;
  categoryName?: string;
  categoryId?: number;
  subCategory?: string;
  costType?: string;
  imageUrl?: string;
  uomCode?: string;
  uomName?: string;
  taxRate?: number;
}

export interface PartnerContact {
  id?: number | string;
  name: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  department?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface PartnerRecord {
  id: number;
  name: string;
  taxNbr: string;
  partnerType?: "MORAL" | "FISICA" | "FINAL_CONSUMER" | "DISTRIBUTOR" | "GOVERNMENT";
  isCustomer: boolean;
  isSupplier: boolean;
  contactPerson?: string;
  contactJobTitle?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  fiscalRegime?: string;
  cfdiUsage?: string;
  priceListCode?: string;
  creditLimit?: number;
  creditDays?: number;
  contacts?: PartnerContact[];
}

export interface PriceListRecord {
  code: string;
  name: string;
  discountPct: number;
  description?: string;
}

export const catalogApi = {
  // Unidades de Medida (UoM)
  listUoMs: async (): Promise<UnitOfMeasure[]> => {
    const res = await api.get<{ success: boolean; data: UnitOfMeasure[] }>("/catalog/uom");
    return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  },

  createUoM: async (payload: UnitOfMeasure): Promise<UnitOfMeasure> => {
    const res = await api.post<{ success: boolean; data: UnitOfMeasure }>("/catalog/uom", payload);
    return res.data.data;
  },

  updateUoM: async (code: string, payload: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> => {
    const res = await api.put<{ success: boolean; data: UnitOfMeasure }>(`/catalog/uom/${code}`, payload);
    return res.data.data;
  },

  deleteUoM: async (code: string): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/catalog/uom/${code}`);
    return res.data.success;
  },

  // Listas de Precios
  listPriceLists: async (): Promise<PriceListRecord[]> => {
    const res = await api.get<{ success: boolean; data: PriceListRecord[] }>("/catalog/price-lists");
    return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  },

  createPriceList: async (payload: PriceListRecord): Promise<PriceListRecord> => {
    const res = await api.post<{ success: boolean; data: PriceListRecord }>("/catalog/price-lists", payload);
    return res.data.data;
  },

  updatePriceList: async (code: string, payload: Partial<PriceListRecord>): Promise<PriceListRecord> => {
    const res = await api.put<{ success: boolean; data: PriceListRecord }>(`/catalog/price-lists/${code}`, payload);
    return res.data.data;
  },

  deletePriceList: async (code: string): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/catalog/price-lists/${code}`);
    return res.data.success;
  },

  // Categorías / Familias
  listCategories: async (): Promise<ProductCategory[]> => {
    const res = await api.get<{ success: boolean; data: ProductCategory[] }>("/catalog/categories");
    return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  },

  createCategory: async (payload: { name: string; code?: string; description?: string }): Promise<ProductCategory> => {
    const res = await api.post<{ success: boolean; data: ProductCategory }>("/catalog/categories", payload);
    return res.data.data;
  },

  updateCategory: async (id: number, payload: { name?: string; code?: string; description?: string }): Promise<ProductCategory> => {
    const res = await api.put<{ success: boolean; data: ProductCategory }>(`/catalog/categories/${id}`, payload);
    return res.data.data;
  },

  deleteCategory: async (id: number): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/catalog/categories/${id}`);
    return res.data.success;
  },

  // Productos & Servicios
  listProducts: async (companyId?: number, query?: string, categoryId?: number): Promise<ProductRecord[]> => {
    const res = await api.get<{ success: boolean; data: ProductRecord[] }>("/catalog/products", {
      params: { companyId, q: query, categoryId },
    });
    const items = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    return items.map((p: any) => ({
      ...p,
      costPrice: p.purchasePrice || p.costPrice || 0,
    }));
  },

  getProductByBarcode: async (barcode: string, companyId?: number): Promise<ProductRecord | null> => {
    const list = await catalogApi.listProducts(companyId, barcode);
    return list.find((p) => p.barCode === barcode || p.code === barcode) || (list.length > 0 ? list[0] : null);
  },

  createProduct: async (payload: {
    name: string;
    code: string;
    barCode?: string;
    salePrice: number;
    purchasePrice?: number;
    costPrice?: number;
    categoryId?: number;
    categoryName?: string;
    uomCode?: string;
    uomName?: string;
    taxRate?: number;
    companyId: number;
  }): Promise<ProductRecord> => {
    const res = await api.post<{ success: boolean; data: ProductRecord }>("/catalog/products", payload);
    return res.data.data;
  },

  updateProduct: async (id: number, payload: Partial<ProductRecord>): Promise<ProductRecord> => {
    const res = await api.put<{ success: boolean; data: ProductRecord }>(`/catalog/products/${id}`, payload);
    return res.data.data;
  },

  deleteProduct: async (id: number): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/catalog/products/${id}`);
    return res.data.success;
  },

  // Contactos (Clientes & Proveedores)
  listPartners: async (
    companyId?: number,
    isCustomerOrType?: boolean | string,
    isSupplier?: boolean,
    query?: string
  ): Promise<PartnerRecord[]> => {
    let cust = typeof isCustomerOrType === "boolean" ? isCustomerOrType : undefined;
    let supp = isSupplier;
    if (typeof isCustomerOrType === "string") {
      if (isCustomerOrType === "CUSTOMER") {
        cust = true;
        supp = false;
      } else if (isCustomerOrType === "SUPPLIER") {
        cust = false;
        supp = true;
      }
    }
    const res = await api.get<{ success: boolean; data: PartnerRecord[] }>("/catalog/partners", {
      params: { companyId, isCustomer: cust, isSupplier: supp, q: query },
    });
    return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  },

  createPartner: async (payload: {
    name: string;
    taxNbr: string;
    fiscalRegime?: string;
    cfdiUsage?: string;
    email?: string;
    phone?: string;
    address?: string;
    isCustomer: boolean;
    isSupplier: boolean;
    priceListCode?: string;
    creditLimit?: number;
    creditDays?: number;
    companyId: number;
  }): Promise<PartnerRecord> => {
    const res = await api.post<{ success: boolean; data: PartnerRecord }>("/catalog/partners", payload);
    return res.data.data;
  },

  updatePartner: async (id: number, payload: Partial<PartnerRecord>): Promise<PartnerRecord> => {
    const res = await api.put<{ success: boolean; data: PartnerRecord }>(`/catalog/partners/${id}`, payload);
    return res.data.data;
  },

  deletePartner: async (id: number): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/catalog/partners/${id}`);
    return res.data.success;
  },
};
