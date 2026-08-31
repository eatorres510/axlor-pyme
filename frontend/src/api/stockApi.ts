import { api } from "./client";

export const stockApi = {
  getStockLevels: async (companyId: number, lowStockOnly = false, warehouseId?: number) => {
    let url = `/stock/levels?companyId=${companyId}&lowStockOnly=${lowStockOnly}`;
    if (warehouseId) url += `&warehouseId=${warehouseId}`;
    const res = await api.get(url);
    return res.data;
  },
  getWarehouseValuation: async (companyId: number, warehouseId?: number) => {
    let url = `/stock/valuation?companyId=${companyId}`;
    if (warehouseId) url += `&warehouseId=${warehouseId}`;
    const res = await api.get(url);
    return res.data.data;
  },
  getLocations: async (companyId: number) => {
    const res = await api.get(`/stock/locations?companyId=${companyId}`);
    return res.data.data;
  },
  createLocation: async (payload: { name: string; code?: string; companyId: number }) => {
    const res = await api.post("/stock/locations", payload);
    return res.data.data;
  },
  createTransfer: async (payload: {
    companyId: number;
    fromWarehouseId?: number;
    fromLocationId?: number;
    toWarehouseId?: number;
    toLocationId?: number;
    items?: Array<{ productId: number; productName?: string; qty: number; unitPrice?: number }>;
    lines?: Array<{ productId: number; productName?: string; qty: number; unitPrice?: number }>;
    notes?: string;
    description?: string;
  }) => {
    const res = await api.post("/stock/transfers", payload);
    return res.data;
  },
  createAdjustment: async (payload: {
    companyId: number;
    warehouseId?: number;
    locationId?: number;
    productId: number;
    productName?: string;
    physicalQty?: number;
    adjustedQty?: number;
    type?: "PHYSICAL_COUNT" | "SHRINKAGE" | "CORRECTION";
    reason?: string;
    notes?: string;
  }) => {
    const res = await api.post("/stock/adjustments", payload);
    return res.data;
  },
};
