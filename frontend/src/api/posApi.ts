import { api } from "./client";

export interface POSCheckoutItem {
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
}

export interface POSCheckoutPayload {
  companyId: number;
  locationId?: number;
  cashRegisterId?: number;
  customerId?: number;
  items: POSCheckoutItem[];
  payment: {
    method: "CASH" | "CARD" | "TRANSFER";
    amountPaid: number;
  };
}

export const posApi = {
  checkout: async (payload: POSCheckoutPayload) => {
    const res = await api.post("/pos/checkout", payload);
    return res.data.data;
  },
  listTickets: async (companyId?: number) => {
    const res = await api.get("/pos/tickets", { params: { companyId } });
    return res.data.data;
  },
  getTicket: async (ticketId: string | number) => {
    const res = await api.get(`/pos/tickets/${ticketId}`);
    return res.data.data;
  },
};
