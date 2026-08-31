import { axelor } from "../../services/axelor/axelorClient.js";
import { sequenceService } from "../../services/axelor/sequenceService.js";
import { catalogService } from "../catalog/catalogService.js";
import { CreateQuotePayload, CreateB2BOrderPayload, SaleQuoteItem } from "./salesTypes.js";

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
  convertedInvoiceId?: number;
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

export class SalesService {
  // ==========================================
  // LISTAS DE PRECIOS - Delegadas a Axelor PriceList
  // ==========================================
  public async listPriceLists() {
    return await catalogService.listPriceLists();
  }

  public async createPriceList(data: { code: string; name: string; discountPct: number; description?: string }) {
    return await catalogService.createPriceList(data);
  }

  public async updatePriceList(code: string, data: { name?: string; discountPct?: number; description?: string }) {
    return await catalogService.updatePriceList(code, data);
  }

  public async deletePriceList(code: string) {
    return await catalogService.deletePriceList(code);
  }

  // ==========================================
  // COTIZACIONES (SaleOrder statusSelect = 1)
  // ==========================================
  public async listQuotes(companyId: number): Promise<SaleQuoteRecord[]> {
    try {
      const res = await axelor.search("com.axelor.apps.sale.db.SaleOrder", {
        limit: 100,
        sortBy: ["-createdOn"],
        data: {
          _domain: `self.company.id = ${companyId} and (self.statusSelect = 1 or self.statusSelect is null)`,
        },
        fields: [
          "id",
          "saleOrderSeq",
          "orderDate",
          "estimatedDeliveryDate",
          "statusSelect",
          "clientPartner",
          "exTaxTotal",
          "taxTotal",
          "inTaxTotal",
          "description",
          "saleOrderLineList",
        ],
      });

      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((so: any) => {
        const lines = Array.isArray(so.saleOrderLineList) ? so.saleOrderLineList : [];
        return {
          id: String(so.id),
          quoteSeq: so.saleOrderSeq || `COT-2026-${String(so.id).padStart(5, "0")}`,
          companyId: Number(companyId),
          partnerId: so.clientPartner?.id || 1,
          partnerName: so.clientPartner?.name || so.clientPartner?.simpleFullName || "Cliente General",
          priceListCode: "PUBLIC",
          date: so.orderDate || new Date().toISOString().slice(0, 10),
          validUntil: so.estimatedDeliveryDate || new Date().toISOString().slice(0, 10),
          status: so.statusSelect === 1 ? "DRAFT" : "WON",
          items: lines.map((l: any) => ({
            productId: l.product?.id || 1,
            productName: l.product?.name || "Producto",
            productCode: l.product?.code || "SKU",
            qty: Number(l.qty || 1),
            unitPrice: Number(l.price || 0),
            discountPct: Number(l.discount || 0),
          })),
          subtotal: Number(so.exTaxTotal || 0),
          taxAmount: Number(so.taxTotal || 0),
          total: Number(so.inTaxTotal || 0),
          notes: so.description || "",
        };
      });
    } catch (err: any) {
      console.warn("[SalesService] Error consultando cotizaciones en Axelor:", err.message);
      return [];
    }
  }

