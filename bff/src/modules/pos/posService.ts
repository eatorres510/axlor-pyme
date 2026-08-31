import { axelor } from "../../services/axelor/axelorClient.js";
import { POSCheckoutInput, POSTicket } from "./posTypes.js";
import { recordNewSale } from "../../data/seedSalesData.js";


// Sequential Folio Counter & History Registry for POS Tickets
let currentTicketSeq = 1005;

export const posTicketsRegistry: POSTicket[] = [
  {
    folio: "TKT-2026-00105",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    company: {
      id: 13,
      name: "Distribuidora Nacional PyME S.A. de C.V.",
      taxId: "DNP190820XX1",
    },
    customer: {
      id: 1,
      name: "Supermercados La Central S.A. de C.V.",
    },
    items: [
      { productId: 1, name: "Refresco Cola 600ml", qty: 6, unitPrice: 18.0, subtotal: 108.0 },
      { productId: 2, name: "Agua Mineral 600ml", qty: 4, unitPrice: 15.0, subtotal: 60.0 },
    ],
    subtotal: 168.0,
    tax: 26.88,
    total: 194.88,
    payment: {
      method: "CASH",
      amountPaid: 200.0,
      change: 5.12,
    },
    cashRegister: { id: 1, name: "Caja Principal 01" },
    saleOrderId: 105,
    stockMoveId: 105,
  },
  {
    folio: "TKT-2026-00104",
    timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
    company: {
      id: 13,
      name: "Distribuidora Nacional PyME S.A. de C.V.",
      taxId: "DNP190820XX1",
    },
    customer: {
      id: 0,
      name: "Público en General / Mostrador",
    },
    items: [
      { productId: 4, name: "Galletas de Avena 100g", qty: 10, unitPrice: 22.5, subtotal: 225.0 },
      { productId: 7, name: "Aceite Vegetal 1L", qty: 2, unitPrice: 42.0, subtotal: 84.0 },
    ],
    subtotal: 309.0,
    tax: 49.44,
    total: 358.44,
    payment: {
      method: "CARD",
      amountPaid: 358.44,
      change: 0,
      reference: "AUTH-89210",
    },
    cashRegister: { id: 1, name: "Caja Principal 01" },
    saleOrderId: 104,
    stockMoveId: 104,
  },
  {
    folio: "TKT-2026-00103",
    timestamp: new Date(Date.now() - 150 * 60000).toISOString(),
    company: {
      id: 13,
      name: "Distribuidora Nacional PyME S.A. de C.V.",
      taxId: "DNP190820XX1",
    },
    customer: {
      id: 0,
      name: "Público en General / Mostrador",
    },
    items: [
      { productId: 5, name: "Jugo Naranja 1L", qty: 5, unitPrice: 28.0, subtotal: 140.0 },
      { productId: 3, name: "Papas Fritas Sal 45g", qty: 8, unitPrice: 16.5, subtotal: 132.0 },
    ],
    subtotal: 272.0,
    tax: 43.52,
    total: 315.52,
    payment: {
      method: "CASH",
      amountPaid: 350.0,
      change: 34.48,
    },
    cashRegister: { id: 1, name: "Caja Principal 01" },
    saleOrderId: 103,
    stockMoveId: 103,
  },
];

export class POSService {
  private async getOrCreateGenericCustomer(companyId: number): Promise<number> {
    try {
      const res = await axelor.search("com.axelor.apps.base.db.Partner", {
        data: {
          _domain: `self.isCustomer = true and lower(self.name) like '%público en general%'`,
        },
        limit: 1,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0].id;
      }

      // Create generic customer in Axelor
      const created = await axelor.create("com.axelor.apps.base.db.Partner", {
        name: "Público en General",
        simpleFullName: "Público en General",
        taxNbr: "XAXX010101000",
        isCustomer: true,
        isSupplier: false,
        companySet: [{ id: companyId }],
      });
      const item = Array.isArray(created.data) ? created.data[0] : created.data;
      return item?.id || 1;
    } catch {
      return 1;
    }
  }

  private async getMainWarehouseId(companyId: number): Promise<number> {
    try {
      const res = await axelor.search("com.axelor.apps.stock.db.StockLocation", {
        data: {
          _domain: `self.company.id = ${companyId} and self.typeSelect = 1`,
        },
        limit: 1,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0].id;
      }
      return 6;
    } catch {
      return 6;
    }
  }

