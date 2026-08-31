import { api } from "./client";

export const purchasingApi = {
  listOrders: async (companyId: number, statusSelect?: number) => {
    let url = `/purchases/orders?companyId=${companyId}`;
    if (statusSelect !== undefined) url += `&statusSelect=${statusSelect}`;
    const res = await api.get(url);
    return res.data.data;
  },
  getOrder: async (id: number) => {
    const res = await api.get(`/purchases/orders/${id}`);
    return res.data.data;
  },
  createOrder: async (payload: {
    companyId: number;
    supplierId: number;
    currencyCode?: string;
    items?: Array<{ productId: number; productName?: string; qty: number; unitPrice: number }>;
    lines?: Array<{ productId: number; productName?: string; qty: number; unitPrice: number }>;
    notes?: string;
  }) => {
    const res = await api.post("/purchases/orders", payload);
    return res.data.data;
  },
  updateOrder: async (
    id: number,
    payload: {
      companyId?: number;
      supplierId?: number;
      items?: Array<{ productId: number; productName?: string; qty: number; unitPrice: number }>;
      lines?: Array<{ productId: number; productName?: string; qty: number; unitPrice: number }>;
      notes?: string;
    }
  ) => {
    const res = await api.put(`/purchases/orders/${id}`, payload);
    return res.data.data;
  },
  deleteOrder: async (id: number) => {
    const res = await api.delete(`/purchases/orders/${id}`);
    return res.data;
  },
  confirmOrder: async (id: number) => {
    const res = await api.post(`/purchases/orders/${id}/confirm`);
    return res.data.data;
  },
  receiveOrder: async (id: number, locationId?: number) => {
    const res = await api.post(`/purchases/orders/${id}/receive`, { locationId });
    return res.data.data;
  },
  returnOrder: async (
    id: number,
    payload: {
      reason: "MERCANCIA_DANADA" | "ERROR_SURTIDO" | "EXCESO_INVENTARIO" | "OTRO";
      locationId?: number;
      items: Array<{ productId: number; productName?: string; qty: number; unitPrice: number }>;
      notes?: string;
    }
  ) => {
    const res = await api.post(`/purchases/orders/${id}/return`, payload);
    return res.data.data;
  },
  listReceipts: async (companyId?: number) => {
    const url = companyId ? `/purchases/receipts?companyId=${companyId}` : "/purchases/receipts";
    const res = await api.get(url);
    return res.data.data;
  },
  listVendorInvoices: async (companyId?: number) => {
    const url = companyId ? `/purchases/invoices?companyId=${companyId}` : "/purchases/invoices";
    const res = await api.get(url);
    return res.data.data;
  },
  createVendorInvoice: async (payload: {
    companyId: number;
    supplierId: number;
    supplierName: string;
    supplierTaxNbr?: string;
    purchaseOrderId?: number;
    orderNumber?: string;
    invoiceNumber: string;
    invoiceDate?: string;
    dueDate?: string;
    autoReceive?: boolean;
    warehouseId?: number;
    lotNumber?: string;
    expiryDate?: string;
    items: Array<{
      productId: number;
      productName: string;
      productCode?: string;
      qty: number;
      unitPrice: number;
      lotNumber?: string;
      expiryDate?: string;
    }>;
    notes?: string;
  }) => {
    const res = await api.post("/purchases/invoices", payload);
    return res.data.data;
  },
  generateInvoiceFromOrder: async (orderId: number) => {
    const res = await api.post(`/purchases/orders/${orderId}/invoice`);
    return res.data.data;
  },
};