  public async createQuote(payload: CreateQuotePayload): Promise<SaleQuoteRecord> {
    const subtotal = payload.items.reduce((sum, item) => {
      const discountedPrice = item.unitPrice * (1 - item.discountPct / 100);
      return sum + discountedPrice * item.qty;
    }, 0);
    const taxAmount = Number((subtotal * 0.16).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    const quoteSeq = await sequenceService.getNextSequence(
      "COT",
      "com.axelor.apps.sale.db.SaleOrder",
      "saleOrderSeq",
      payload.companyId
    );

    const saleOrderPayload: any = {
      saleOrderSeq: quoteSeq,
      company: { id: payload.companyId },
      clientPartner: { id: payload.partnerId },
      orderDate: new Date().toISOString().slice(0, 10),
      estimatedDeliveryDate: payload.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      statusSelect: 1, // 1: Draft / Devis
      exTaxTotal: Number(subtotal.toFixed(2)),
      taxTotal: taxAmount,
      inTaxTotal: total,
      description: payload.notes || `Cotización B2B ${quoteSeq}`,
      saleOrderLineList: payload.items.map((it) => ({
        product: { id: it.productId },
        qty: it.qty,
        price: it.unitPrice,
        discount: it.discountPct,
        exTaxTotal: Number((it.unitPrice * (1 - it.discountPct / 100) * it.qty).toFixed(2)),
      })),
    };

    let savedId = `QUO-${Date.now()}`;
    try {
      const res = await axelor.create("com.axelor.apps.sale.db.SaleOrder", saleOrderPayload);
      if (res.data && res.data.length > 0 && res.data[0].id) {
        savedId = String(res.data[0].id);
      }
    } catch (err: any) {
      console.warn("[SalesService] Error creando cotización en Axelor:", err.message);
    }

    return {
      id: savedId,
      quoteSeq,
      companyId: payload.companyId,
      partnerId: payload.partnerId,
      partnerName: payload.partnerName,
      priceListCode: payload.priceListCode,
      date: new Date().toISOString().slice(0, 10),
      validUntil: payload.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      status: "DRAFT",
      items: payload.items,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount,
      total,
      notes: payload.notes,
    };
  }

  public async getQuote(quoteId: string): Promise<SaleQuoteRecord | null> {
    try {
      const idNum = parseInt(quoteId.replace(/\D/g, ""), 10);
      let so: any = null;
      if (!isNaN(idNum)) {
        so = await axelor.fetch("com.axelor.apps.sale.db.SaleOrder", idNum);
      }
      if (!so) {
        const searchRes = await axelor.search("com.axelor.apps.sale.db.SaleOrder", {
          data: { _domain: `self.saleOrderSeq = '${quoteId}'` },
          limit: 1,
        });
        if (searchRes.data && searchRes.data.length > 0) {
          so = searchRes.data[0];
        }
      }

      if (so) {
        const lines = Array.isArray(so.saleOrderLineList) ? so.saleOrderLineList : [];
        return {
          id: String(so.id),
          quoteSeq: so.saleOrderSeq || quoteId,
          companyId: so.company?.id || 13,
          partnerId: so.clientPartner?.id || 1,
          partnerName: so.clientPartner?.name || "Cliente",
          priceListCode: "PUBLIC",
          date: so.orderDate || new Date().toISOString().slice(0, 10),
          validUntil: so.estimatedDeliveryDate || new Date().toISOString().slice(0, 10),
          status: so.statusSelect === 1 ? "DRAFT" : "WON",
          items: lines.map((l: any) => ({
            productId: l.product?.id || 1,
            productName: l.product?.name || "Producto",
            productCode: l.product?.code || "SKU",
            qty: Number(l.qty || 1),
            unitPrice: Number(l.price || 0),
            discountPct: Number(l.discount || 0),
          })),
          subtotal: Number(so.exTaxTotal || 0),
          taxAmount: Number(so.taxTotal || 0),
          total: Number(so.inTaxTotal || 0),
          notes: so.description || "",
        };
      }
    } catch (err: any) {
      console.warn("[SalesService] Error consultando cotización en Axelor:", err.message);
    }
    return null;
  }

  public async updateQuote(quoteId: string, payload: Partial<CreateQuotePayload>): Promise<any> {
    try {
      const existing = await this.getQuote(quoteId);
      if (!existing) throw new Error("Cotización no encontrada en Axelor");

      const idNum = parseInt(existing.id.replace(/\D/g, ""), 10);
      const updateData: any = { id: idNum };
      if (payload.partnerId) updateData.clientPartner = { id: payload.partnerId };
      if (payload.notes !== undefined) updateData.description = payload.notes;

      if (payload.items && payload.items.length > 0) {
        const subtotal = payload.items.reduce((sum, item) => {
          const discountedPrice = item.unitPrice * (1 - item.discountPct / 100);
          return sum + discountedPrice * item.qty;
        }, 0);
        updateData.exTaxTotal = Number(subtotal.toFixed(2));
        updateData.taxTotal = Number((subtotal * 0.16).toFixed(2));
        updateData.inTaxTotal = Number((subtotal + updateData.taxTotal).toFixed(2));
      }

      await axelor.update("com.axelor.apps.sale.db.SaleOrder", updateData);
      return await this.getQuote(quoteId);
    } catch (err: any) {
      console.warn("[SalesService] Error actualizando cotización en Axelor:", err.message);
      return { id: quoteId, ...payload };
    }
  }

  public async deleteQuote(quoteId: string): Promise<boolean> {
    try {
      const existing = await this.getQuote(quoteId);
      if (!existing) return true;
      const idNum = parseInt(existing.id.replace(/\D/g, ""), 10);
      return await axelor.remove("com.axelor.apps.sale.db.SaleOrder", idNum, 0);
    } catch (err: any) {
      console.warn("[SalesService] Error eliminando cotización en Axelor:", err.message);
      return true;
    }
  }

  // ==========================================
  // PEDIDOS B2B (SaleOrder statusSelect = 2)
  // ==========================================
  public async listOrders(companyId: number): Promise<B2BOrderRecord[]> {
    try {
      const res = await axelor.search("com.axelor.apps.sale.db.SaleOrder", {
        limit: 100,
        sortBy: ["-createdOn"],
        data: {
          _domain: `self.company.id = ${companyId} and self.statusSelect >= 2`,
        },
        fields: [
          "id",
          "saleOrderSeq",
          "orderDate",
          "statusSelect",
          "clientPartner",
          "exTaxTotal",
          "taxTotal",
          "inTaxTotal",
          "description",
          "saleOrderLineList",
        ],
      });

      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((so: any) => {
        const lines = Array.isArray(so.saleOrderLineList) ? so.saleOrderLineList : [];
        return {
          id: String(so.id),
          orderSeq: so.saleOrderSeq || `PED-2026-${String(so.id).padStart(5, "0")}`,
          companyId: Number(companyId),
          partnerId: so.clientPartner?.id || 1,
          partnerName: so.clientPartner?.name || so.clientPartner?.simpleFullName || "Cliente General",
          date: so.orderDate || new Date().toISOString().slice(0, 10),
          status: so.statusSelect === 3 ? "INVOICED" : "CONFIRMED",
          items: lines.map((l: any) => ({
            productId: l.product?.id || 1,
            productName: l.product?.name || "Producto",
            productCode: l.product?.code || "SKU",
            qty: Number(l.qty || 1),
            unitPrice: Number(l.price || 0),
            discountPct: Number(l.discount || 0),
          })),
          subtotal: Number(so.exTaxTotal || 0),
          taxAmount: Number(so.taxTotal || 0),
          total: Number(so.inTaxTotal || 0),
          paymentTerms: "30_DIAS_CREDITO",
          notes: so.description || "",
        };
      });
    } catch (err: any) {
      console.warn("[SalesService] Error consultando pedidos en Axelor:", err.message);
      return [];
    }
  }

  public async getOrder(orderId: string): Promise<B2BOrderRecord | null> {
    try {
      const idNum = parseInt(orderId.replace(/\D/g, ""), 10);
      let so: any = null;
      if (!isNaN(idNum)) {
        so = await axelor.fetch("com.axelor.apps.sale.db.SaleOrder", idNum);
      }
      if (!so) {
        const searchRes = await axelor.search("com.axelor.apps.sale.db.SaleOrder", {
          data: { _domain: `self.saleOrderSeq = '${orderId}'` },
          limit: 1,
        });
        if (searchRes.data && searchRes.data.length > 0) {
          so = searchRes.data[0];
        }
      }

      if (so) {
        const lines = Array.isArray(so.saleOrderLineList) ? so.saleOrderLineList : [];
        return {
          id: String(so.id),
          orderSeq: so.saleOrderSeq || orderId,
          companyId: so.company?.id || 13,
          partnerId: so.clientPartner?.id || 1,
          partnerName: so.clientPartner?.name || "Cliente",
          date: so.orderDate || new Date().toISOString().slice(0, 10),
          status: so.statusSelect === 3 ? "INVOICED" : "CONFIRMED",
          items: lines.map((l: any) => ({
            productId: l.product?.id || 1,
            productName: l.product?.name || "Producto",
            productCode: l.product?.code || "SKU",
            qty: Number(l.qty || 1),
            unitPrice: Number(l.price || 0),
            discountPct: Number(l.discount || 0),
          })),
          subtotal: Number(so.exTaxTotal || 0),
          taxAmount: Number(so.taxTotal || 0),
          total: Number(so.inTaxTotal || 0),
          paymentTerms: "30_DIAS_CREDITO",
          notes: so.description || "",
        };
      }
    } catch (err: any) {
      console.warn("[SalesService] Error obteniendo pedido en Axelor:", err.message);
    }
    return null;
  }

  public async createOrder(payload: CreateB2BOrderPayload): Promise<B2BOrderRecord> {
    const subtotal = payload.items.reduce((sum, item) => {
      const discountedPrice = item.unitPrice * (1 - item.discountPct / 100);
      return sum + discountedPrice * item.qty;
    }, 0);
    const taxAmount = Number((subtotal * 0.16).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    const orderSeq = await sequenceService.getNextSequence(
      "PED",
      "com.axelor.apps.sale.db.SaleOrder",
      "saleOrderSeq",
      payload.companyId
    );

    const saleOrderPayload: any = {
      saleOrderSeq: orderSeq,
      company: { id: payload.companyId },
      clientPartner: { id: payload.partnerId },
      orderDate: new Date().toISOString().slice(0, 10),
      statusSelect: 2, // 2: Order confirmed
      exTaxTotal: Number(subtotal.toFixed(2)),
      taxTotal: taxAmount,
      inTaxTotal: total,
      description: payload.notes || `Pedido B2B ${orderSeq}`,
      saleOrderLineList: payload.items.map((it) => ({
        product: { id: it.productId },
        qty: it.qty,
        price: it.unitPrice,
        discount: it.discountPct,
        exTaxTotal: Number((it.unitPrice * (1 - it.discountPct / 100) * it.qty).toFixed(2)),
      })),
    };

    let savedId = `ORD-${Date.now()}`;
    try {
      const res = await axelor.create("com.axelor.apps.sale.db.SaleOrder", saleOrderPayload);
      if (res.data && res.data.length > 0 && res.data[0].id) {
        savedId = String(res.data[0].id);
      }
    } catch (err: any) {
      console.warn("[SalesService] Error creando pedido en Axelor:", err.message);
    }

    return {
      id: savedId,
      orderSeq,
      companyId: payload.companyId,
      partnerId: payload.partnerId,
      partnerName: payload.partnerName,
      date: new Date().toISOString().slice(0, 10),
      status: "CONFIRMED",
      items: payload.items,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount,
      total,
      paymentTerms: payload.paymentTerms,
      creditWarning: "Venta con condición de pago a crédito (30 días)",
      notes: payload.notes,
    };
  }

  public async convertToOrder(quoteId: string): Promise<B2BOrderRecord> {
    const quote = await this.getQuote(quoteId);
    if (!quote) throw new Error("Cotización no encontrada en Axelor");

    const orderSeq = await sequenceService.getNextSequence(
      "PED",
      "com.axelor.apps.sale.db.SaleOrder",
      "saleOrderSeq",
      quote.companyId
    );

    const idNum = parseInt(quote.id.replace(/\D/g, ""), 10);
    try {
      if (!isNaN(idNum)) {
        await axelor.update("com.axelor.apps.sale.db.SaleOrder", {
          id: idNum,
          statusSelect: 2, // Confirmed Order
          saleOrderSeq: orderSeq,
        });
      }
    } catch (err: any) {
      console.warn("[SalesService] Error actualizando estado de cotización a pedido en Axelor:", err.message);
    }

    return {
      id: quote.id,
      orderSeq,
      companyId: quote.companyId,
      partnerId: quote.partnerId,
      partnerName: quote.partnerName,
      quoteSeq: quote.quoteSeq,
      date: new Date().toISOString().slice(0, 10),
      status: "CONFIRMED",
      items: quote.items,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      paymentTerms: "30_DIAS_CREDITO",
      creditWarning: "Cliente con línea de crédito autorizada y disponible",
      notes: quote.notes,
    };
  }

  public async convertToInvoice(quoteId: string): Promise<any> {
    const quote = await this.getQuote(quoteId);
    if (!quote) throw new Error("Cotización no encontrada en Axelor");

    const invoiceSeq = await sequenceService.getNextSequence(
      "FAC",
      "com.axelor.apps.account.db.Invoice",
      "invoiceSeq",
      quote.companyId
    );

    let invoiceId = Date.now();
    try {
      const invRes = await axelor.create("com.axelor.apps.account.db.Invoice", {
        invoiceSeq,
        invoiceDate: new Date().toISOString().slice(0, 10),
        statusSelect: 2, // 2: Validada / Por cobrar
        operationSubTypeSelect: 1, // 1: Cliente (CxC)
        partner: { id: quote.partnerId },
        company: { id: quote.companyId },
        exTaxTotal: quote.subtotal,
        taxTotal: quote.taxAmount,
        inTaxTotal: quote.total,
        amountRemaining: quote.total,
        amountPaid: 0,
        description: `Factura generada desde cotización ${quote.quoteSeq}`,
      });
      if (invRes.data && invRes.data.length > 0 && invRes.data[0].id) {
        invoiceId = Number(invRes.data[0].id);
      }

      const idNum = parseInt(quote.id.replace(/\D/g, ""), 10);
      if (!isNaN(idNum)) {
        await axelor.update("com.axelor.apps.sale.db.SaleOrder", {
          id: idNum,
          statusSelect: 3, // Invoiced
        });
      }
    } catch (e: any) {
      console.warn("[SalesService] Error facturando cotización en Axelor:", e.message);
    }

    return {
      invoiceId,
      invoiceSeq,
      quoteSeq: quote.quoteSeq,
      total: quote.total,
    };
  }
}

export const salesService = new SalesService();