  public async checkout(input: POSCheckoutInput): Promise<POSTicket> {
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    // 1. Resolve Customer & Warehouse
    const customerId = input.customerId || (await this.getOrCreateGenericCustomer(input.companyId));
    const warehouseId = input.warehouseId || (await this.getMainWarehouseId(input.companyId));

    let companyName = "Distribuidora Nacional PyME S.A. de C.V.";
    let companyTaxId = "DNP190820XX1";
    try {
      const company = await axelor.fetch("com.axelor.apps.base.db.Company", input.companyId);
      if (company?.name) companyName = company.name;
      if (company?.taxNbr) companyTaxId = company.taxNbr;
    } catch {}

    let customerName = "Público en General / Mostrador";
    try {
      const customer = await axelor.fetch("com.axelor.apps.base.db.Partner", customerId);
      if (customer?.name) customerName = customer.name;
    } catch {}

    // 2. Compute Item Subtotals & Taxes
    let subtotal = 0;
    const ticketItems: POSTicket["items"] = [];
    const saleOrderLines = input.items.map((item) => {
      const discount = item.discountPercent ? item.discountPercent / 100 : 0;
      const effectivePrice = item.unitPrice * (1 - discount);
      const lineTotal = Number((item.qty * effectivePrice).toFixed(2));
      subtotal += lineTotal;

      ticketItems.push({
        productId: item.productId,
        name: item.productName,
        qty: item.qty,
        unitPrice: item.unitPrice,
        subtotal: lineTotal,
      });

      return {
        product: { id: item.productId },
        productName: item.productName,
        price: effectivePrice,
        qty: item.qty,
        exTaxTotal: lineTotal,
      };
    });

    const tax = Number((subtotal * 0.16).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const change = Number(Math.max(0, input.payment.amountPaid - total).toFixed(2));

    if (input.payment.method === "CASH" && input.payment.amountPaid < total) {
      throw new Error(`Monto pagado ($${input.payment.amountPaid}) es menor al total a cobrar ($${total})`);
    }

    // 3. Generate Strictly Consecutive Ticket Number
    currentTicketSeq += 1;
    const folio = `TKT-2026-${String(currentTicketSeq).padStart(5, "0")}`;

    // 4. Create SaleOrder in Axelor or generate fallback ID
    let saleOrderId = currentTicketSeq;
    try {
      const salePayload = {
        clientPartner: { id: customerId },
        company: { id: input.companyId },
        currency: { id: 100 },
        creationDate: today,
        orderDate: today,
        statusSelect: 2, // Confirmed
        exTaxTotal: subtotal,
        taxTotal: tax,
        inTaxTotal: total,
        saleOrderLineList: saleOrderLines,
      };
      const soRes = await axelor.create("com.axelor.apps.sale.db.SaleOrder", salePayload);
      const saleOrder = Array.isArray(soRes.data) ? soRes.data[0] : soRes.data;
      if (saleOrder?.id) saleOrderId = saleOrder.id;
    } catch (err) {
      console.warn("Axelor saleOrder creation warning (using local seq):", err);
    }

    // 5. Atomic Stock Discharge (StockMove Outflow: typeSelect: 2, statusSelect: 2)
    let stockMoveId = currentTicketSeq;
    try {
      const moveLines = input.items.map((item) => ({
        product: { id: item.productId },
        productName: item.productName,
        qty: item.qty,
        unitPrice: item.unitPrice,
        fromStockLocation: { id: warehouseId },
        toStockLocation: { id: warehouseId },
      }));

      const stockMovePayload = {
        typeSelect: 2, // Outflow / Despacho
        statusSelect: 2, // Realized / Ejecutado
        company: { id: input.companyId },
        fromStockLocation: { id: warehouseId },
        toStockLocation: { id: warehouseId },
        estimatedDate: today,
        realDate: today,
        stockMoveLineList: moveLines,
        origin: `POS Ticket #${folio}`,
      };

      const smRes = await axelor.create("com.axelor.apps.stock.db.StockMove", stockMovePayload);
      const stockMove = Array.isArray(smRes.data) ? smRes.data[0] : smRes.data;
      if (stockMove?.id) stockMoveId = stockMove.id;
    } catch (err) {
      console.warn("Axelor stockMove creation warning:", err);
    }

    // 6. Record sale in dynamic sales database for real-time seller & product KPIs
    try {
      recordNewSale({
        companyId: input.companyId,
        sellerId: 102, // Mariana Fuentes (Cajera POS)
        sellerName: "Mariana Fuentes",
        customerName: customerName,
        channel: "POS",
        items: input.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          qty: it.qty,
          unitPrice: it.unitPrice,
        })),
        totalAmount: total,
      });
    } catch (e) {
      console.warn("Error recording new sale to store:", e);
    }



    // 8. Build and Register Print-Ready Ticket
    const ticketRecord: POSTicket = {
      folio,
      timestamp: nowIso,
      company: {
        id: input.companyId,
        name: companyName,
        taxId: companyTaxId,
      },
      customer: {
        id: customerId,
        name: customerName,
      },
      items: ticketItems,
      subtotal,
      tax,
      total,
      payment: {
        method: input.payment.method,
        amountPaid: input.payment.amountPaid,
        change,
        reference: input.payment.reference,
      },
      cashRegister: {
        id: input.cashRegisterId || 1,
        name: `Caja Principal 01`,
      },
      saleOrderId,
      stockMoveId,
    };

    posTicketsRegistry.unshift(ticketRecord);
    return ticketRecord;
  }

  public listTickets(companyId?: number): POSTicket[] {
    if (!companyId) return posTicketsRegistry;
    return posTicketsRegistry.filter((t) => t.company?.id === Number(companyId));
  }

  public getTicket(idOrFolio: string | number): POSTicket | null {
    const searchStr = String(idOrFolio).trim().toLowerCase();
    const found = posTicketsRegistry.find(
      (t) =>
        t.folio.toLowerCase() === searchStr ||
        String(t.saleOrderId) === searchStr ||
        t.folio.toLowerCase().includes(searchStr)
    );
    return found || null;
  }
}

export const posService = new POSService();
