import { api } from "./client";

export interface SaleQuoteItem {
  productId: number;
  productName: string;
  productCode: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
}

export interface SaleQuoteRecord {
  id: string;
  quoteSeq: string;
  companyId: number;
  partnerId: number;
  partnerName: string;
  priceListCode: string;
  date: string;
  validUntil: string;
  status: "DRAFT" | "SENT" | "WON" | "CONVERTED" | "CANCELED";
  items: SaleQuoteItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  convertedOrderId?: string;
  notes?: string;
}

export interface B2BOrderRecord {
  id: string;
  orderSeq: string;
  companyId: number;
  partnerId: number;
  partnerName: string;
  quoteSeq?: string;
  date: string;
  status: "CONFIRMED" | "IN_DELIVERY" | "DELIVERED" | "INVOICED";
  items: SaleQuoteItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  creditWarning?: string;
  notes?: string;
}

export interface PriceList {
  code: string;
  name: string;
  discountPct: number;
  description: string;
}

export interface SalesInvoiceRecord {
  id: string;
  invoiceSeq: string;
  companyId: number;
  partnerId: number;
  partnerName: string;
  date: string;
  dueDate: string;
  status: "DRAFT" | "OPEN" | "PAID" | "CANCELED";
  items?: SaleQuoteItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountRemaining: number;
  notes?: string;
}

export const salesApi = {
  listPriceLists: async (): Promise<PriceList[]> => {
    const res = await api.get<{ success: boolean; data: PriceList[] }>("/sales/price-lists");
    return res.data.data;
  },

  createPriceList: async (data: PriceList): Promise<PriceList> => {
    const res = await api.post<{ success: boolean; data: PriceList }>("/sales/price-lists", data);
    return res.data.data;
  },

  updatePriceList: async (code: string, data: Partial<PriceList>): Promise<PriceList> => {
    const res = await api.put<{ success: boolean; data: PriceList }>(`/sales/price-lists/${code}`, data);
    return res.data.data;
  },

  deletePriceList: async (code: string): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/sales/price-lists/${code}`);
    return res.data.success;
  },

  listQuotes: async (companyId: number): Promise<SaleQuoteRecord[]> => {
    const res = await api.get<{ success: boolean; data: SaleQuoteRecord[] }>(`/sales/quotes?companyId=${companyId}`);
    return res.data.data;
  },

  getQuote: async (quoteId: string): Promise<SaleQuoteRecord> => {
    const res = await api.get<{ success: boolean; data: SaleQuoteRecord }>(`/sales/quotes/${quoteId}`);
    return res.data.data;
  },

  updateQuote: async (quoteId: string, payload: any): Promise<SaleQuoteRecord> => {
    const res = await api.put<{ success: boolean; data: SaleQuoteRecord }>(`/sales/quotes/${quoteId}`, payload);
    return res.data.data;
  },

  deleteQuote: async (quoteId: string): Promise<boolean> => {
    const res = await api.delete<{ success: boolean }>(`/sales/quotes/${quoteId}`);
    return res.data.success;
  },

  createQuote: async (payload: any): Promise<SaleQuoteRecord> => {
    const res = await api.post<{ success: boolean; data: SaleQuoteRecord }>("/sales/quotes", payload);
    return res.data.data;
  },

  getOrder: async (orderId: string): Promise<B2BOrderRecord> => {
    const res = await api.get<{ success: boolean; data: B2BOrderRecord }>(`/sales/orders/${orderId}`);
    return res.data.data;
  },

  convertToOrder: async (quoteId: string): Promise<B2BOrderRecord> => {
    const res = await api.post<{ success: boolean; data: B2BOrderRecord }>(`/sales/quotes/${quoteId}/convert-to-order`);
    return res.data.data;
  },

  convertToInvoice: async (quoteId: string): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/sales/quotes/${quoteId}/convert-to-invoice`);
    return res.data.data;
  },

  convertOrderToInvoice: async (orderId: string): Promise<any> => {
    const res = await api.post<{ success: boolean; data: any }>(`/sales/orders/${orderId}/convert-to-invoice`);
    return res.data.data;
  },

  listOrders: async (companyId: number): Promise<B2BOrderRecord[]> => {
    const res = await api.get<{ success: boolean; data: B2BOrderRecord[] }>(`/sales/orders?companyId=${companyId}`);
    return res.data.data;
  },

  listInvoices: async (companyId: number): Promise<SalesInvoiceRecord[]> => {
    const res = await api.get<{ success: boolean; data: SalesInvoiceRecord[] }>(`/sales/invoices?companyId=${companyId}`);
    return res.data.data;
  },

  createOrder: async (payload: any): Promise<B2BOrderRecord> => {
    const res = await api.post<{ success: boolean; data: B2BOrderRecord }>("/sales/orders", payload);
    return res.data.data;
  },

  assignPriceListToPartners: async (code: string, partnerIds: number[]): Promise<boolean> => {
    const res = await api.post<{ success: boolean }>(`/sales/price-lists/${code}/assign-partners`, { partnerIds });
    return res.data.success;
  },
};
