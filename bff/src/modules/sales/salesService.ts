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
          _domain: `(self.company.id = ${companyId} or self.company.id = 1 or self.company.id = 13 or self.company is null) and (self.statusSelect = 1 or self.statusSelect is null)`,
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
      const soIds = list.map((so: any) => so.id).filter(Boolean);

      let allLinesMap: Record<number, any[]> = {};
      if (soIds.length > 0) {
        try {
          const linesRes = await axelor.search("com.axelor.apps.sale.db.SaleOrderLine", {
            data: { _domain: `self.saleOrder.id in (${soIds.join(",")})` },
            fields: ["id", "saleOrder", "product", "productName", "qty", "price", "discount", "exTaxTotal", "inTaxTotal", "unit"],
            limit: 500,
          });
          if (linesRes.data && Array.isArray(linesRes.data)) {
            for (const line of linesRes.data) {
              const soId = line.saleOrder?.id;
              if (soId) {
                if (!allLinesMap[soId]) allLinesMap[soId] = [];
                allLinesMap[soId].push(line);
              }
            }
          }
        } catch (e) {
          console.warn("[SalesService] Error cargando líneas en lote para cotizaciones:", e);
        }
      }

      return list.map((so: any) => {
        const lines = allLinesMap[so.id] || (Array.isArray(so.saleOrderLineList) ? so.saleOrderLineList : []);
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

  private async getCompanyCurrency(companyId?: number): Promise<{ id: number }> {
    if (companyId) {
      try {
        const comp = await axelor.fetch("com.axelor.apps.base.db.Company", companyId);
        if (comp && comp.currency?.id) {
          return { id: Number(comp.currency.id) };
        }
      } catch {}
    }
    return { id: 100 }; // Mexican Peso (MXN)
  }

  public async createQuote(payload: CreateQuotePayload): Promise<SaleQuoteRecord> {
    const subtotal = payload.items.reduce((sum, item) => {
      const discountedPrice = item.unitPrice * (1 - (item.discountPct || 0) / 100);
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

    let partnerVersion = 0;
    try {
      const partnerRes = await axelor.fetch("com.axelor.apps.base.db.Partner", payload.partnerId);
      if (partnerRes && partnerRes.version !== undefined) {
        partnerVersion = partnerRes.version;
      }
    } catch {}

    const currencyObj = await this.getCompanyCurrency(payload.companyId);
    const today = new Date().toISOString().slice(0, 10);
    const validUntilDate = payload.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

    const saleOrderPayload: any = {
      saleOrderSeq: quoteSeq,
      company: { id: payload.companyId || 13 },
      clientPartner: { id: payload.partnerId, version: partnerVersion },
      currency: currencyObj,
      creationDate: today,
      orderDate: today,
      estimatedDeliveryDate: validUntilDate,
      statusSelect: 1, // 1: Draft / Devis
      exTaxTotal: Number(subtotal.toFixed(2)),
      taxTotal: taxAmount,
      inTaxTotal: total,
      description: payload.notes || `Cotización B2B ${quoteSeq}`,
      saleOrderLineList: payload.items.map((it) => ({
        product: { id: it.productId },
        productName: it.productName || "Producto",
        qty: it.qty,
        price: it.unitPrice,
        discount: it.discountPct || 0,
        exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
        unit: { id: 1 },
      })),
    };

    let savedId = `QUO-${Date.now()}`;
    try {
      const res = await axelor.create("com.axelor.apps.sale.db.SaleOrder", saleOrderPayload);
      const createdItem = Array.isArray(res.data) ? res.data[0] : res.data;
      if (createdItem && createdItem.id) {
        savedId = String(createdItem.id);
      }
    } catch (err: any) {
      console.error("[SalesService] Error creando cotización en Axelor:", err.message);
      throw err;
    }

    return {
      id: savedId,
      quoteSeq,
      companyId: payload.companyId || 13,
      partnerId: payload.partnerId,
      partnerName: payload.partnerName,
      priceListCode: payload.priceListCode,
      date: today,
      validUntil: validUntilDate,
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
        let lines: any[] = [];
        try {
          const linesRes = await axelor.search("com.axelor.apps.sale.db.SaleOrderLine", {
            data: { _domain: `self.saleOrder.id = ${so.id}` },
            fields: ["id", "product", "productName", "qty", "price", "discount", "exTaxTotal", "inTaxTotal", "unit"],
            limit: 50,
          });
          if (linesRes.data && Array.isArray(linesRes.data) && linesRes.data.length > 0) {
            lines = linesRes.data;
          }
        } catch {}

        if (lines.length === 0 && Array.isArray(so.saleOrderLineList)) {
          lines = so.saleOrderLineList;
        }

        return {
          id: String(so.id),
          quoteSeq: so.saleOrderSeq || `COT-2026-${String(so.id).padStart(5, "0")}`,
          companyId: so.company?.id || 13,
          partnerId: so.clientPartner?.id || 1,
          partnerName: so.clientPartner?.name || so.clientPartner?.simpleFullName || "Cliente General",
          priceListCode: "PUBLIC",
          date: so.orderDate || new Date().toISOString().slice(0, 10),
          validUntil: so.estimatedDeliveryDate || new Date().toISOString().slice(0, 10),
          status: so.statusSelect === 1 ? "DRAFT" : "WON",
          items: lines.map((l: any) => ({
            productId: l.product?.id || 1,
            productName: l.productName || l.product?.name || "Producto",
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
      console.warn("[SalesService] Error obteniendo cotización en Axelor:", err.message);
    }
    return null;
  }

  public async updateQuote(quoteId: string, payload: Partial<CreateQuotePayload>): Promise<any> {
    try {
      const existing = await this.getQuote(quoteId);
      if (!existing) throw new Error("Cotización no encontrada en Axelor");

      const idNum = parseInt(existing.id.replace(/\D/g, ""), 10);
      let soVersion = 0;
      try {
        const soRaw = await axelor.fetch("com.axelor.apps.sale.db.SaleOrder", idNum);
        if (soRaw && soRaw.version !== undefined) soVersion = soRaw.version;
      } catch {}

      const updateData: any = { id: idNum, version: soVersion };
      if (payload.partnerId) updateData.clientPartner = { id: payload.partnerId };
      if (payload.notes !== undefined) updateData.description = payload.notes;

      if (payload.items && payload.items.length > 0) {
        const subtotal = payload.items.reduce((sum, item) => {
          const discountedPrice = item.unitPrice * (1 - (item.discountPct || 0) / 100);
          return sum + discountedPrice * item.qty;
        }, 0);
        updateData.exTaxTotal = Number(subtotal.toFixed(2));
        updateData.taxTotal = Number((subtotal * 0.16).toFixed(2));
        updateData.inTaxTotal = Number((subtotal + updateData.taxTotal).toFixed(2));
        updateData.saleOrderLineList = payload.items.map((it) => ({
          product: { id: it.productId },
          productName: it.productName || "Producto",
          qty: it.qty,
          price: it.unitPrice,
          discount: it.discountPct || 0,
          exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
          unit: { id: 1 },
        }));
      }

      await axelor.update("com.axelor.apps.sale.db.SaleOrder", updateData);
      return await this.getQuote(quoteId);
    } catch (err: any) {
      console.error("[SalesService] Error actualizando cotización en Axelor:", err.message);
      throw err;
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
          _domain: `(self.company.id = ${companyId} or self.company.id = 1 or self.company.id = 13 or self.company is null) and self.statusSelect >= 2`,
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
      const soIds = list.map((so: any) => so.id).filter(Boolean);

      let allLinesMap: Record<number, any[]> = {};
      if (soIds.length > 0) {
        try {
          const linesRes = await axelor.search("com.axelor.apps.sale.db.SaleOrderLine", {
            data: { _domain: `self.saleOrder.id in (${soIds.join(",")})` },
            fields: ["id", "saleOrder", "product", "productName", "qty", "price", "discount", "exTaxTotal", "inTaxTotal", "unit"],
            limit: 500,
          });
          if (linesRes.data && Array.isArray(linesRes.data)) {
            for (const line of linesRes.data) {
              const soId = line.saleOrder?.id;
              if (soId) {
                if (!allLinesMap[soId]) allLinesMap[soId] = [];
                allLinesMap[soId].push(line);
              }
            }
          }
        } catch (e) {
          console.warn("[SalesService] Error cargando líneas en lote para pedidos:", e);
        }
      }

      return list.map((so: any) => {
        const lines = allLinesMap[so.id] || (Array.isArray(so.saleOrderLineList) ? so.saleOrderLineList : []);
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
            productName: l.productName || l.product?.name || "Producto",
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
        let lines: any[] = [];
        try {
          const linesRes = await axelor.search("com.axelor.apps.sale.db.SaleOrderLine", {
            data: { _domain: `self.saleOrder.id = ${so.id}` },
            fields: ["id", "product", "productName", "qty", "price", "discount", "exTaxTotal", "inTaxTotal", "unit"],
            limit: 50,
          });
          if (linesRes.data && Array.isArray(linesRes.data) && linesRes.data.length > 0) {
            lines = linesRes.data;
          }
        } catch {}

        if (lines.length === 0 && Array.isArray(so.saleOrderLineList)) {
          lines = so.saleOrderLineList;
        }

        return {
          id: String(so.id),
          orderSeq: so.saleOrderSeq || orderId,
          companyId: so.company?.id || 13,
          partnerId: so.clientPartner?.id || 1,
          partnerName: so.clientPartner?.name || so.clientPartner?.simpleFullName || "Cliente General",
          date: so.orderDate || new Date().toISOString().slice(0, 10),
          status: so.statusSelect === 3 ? "INVOICED" : "CONFIRMED",
          items: lines.map((l: any) => ({
            productId: l.product?.id || 1,
            productName: l.productName || l.product?.name || "Producto",
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
      const discountedPrice = item.unitPrice * (1 - (item.discountPct || 0) / 100);
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

    let partnerVersion = 0;
    try {
      const partnerRes = await axelor.fetch("com.axelor.apps.base.db.Partner", payload.partnerId);
      if (partnerRes && partnerRes.version !== undefined) {
        partnerVersion = partnerRes.version;
      }
    } catch {}

    const currencyObj = await this.getCompanyCurrency(payload.companyId);
    const today = new Date().toISOString().slice(0, 10);

    const saleOrderPayload: any = {
      saleOrderSeq: orderSeq,
      company: { id: payload.companyId || 13 },
      clientPartner: { id: payload.partnerId, version: partnerVersion },
      currency: currencyObj,
      creationDate: today,
      orderDate: today,
      statusSelect: 2, // 2: Order confirmed
      exTaxTotal: Number(subtotal.toFixed(2)),
      taxTotal: taxAmount,
      inTaxTotal: total,
      description: payload.notes || `Pedido B2B ${orderSeq}`,
      saleOrderLineList: payload.items.map((it) => ({
        product: { id: it.productId },
        productName: it.productName || "Producto",
        qty: it.qty,
        price: it.unitPrice,
        discount: it.discountPct || 0,
        exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
        unit: { id: 1 },
      })),
    };

    let savedId = `ORD-${Date.now()}`;
    try {
      const res = await axelor.create("com.axelor.apps.sale.db.SaleOrder", saleOrderPayload);
      if (res.data && res.data.length > 0 && res.data[0].id) {
        savedId = String(res.data[0].id);
      }
    } catch (err: any) {
      console.error("[SalesService] Error creando pedido en Axelor:", err.message);
      throw err;
    }

    return {
      id: savedId,
      orderSeq,
      companyId: payload.companyId || 13,
      partnerId: payload.partnerId,
      partnerName: payload.partnerName,
      date: today,
      status: "CONFIRMED",
      items: payload.items,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount,
      total,
      paymentTerms: payload.paymentTerms || "30_DIAS_CREDITO",
      creditWarning: "Venta con condición de pago a crédito (30 días)",
      notes: payload.notes,
    };
  }

  public async createDirectInvoice(payload: {
    companyId: number;
    partnerId: number;
    partnerName: string;
    items: SaleQuoteItem[];
    paymentTerms?: string;
    notes?: string;
  }): Promise<any> {
    const today = new Date().toISOString().slice(0, 10);
    const subtotal = payload.items.reduce(
      (sum, it) => sum + (it.qty || 1) * (it.unitPrice || 0) * (1 - (it.discountPct || 0) / 100),
      0
    );
    const taxAmount = Number((subtotal * 0.16).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    const currencyObj = await this.getCompanyCurrency(payload.companyId || 13);
    let partnerVersion = 0;
    try {
      const partnerRes = await axelor.fetch("com.axelor.apps.base.db.Partner", payload.partnerId);
      if (partnerRes && partnerRes.version !== undefined) {
        partnerVersion = partnerRes.version;
      }
    } catch {}

    // 1. Create Pedido B2B
    const orderSeq = await sequenceService.getNextSequence(
      "PED",
      "com.axelor.apps.sale.db.SaleOrder",
      "saleOrderSeq",
      payload.companyId || 13
    );

    let orderId = Date.now();
    try {
      const soRes = await axelor.create("com.axelor.apps.sale.db.SaleOrder", {
        saleOrderSeq: orderSeq,
        orderDate: today,
        statusSelect: 3, // Invoiced
        company: { id: payload.companyId || 13 },
        currency: currencyObj,
        clientPartner: { id: payload.partnerId, version: partnerVersion },
        mainPartner: { id: payload.partnerId, version: partnerVersion },
        exTaxTotal: subtotal,
        taxTotal: taxAmount,
        inTaxTotal: total,
        description: `Factura Rápida B2B: ${payload.notes || "Venta Directa"}`,
      });

      if (soRes.data && soRes.data.length > 0 && soRes.data[0].id) {
        orderId = Number(soRes.data[0].id);

        for (const it of payload.items) {
          try {
            await axelor.create("com.axelor.apps.sale.db.SaleOrderLine", {
              saleOrder: { id: orderId },
              product: { id: it.productId },
              productName: it.productName || "Producto",
              price: it.unitPrice,
              qty: it.qty,
              discount: it.discountPct || 0,
              exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
              unit: { id: 1 },
            });
          } catch {}
        }
      }
    } catch (e: any) {
      console.warn("[SalesService] Error creando pedido para factura rápida:", e.message);
    }

    // 2. Create Factura Fiscal
    const invoiceSeq = await sequenceService.getNextSequence(
      "FAC",
      "com.axelor.apps.account.db.Invoice",
      "invoiceId",
      payload.companyId || 13
    );

    let invoiceId = Date.now();
    try {
      const invRes = await axelor.create("com.axelor.apps.account.db.Invoice", {
        invoiceId: invoiceSeq,
        invoiceDate: today,
        statusSelect: 2, // 2: Validada / Por cobrar
        operationTypeSelect: 1, // 1: Cliente (CxC)
        operationSubTypeSelect: 1, // 1: Factura Estándar
        saleOrder: { id: orderId },
        partner: { id: payload.partnerId, version: partnerVersion },
        company: { id: payload.companyId || 13 },
        currency: currencyObj,
        exTaxTotal: subtotal,
        taxTotal: taxAmount,
        inTaxTotal: total,
        amountRemaining: total,
        amountPaid: 0,
        specificNotes: `Factura Rápida B2B (Pedido: ${orderSeq})`,
        description: `Factura Rápida B2B (Pedido: ${orderSeq})`,
      });

      if (invRes.data && invRes.data.length > 0 && invRes.data[0].id) {
        invoiceId = Number(invRes.data[0].id);

        for (const it of payload.items) {
          try {
            await axelor.create("com.axelor.apps.account.db.InvoiceLine", {
              invoice: { id: invoiceId },
              product: { id: it.productId },
              productName: it.productName || "Producto",
              price: it.unitPrice,
              qty: it.qty,
              discount: it.discountPct || 0,
              exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
              unit: { id: 1 },
            });
          } catch {}
        }
      }
    } catch (e: any) {
      console.warn("[SalesService] Error creando factura rápida en Axelor:", e.message);
    }

    return {
      orderId,
      orderSeq,
      invoiceId,
      invoiceSeq,
      total,
      partnerName: payload.partnerName,
    };
  }

  public async convertToOrder(quoteId: string): Promise<B2BOrderRecord> {
    const quote = await this.getQuote(quoteId);
    if (!quote) throw new Error("Cotización no encontrada en Axelor");

    const currencyObj = await this.getCompanyCurrency(quote.companyId);
    let partnerVersion = 0;
    try {
      const partnerRes = await axelor.fetch("com.axelor.apps.base.db.Partner", quote.partnerId);
      if (partnerRes && partnerRes.version !== undefined) {
        partnerVersion = partnerRes.version;
      }
    } catch {}

    const orderSeq = await sequenceService.getNextSequence(
      "PED",
      "com.axelor.apps.sale.db.SaleOrder",
      "saleOrderSeq",
      quote.companyId
    );

    let orderId = Date.now();
    try {
      const soRes = await axelor.create("com.axelor.apps.sale.db.SaleOrder", {
        saleOrderSeq: orderSeq,
        orderDate: new Date().toISOString().slice(0, 10),
        statusSelect: 2, // Confirmed Order
        company: { id: quote.companyId || 13 },
        currency: currencyObj,
        clientPartner: { id: quote.partnerId, version: partnerVersion },
        mainPartner: { id: quote.partnerId, version: partnerVersion },
        exTaxTotal: quote.subtotal,
        taxTotal: quote.taxAmount,
        inTaxTotal: quote.total,
        description: `Cotización Origen: ${quote.quoteSeq}`,
      });

      if (soRes.data && soRes.data.length > 0 && soRes.data[0].id) {
        orderId = Number(soRes.data[0].id);

        if (quote.items && quote.items.length > 0) {
          for (const it of quote.items) {
            try {
              await axelor.create("com.axelor.apps.sale.db.SaleOrderLine", {
                saleOrder: { id: orderId },
                product: { id: it.productId },
                productName: it.productName || "Producto",
                price: it.unitPrice,
                qty: it.qty,
                discount: it.discountPct || 0,
                exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
                unit: { id: 1 },
              });
            } catch {}
          }
        }
      }
    } catch (err: any) {
      console.warn("[SalesService] Error creando pedido desde cotización:", err.message);
    }

    // Mark quote as WON/CONVERTED
    const quoteIdNum = parseInt(quote.id.replace(/\D/g, ""), 10);
    if (!isNaN(quoteIdNum)) {
      try {
        let quoteVer = 0;
        const qRaw = await axelor.fetch("com.axelor.apps.sale.db.SaleOrder", quoteIdNum);
        if (qRaw && qRaw.version !== undefined) quoteVer = qRaw.version;
        await axelor.update("com.axelor.apps.sale.db.SaleOrder", {
          id: quoteIdNum,
          version: quoteVer,
          statusSelect: 2, // Converted to Order
        });
      } catch {}
    }

    return {
      id: String(orderId),
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

    const currencyObj = await this.getCompanyCurrency(quote.companyId);
    let partnerVersion = 0;
    try {
      const partnerRes = await axelor.fetch("com.axelor.apps.base.db.Partner", quote.partnerId);
      if (partnerRes && partnerRes.version !== undefined) {
        partnerVersion = partnerRes.version;
      }
    } catch {}

    // 1. Create or ensure PED-... order record exists in Pedidos B2B
    const orderSeq = await sequenceService.getNextSequence(
      "PED",
      "com.axelor.apps.sale.db.SaleOrder",
      "saleOrderSeq",
      quote.companyId
    );

    let orderId = Date.now();
    try {
      const soRes = await axelor.create("com.axelor.apps.sale.db.SaleOrder", {
        saleOrderSeq: orderSeq,
        orderDate: new Date().toISOString().slice(0, 10),
        statusSelect: 3, // Invoiced
        company: { id: quote.companyId || 13 },
        currency: currencyObj,
        clientPartner: { id: quote.partnerId, version: partnerVersion },
        mainPartner: { id: quote.partnerId, version: partnerVersion },
        exTaxTotal: quote.subtotal,
        taxTotal: quote.taxAmount,
        inTaxTotal: quote.total,
        description: `Cotización Origen: ${quote.quoteSeq}`,
      });

      if (soRes.data && soRes.data.length > 0 && soRes.data[0].id) {
        orderId = Number(soRes.data[0].id);

        if (quote.items && quote.items.length > 0) {
          for (const it of quote.items) {
            try {
              await axelor.create("com.axelor.apps.sale.db.SaleOrderLine", {
                saleOrder: { id: orderId },
                product: { id: it.productId },
                productName: it.productName || "Producto",
                price: it.unitPrice,
                qty: it.qty,
                discount: it.discountPct || 0,
                exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
                unit: { id: 1 },
              });
            } catch {}
          }
        }
      }
    } catch (e: any) {
      console.warn("[SalesService] Error creando pedido para cotización:", e.message);
    }

    // 2. Mark the quote as CONVERTED (statusSelect: 3)
    const quoteIdNum = parseInt(quote.id.replace(/\D/g, ""), 10);
    if (!isNaN(quoteIdNum)) {
      try {
        let quoteVer = 0;
        const qRaw = await axelor.fetch("com.axelor.apps.sale.db.SaleOrder", quoteIdNum);
        if (qRaw && qRaw.version !== undefined) quoteVer = qRaw.version;
        await axelor.update("com.axelor.apps.sale.db.SaleOrder", {
          id: quoteIdNum,
          version: quoteVer,
          statusSelect: 3, // Invoiced / Converted
        });
      } catch {}
    }

    // 3. Create Factura Fiscal FAC-... linked to BOTH the Order and Quote
    const invoiceSeq = await sequenceService.getNextSequence(
      "FAC",
      "com.axelor.apps.account.db.Invoice",
      "invoiceId",
      quote.companyId
    );

    let invoiceId = Date.now();
    try {
      const invRes = await axelor.create("com.axelor.apps.account.db.Invoice", {
        invoiceId: invoiceSeq,
        invoiceDate: new Date().toISOString().slice(0, 10),
        statusSelect: 2, // 2: Validada / Por cobrar
        operationTypeSelect: 1, // 1: Cliente (CxC)
        operationSubTypeSelect: 1, // 1: Factura Estándar
        saleOrder: { id: orderId },
        partner: { id: quote.partnerId, version: partnerVersion },
        company: { id: quote.companyId || 13 },
        currency: currencyObj,
        exTaxTotal: quote.subtotal,
        taxTotal: quote.taxAmount,
        inTaxTotal: quote.total,
        amountRemaining: quote.total,
        amountPaid: 0,
        specificNotes: `Pedido Origen: ${orderSeq} (Cotización: ${quote.quoteSeq})`,
        description: `Pedido Origen: ${orderSeq} | Cotización: ${quote.quoteSeq}`,
      });

      if (invRes.data && invRes.data.length > 0 && invRes.data[0].id) {
        invoiceId = Number(invRes.data[0].id);

        if (quote.items && quote.items.length > 0) {
          for (const it of quote.items) {
            try {
              await axelor.create("com.axelor.apps.account.db.InvoiceLine", {
                invoice: { id: invoiceId },
                product: { id: it.productId },
                productName: it.productName || "Producto",
                price: it.unitPrice,
                qty: it.qty,
                discount: it.discountPct || 0,
                exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
                unit: { id: 1 },
              });
            } catch {}
          }
        }
      }
    } catch (e: any) {
      console.warn("[SalesService] Error facturando cotización en Axelor:", e.message);
    }

    return {
      quoteSeq: quote.quoteSeq,
      orderSeq,
      orderId,
      invoiceSeq,
      invoiceId,
      total: quote.total,
    };
  }

  public async convertOrderToInvoice(orderId: string): Promise<any> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error("Pedido no encontrado en Axelor");

    const invoiceSeq = await sequenceService.getNextSequence(
      "FAC",
      "com.axelor.apps.account.db.Invoice",
      "invoiceId",
      order.companyId
    );

    const currencyObj = await this.getCompanyCurrency(order.companyId);
    let partnerVersion = 0;
    try {
      const partnerRes = await axelor.fetch("com.axelor.apps.base.db.Partner", order.partnerId);
      if (partnerRes && partnerRes.version !== undefined) {
        partnerVersion = partnerRes.version;
      }
    } catch {}

    const idNum = parseInt(order.id.replace(/\D/g, ""), 10);
    let invoiceId = Date.now();
    try {
      const invRes = await axelor.create("com.axelor.apps.account.db.Invoice", {
        invoiceId: invoiceSeq,
        invoiceDate: new Date().toISOString().slice(0, 10),
        statusSelect: 2, // 2: Validada / Por cobrar
        operationTypeSelect: 1, // 1: Cliente (CxC)
        operationSubTypeSelect: 1, // 1: Factura Estándar
        saleOrder: !isNaN(idNum) ? { id: idNum } : undefined,
        partner: { id: order.partnerId, version: partnerVersion },
        company: { id: order.companyId || 13 },
        currency: currencyObj,
        exTaxTotal: order.subtotal,
        taxTotal: order.taxAmount,
        inTaxTotal: order.total,
        amountRemaining: order.total,
        amountPaid: 0,
        specificNotes: `Pedido Origen: ${order.orderSeq}${order.quoteSeq ? ` (Cotización: ${order.quoteSeq})` : ""}`,
        description: `Pedido Origen: ${order.orderSeq}${order.quoteSeq ? ` | Cotización: ${order.quoteSeq}` : ""}`,
      });
      if (invRes.data && invRes.data.length > 0 && invRes.data[0].id) {
        invoiceId = Number(invRes.data[0].id);

        if (order.items && order.items.length > 0) {
          for (const it of order.items) {
            try {
              await axelor.create("com.axelor.apps.account.db.InvoiceLine", {
                invoice: { id: invoiceId },
                product: { id: it.productId },
                productName: it.productName || "Producto",
                price: it.unitPrice,
                qty: it.qty,
                discount: it.discountPct || 0,
                exTaxTotal: Number((it.unitPrice * (1 - (it.discountPct || 0) / 100) * it.qty).toFixed(2)),
                unit: { id: 1 },
              });
            } catch {}
          }
        }
      }

      if (!isNaN(idNum)) {
        let soVersion = 0;
        try {
          const soRaw = await axelor.fetch("com.axelor.apps.sale.db.SaleOrder", idNum);
          if (soRaw && soRaw.version !== undefined) soVersion = soRaw.version;
        } catch {}

        await axelor.update("com.axelor.apps.sale.db.SaleOrder", {
          id: idNum,
          version: soVersion,
          statusSelect: 3, // Invoiced
        });
      }
    } catch (e: any) {
      console.warn("[SalesService] Error facturando pedido en Axelor:", e.message);
    }

    return {
      invoiceId,
      invoiceSeq,
      orderSeq: order.orderSeq,
      total: order.total,
    };
  }

  // ==========================================
  // FACTURAS DE VENTA (Invoice operationTypeSelect = 1)
  // ==========================================
  public async listInvoices(companyId: number): Promise<any[]> {
    try {
      const res = await axelor.search("com.axelor.apps.account.db.Invoice", {
        limit: 100,
        sortBy: ["-createdOn", "-invoiceDate"],
        data: {
          _domain: `(self.company.id = ${companyId} or self.company.id = 1 or self.company.id = 13 or self.company is null) and (self.operationTypeSelect = 1 or self.operationSubTypeSelect = 1)`,
        },
        fields: [
          "id",
          "invoiceId",
          "invoiceSeq",
          "invoiceDate",
          "dueDate",
          "partner",
          "company",
          "currency",
          "saleOrder",
          "exTaxTotal",
          "taxTotal",
          "inTaxTotal",
          "amountRemaining",
          "amountPaid",
          "statusSelect",
          "specificNotes",
          "description",
        ],
      });

      const list = Array.isArray(res.data) ? res.data : [];
      return list.map((inv: any) => {
        const notesStr = `${inv.description || ""} ${inv.specificNotes || ""}`;
        const soSeq = inv.saleOrder?.saleOrderSeq || inv.saleOrder?.fullName || "";
        const isQuote = soSeq.includes("COT-") || notesStr.includes("COT-") || notesStr.includes("Cotización");
        const isOrder = soSeq.includes("PED-") || notesStr.includes("PED-") || notesStr.includes("Pedido");
        const isDirect = !inv.saleOrder && !isQuote && !isOrder;

        let originSummary = "Venta Directa";
        let originBadgeType = "DIRECT";
        if (isQuote) {
          const m = notesStr.match(/COT-\d{4}-\d+/)?.[0] || (soSeq.includes("COT-") ? soSeq.match(/COT-\d{4}-\d+/)?.[0] : "");
          originSummary = `Cotización ${m || ""}`.trim();
          originBadgeType = "QUOTE";
        } else if (isOrder) {
          const m = notesStr.match(/PED-\d{4}-\d+/)?.[0] || (soSeq.includes("PED-") ? soSeq.match(/PED-\d{4}-\d+/)?.[0] : "");
          originSummary = `Pedido ${m || ""}`.trim();
          originBadgeType = "ORDER";
        }

        return {
          id: String(inv.id),
          invoiceSeq: inv.invoiceId || inv.invoiceSeq || `FAC-2026-${String(inv.id).padStart(5, "0")}`,
          companyId: Number(companyId),
          partnerId: inv.partner?.id || 1,
          partnerName: inv.partner?.name || inv.partner?.simpleFullName || inv.partner?.fullName || "Cliente General",
          date: inv.invoiceDate || new Date().toISOString().slice(0, 10),
          dueDate: inv.dueDate || inv.specificNotes || inv.invoiceDate || new Date().toISOString().slice(0, 10),
          status: Number(inv.amountRemaining) <= 0 && Number(inv.amountPaid) > 0 ? "PAID" : inv.statusSelect === 2 ? "OPEN" : "DRAFT",
          subtotal: Number(inv.exTaxTotal || 0),
          taxAmount: Number(inv.taxTotal || 0),
          total: Number(inv.inTaxTotal || 0),
          amountPaid: Number(inv.amountPaid || 0),
          amountRemaining: Number(inv.amountRemaining ?? inv.inTaxTotal ?? 0),
          notes: inv.description || inv.specificNotes || "",
          originType: isDirect ? "DIRECT_SALE" : "B2B_FLOW",
          originSummary,
          originBadgeType,
        };
      });
    } catch (err: any) {
      console.warn("[SalesService] Error consultando facturas de venta en Axelor:", err.message);
      return [];
    }
  }

  public async getInvoice(invoiceId: string): Promise<any | null> {
    try {
      const idNum = parseInt(invoiceId.replace(/\D/g, ""), 10);
      let inv: any = null;
      if (!isNaN(idNum)) {
        inv = await axelor.fetch("com.axelor.apps.account.db.Invoice", idNum);
      }
      if (!inv) {
        const searchRes = await axelor.search("com.axelor.apps.account.db.Invoice", {
          data: { _domain: `self.invoiceId = '${invoiceId}' or self.invoiceSeq = '${invoiceId}'` },
          limit: 1,
        });
        if (searchRes.data && searchRes.data.length > 0) {
          inv = searchRes.data[0];
        }
      }

      if (inv) {
        let lines: any[] = [];
        try {
          const linesRes = await axelor.search("com.axelor.apps.account.db.InvoiceLine", {
            data: { _domain: `self.invoice.id = ${inv.id}` },
            fields: ["id", "product", "productName", "qty", "price", "discount", "exTaxTotal", "inTaxTotal", "unit"],
            limit: 50,
          });
          if (linesRes.data && Array.isArray(linesRes.data) && linesRes.data.length > 0) {
            lines = linesRes.data;
          }
        } catch {}

        let linkedSO: any = null;
        if (inv.saleOrder?.id) {
          try {
            linkedSO = await axelor.fetch("com.axelor.apps.sale.db.SaleOrder", inv.saleOrder.id);
          } catch {}
        }

        if (lines.length === 0 && linkedSO?.id) {
          try {
            const solRes = await axelor.search("com.axelor.apps.sale.db.SaleOrderLine", {
              data: { _domain: `self.saleOrder.id = ${linkedSO.id}` },
              fields: ["id", "product", "productName", "qty", "price", "discount", "exTaxTotal", "inTaxTotal", "unit"],
              limit: 50,
            });
            if (solRes.data && solRes.data.length > 0) {
              lines = solRes.data;
            }
          } catch {}
        }

        const notesStr = `${inv.description || ""} ${inv.specificNotes || ""}`;
        const isLinkedToQuote = (linkedSO?.saleOrderSeq && linkedSO.saleOrderSeq.startsWith("COT")) || notesStr.includes("COT-") || notesStr.includes("Cotización");
        const isLinkedToOrder = (linkedSO?.saleOrderSeq && linkedSO.saleOrderSeq.startsWith("PED")) || notesStr.includes("PED-") || notesStr.includes("Pedido");
        const isDirectSale = !linkedSO && !isLinkedToQuote && !isLinkedToOrder;

        let quoteTracking = null;
        if (isLinkedToQuote) {
          const quoteSeqMatch = notesStr.match(/COT-\d{4}-\d+/)?.[0] || (linkedSO?.saleOrderSeq?.startsWith("COT") ? linkedSO.saleOrderSeq : undefined);
          quoteTracking = {
            id: linkedSO?.id ? String(linkedSO.id) : (quoteSeqMatch || "COT-ORIGEN"),
            quoteSeq: quoteSeqMatch || linkedSO?.saleOrderSeq || "COT-COMERCIAL",
            date: linkedSO?.orderDate || linkedSO?.creationDate || inv.invoiceDate,
            total: Number(linkedSO?.inTaxTotal || inv.inTaxTotal || 0),
            status: "CONVERTED",
          };
        }

        let orderTracking = null;
        if (isLinkedToOrder) {
          const orderSeqMatch = notesStr.match(/PED-\d{4}-\d+/)?.[0] || (linkedSO?.saleOrderSeq?.startsWith("PED") ? linkedSO.saleOrderSeq : undefined);
          orderTracking = {
            id: linkedSO?.id ? String(linkedSO.id) : (orderSeqMatch || "PED-ORIGEN"),
            orderSeq: orderSeqMatch || linkedSO?.saleOrderSeq || "PED-B2B",
            date: linkedSO?.orderDate || inv.invoiceDate,
            total: Number(linkedSO?.inTaxTotal || inv.inTaxTotal || 0),
            paymentTerms: "30_DIAS_CREDITO",
            status: "INVOICED",
          };
        }

        return {
          id: String(inv.id),
          invoiceSeq: inv.invoiceId || inv.invoiceSeq || `FAC-2026-${String(inv.id).padStart(5, "0")}`,
          companyId: inv.company?.id || 13,
          partnerId: inv.partner?.id || 1,
          partnerName: inv.partner?.name || inv.partner?.simpleFullName || inv.partner?.fullName || "Cliente General",
          date: inv.invoiceDate || new Date().toISOString().slice(0, 10),
          dueDate: inv.dueDate || inv.specificNotes || inv.invoiceDate || new Date().toISOString().slice(0, 10),
          status: Number(inv.amountRemaining) <= 0 && Number(inv.amountPaid) > 0 ? "PAID" : inv.statusSelect === 2 ? "OPEN" : "DRAFT",
          subtotal: Number(inv.exTaxTotal || 0),
          taxAmount: Number(inv.taxTotal || 0),
          total: Number(inv.inTaxTotal || 0),
          amountPaid: Number(inv.amountPaid || 0),
          amountRemaining: Number(inv.amountRemaining ?? inv.inTaxTotal ?? 0),
          notes: inv.description || inv.specificNotes || "",
          items: lines.map((l: any) => ({
            productId: l.product?.id || 1,
            productName: l.productName || l.product?.name || "Producto",
            productCode: l.product?.code || "SKU",
            qty: Number(l.qty || 1),
            unitPrice: Number(l.price || 0),
            discountPct: Number(l.discount || 0),
          })),
          tracking: {
            originType: isDirectSale ? "DIRECT_SALE" : "B2B_FLOW",
            isDirectSale,
            quote: quoteTracking,
            order: orderTracking,
            invoice: {
              id: String(inv.id),
              invoiceSeq: inv.invoiceId || inv.invoiceSeq || `FAC-2026-${String(inv.id).padStart(5, "0")}`,
              date: inv.invoiceDate || new Date().toISOString().slice(0, 10),
              dueDate: inv.dueDate || inv.specificNotes || inv.invoiceDate || new Date().toISOString().slice(0, 10),
              total: Number(inv.inTaxTotal || 0),
              amountPaid: Number(inv.amountPaid || 0),
              amountRemaining: Number(inv.amountRemaining ?? inv.inTaxTotal ?? 0),
              status: Number(inv.amountRemaining) <= 0 && Number(inv.amountPaid) > 0 ? "PAID" : "OPEN",
            },
          },
        };
      }
    } catch (err: any) {
      console.warn("[SalesService] Error obteniendo detalle de factura en Axelor:", err.message);
    }
    return null;
  }
}

export const salesService = new SalesService();
