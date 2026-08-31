import { api } from "./client";

export interface BatchLotRecord {
  id: string;
  companyId: number;
  productId: number;
  productName: string;
  lotNumber: string;
  stockQty: number;
  expiryDate: string;
  daysRemaining: number;
  status: "GOOD" | "NEAR_EXPIRY" | "EXPIRED";
  warehouseId: number;
}

export interface DeliveryNoteRecord {
  id: string;
  deliverySeq: string;
  companyId: number;
  partnerId: number;
  partnerName: string;
  driverName: string;
  licensePlates: string;
  destinationAddress: string;
  status: "IN_TRANSIT" | "DELIVERED" | "RETURNED";
  departureDate: string;
  items: Array<{ productId: number; productName: string; qty: number; lotNumber?: string }>;
  notes?: string;
}

export interface InventoryAdjustmentRecord {
  id: string;
  companyId: number;
  productId: number;
  productName: string;
  beforeQty: number;
  countedQty: number;
  difference: number;
  reason: "MERMA" | "ROTURA" | "CONTEO_FISICO" | "CADUCIDAD";
  accountCode: string;
  date: string;
  notes?: string;
}

export const logisticsApi = {
  listLots: async (companyId: number): Promise<BatchLotRecord[]> => {
    const res = await api.get<{ success: boolean; data: BatchLotRecord[] }>(`/logistics/lots?companyId=${companyId}`);
    return res.data.data;
  },

  createLot: async (payload: any): Promise<BatchLotRecord> => {
    const res = await api.post<{ success: boolean; data: BatchLotRecord }>("/logistics/lots", payload);
    return res.data.data;
  },

  listDeliveries: async (companyId: number): Promise<DeliveryNoteRecord[]> => {
    const res = await api.get<{ success: boolean; data: DeliveryNoteRecord[] }>(`/logistics/deliveries?companyId=${companyId}`);
    return res.data.data;
  },

  createDelivery: async (payload: any): Promise<DeliveryNoteRecord> => {
    const res = await api.post<{ success: boolean; data: DeliveryNoteRecord }>("/logistics/deliveries", payload);
    return res.data.data;
  },

  markDelivered: async (deliveryId: string): Promise<DeliveryNoteRecord> => {
    const res = await api.post<{ success: boolean; data: DeliveryNoteRecord }>(`/logistics/deliveries/${deliveryId}/delivered`);
    return res.data.data;
  },

  listAdjustments: async (companyId: number): Promise<InventoryAdjustmentRecord[]> => {
    const res = await api.get<{ success: boolean; data: InventoryAdjustmentRecord[] }>(`/logistics/adjustments?companyId=${companyId}`);
    return res.data.data;
  },

  createAdjustment: async (payload: any): Promise<InventoryAdjustmentRecord> => {
    const res = await api.post<{ success: boolean; data: InventoryAdjustmentRecord }>("/logistics/adjustments", payload);
    return res.data.data;
  },
};
