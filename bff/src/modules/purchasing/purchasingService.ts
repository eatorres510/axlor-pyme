import { axelor } from "../../services/axelor/axelorClient.js";
import {
  PurchaseOrderInput,
  ReceivePurchaseInput,
  SupplierReturnInput,
  GoodsReceiptRecord,
  VendorInvoiceInput,
  VendorInvoiceRecord,
} from "./purchasingTypes.js";
import { SEED_PURCHASE_ORDERS } from "../../data/masterRelationalSeed.js";

export const CUSTOM_PURCHASE_ORDERS: any[] = [];

// Sequential Document Counters for Purchasing
let currentPurchaseOrderSeq = 1005;
let currentSupplierReturnSeq = 1002;
let currentGoodsReceiptSeq = 1004;
let currentVendorInvoiceSeq = 1008;

export const goodsReceiptsRegistry: GoodsReceiptRecord[] = [
  {
    id: "REC-ALM-2026-00001",
    receiptSeq: "REC-ALM-2026-00001",
    companyId: 13,
    purchaseOrderId: 1,
    orderNumber: "OC-2026-00101",
    supplierId: 1,
    supplierName: "Distribuidora Mayorista del Centro S.A.",
    warehouseId: 1,
    warehouseName: "Bodega Principal Toluca",
    receiptDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    items: [
      {
        productId: 1,
        productName: "Agua Mineral 600ml",
        productCode: "AGUA-MIN-600",
        qtyOrdered: 100,
        qtyReceived: 100,
        lotNumber: "LOTE-2026-A12",
        expiryDate: "2027-08-15",
        unitPrice: 12.5,
      },
    ],
    totalQty: 100,
    totalAmount: 1450.0,
    status: "RECEIVED",
    notes: "Entrada completa con lote verificado",
  },
  {
    id: "REC-ALM-2026-00002",
    receiptSeq: "REC-ALM-2026-00002",
    companyId: 13,
    purchaseOrderId: 2,
    orderNumber: "OC-2026-00102",
    supplierId: 2,
    supplierName: "Plásticos y Empaques Industriales",
    warehouseId: 1,
    warehouseName: "Bodega Principal Toluca",
    receiptDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    items: [
      {
        productId: 2,
        productName: "Caja de Cartón Reforzada 30x30",
        productCode: "CAJ-3030",
        qtyOrdered: 200,
        qtyReceived: 200,
        lotNumber: "LOTE-2026-C04",
        expiryDate: "2028-01-01",
        unitPrice: 18.0,
      },
    ],
    totalQty: 200,
    totalAmount: 4176.0,
    status: "RECEIVED",
    notes: "Inspección de calidad aprobada",
  },
];

export const vendorInvoicesRegistry: VendorInvoiceRecord[] = [
  {
    id: "FP-2026-00001",
    invoiceSeq: "FP-2026-00001",
    vendorInvoiceNumber: "FAC-PROV-98214",
    companyId: 13,
    purchaseOrderId: 1,
    orderNumber: "OC-2026-00101",
    supplierId: 1,
    supplierName: "Distribuidora Mayorista del Centro S.A.",
    supplierTaxNbr: "DMC891024JK1",
    invoiceDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 27 * 86400000).toISOString().slice(0, 10),
    subtotal: 1250.0,
    taxAmount: 200.0,
    totalAmount: 1450.0,
    amountPaid: 0,
    amountRemaining: 1450.0,
    status: "PENDING_PAYMENT",
    items: [
      {
        productId: 1,
        productName: "Agua Mineral 600ml",
        qty: 100,
        unitPrice: 12.5,
        total: 1250.0,
      },
    ],
    notes: "Factura recibida contra OC-2026-00101",
  },
  {
    id: "FP-2026-00002",
    invoiceSeq: "FP-2026-00002",
    vendorInvoiceNumber: "A-45819",
    companyId: 13,
    purchaseOrderId: 2,
    orderNumber: "OC-2026-00102",
    supplierId: 2,
    supplierName: "Plásticos y Empaques Industriales",
    supplierTaxNbr: "PEI940312MN8",
    invoiceDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    subtotal: 3600.0,
    taxAmount: 576.0,
    totalAmount: 4176.0,
    amountPaid: 4176.0,
    amountRemaining: 0,
    status: "PAID",
    items: [
      {
        productId: 2,
        productName: "Caja de Cartón Reforzada 30x30",
        qty: 200,
        unitPrice: 18.0,
        total: 3600.0,
      },
    ],
    notes: "Factura liquidada por transferencia SPEI",
  },
];

export class PurchasingService {
  private async getMainWarehouseId(companyId: number): Promise<number> {
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
  }

  public async listOrders(params: {
    companyId?: number;
    supplierId?: number;
    statusSelect?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: any[]; total: number }> {
    const domainConditions: string[] = [];
    if (params.companyId) {
      domainConditions.push(`self.company.id = ${params.companyId}`);
    }
    if (params.supplierId) {
      domainConditions.push(`self.supplierPartner.id = ${params.supplierId}`);
    }
    if (params.statusSelect !== undefined) {
      domainConditions.push(`self.statusSelect = ${params.statusSelect}`);
    }

    const payload: any = {
      limit: params.limit || 50,
      offset: params.offset || 0,
      sortBy: ["-createdOn"],
    };
    if (domainConditions.length > 0) {
      payload.data = {
        _domain: domainConditions.join(" and "),
      };
    }

    try {
      const res = await axelor.search("com.axelor.apps.purchase.db.PurchaseOrder", payload);
      const rawList = Array.isArray(res.data) ? res.data : [];
      const combined = [...CUSTOM_PURCHASE_ORDERS, ...rawList, ...SEED_PURCHASE_ORDERS];

      const seen = new Set<string>();
      const orders: any[] = [];
      for (const o of combined) {
        if (params.supplierId && o.supplierId && o.supplierId !== params.supplierId && o.supplierPartner?.id !== params.supplierId) continue;

        // Check if this order was already received in goodsReceiptsRegistry
        const matchedReceipt = goodsReceiptsRegistry.find((r) => r.purchaseOrderId === o.id || (o.orderNumber && r.orderNumber === o.orderNumber));
        const matchedInvoice = vendorInvoicesRegistry.find((inv) => inv.purchaseOrderId === o.id || (o.orderNumber && inv.orderNumber === o.orderNumber));
        const effectiveStatus = (matchedReceipt || o.receiptState === 3 || o.statusSelect === 3) ? 3 : (o.statusSelect || 1);

        if (params.statusSelect !== undefined && effectiveStatus !== params.statusSelect) continue;

        const key = o.orderNumber || String(o.id);
        if (!seen.has(key)) {
          seen.add(key);
          orders.push({
            ...o,
            statusSelect: effectiveStatus,
            receiptSeq: matchedReceipt?.receiptSeq || o.receiptSeq,
            invoiceSeq: matchedInvoice?.invoiceSeq || o.invoiceSeq,
            isInvoiced: Boolean(matchedInvoice || o.invoicedState === 3 || o.invoiceSeq),
            supplierPartner: o.supplierPartner || { id: o.supplierId, name: o.supplierName },
          });
        }
      }
      return {
        orders,
        total: orders.length,
      };
    } catch {
      const combined = [...CUSTOM_PURCHASE_ORDERS, ...SEED_PURCHASE_ORDERS];
      return { orders: combined, total: combined.length };
    }
  }

  public async getOrder(id: number): Promise<any | null> {
    const local = [...CUSTOM_PURCHASE_ORDERS, ...SEED_PURCHASE_ORDERS].find((o) => o.id === id);
    if (local) return local;

    try {
      const order = await axelor.fetch("com.axelor.apps.purchase.db.PurchaseOrder", id);
      if (!order) return null;

      // Fetch deep lines
      const linesRes = await axelor.search("com.axelor.apps.purchase.db.PurchaseOrderLine", {
        data: { _domain: `self.purchaseOrder.id = ${id}` },
        limit: 100,
      });
      order.purchaseOrderLineList = Array.isArray(linesRes.data) ? linesRes.data : [];
      return order;
    } catch {
      return null;
    }
  }

  public async createOrder(input: PurchaseOrderInput): Promise<any> {
    const today = new Date().toISOString().slice(0, 10);
    const orderDate = input.orderDate || today;

    const rawItems = input.items || input.lines || [];
    let subtotal = 0;
    const lines = rawItems.map((item) => {
      const lineTotal = Number((item.qty * item.unitPrice).toFixed(2));
      subtotal += lineTotal;
      return {
        product: { id: item.productId },
        productName: item.productName || "Producto / Insumo",
        price: item.unitPrice,
        qty: item.qty,
        exTaxTotal: lineTotal,
      };
    });

    const newRecord = {
      id: Date.now(),
      orderNumber: `OC-2026-${String(++currentPurchaseOrderSeq).padStart(5, "0")}`,
      supplierId: input.supplierId,
      supplierPartner: { id: input.supplierId },
      company: { id: input.companyId },
      currency: { id: 100 },
      creationDate: today,
      orderDate: orderDate,
      statusSelect: 1, // Draft / Quotation
      exTaxTotal: subtotal,
      inTaxTotal: Number((subtotal * 1.16).toFixed(2)),
      purchaseOrderLineList: lines,
      lines,
      internalNote: input.notes,
    };

    CUSTOM_PURCHASE_ORDERS.unshift(newRecord);

    try {
      const payload: Record<string, any> = {
        supplierPartner: { id: input.supplierId },
        company: { id: input.companyId },
        currency: { id: 100 },
        creationDate: today,
        orderDate: orderDate,
        statusSelect: 1,
        exTaxTotal: subtotal,
        inTaxTotal: Number((subtotal * 1.16).toFixed(2)),
        purchaseOrderLineList: lines,
      };
      if (input.notes) payload.internalNote = input.notes;
      const res = await axelor.create("com.axelor.apps.purchase.db.PurchaseOrder", payload);
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      if (item?.id) {
        newRecord.id = item.id;
      }
    } catch {}

    return newRecord;
  }

  public async updateOrder(id: number, input: Partial<PurchaseOrderInput>): Promise<any> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Orden de compra no encontrada");
    }
    if (order.statusSelect && order.statusSelect !== 1) {
      throw new Error("Solo se pueden editar órdenes de compra en estado Borrador.");
    }

    const rawItems = input.items || input.lines;
    let subtotal = order.exTaxTotal || 0;
    let lines = order.purchaseOrderLineList || order.lines || [];

    if (rawItems && rawItems.length > 0) {
      subtotal = 0;
      lines = rawItems.map((item) => {
        const lineTotal = Number((item.qty * item.unitPrice).toFixed(2));
        subtotal += lineTotal;
        return {
          product: { id: item.productId },
          productName: item.productName || "Producto / Insumo",
          price: item.unitPrice,
          qty: item.qty,
          exTaxTotal: lineTotal,
        };
      });
    }

    if (input.supplierId) {
      order.supplierId = input.supplierId;
      order.supplierPartner = { id: input.supplierId };
    }
    if (input.notes !== undefined) {
      order.internalNote = input.notes;
    }
    order.exTaxTotal = subtotal;
    order.inTaxTotal = Number((subtotal * 1.16).toFixed(2));
    order.purchaseOrderLineList = lines;
    order.lines = lines;

    const localOrder = [...CUSTOM_PURCHASE_ORDERS, ...SEED_PURCHASE_ORDERS].find((o) => o.id === id);
    if (localOrder) {
      if (input.supplierId) {
        localOrder.supplierId = input.supplierId;
        localOrder.supplierPartner = { id: input.supplierId };
      }
      if (input.notes !== undefined) localOrder.internalNote = input.notes;
      localOrder.exTaxTotal = subtotal;
      localOrder.inTaxTotal = Number((subtotal * 1.16).toFixed(2));
      localOrder.purchaseOrderLineList = lines;
      localOrder.lines = lines;
    }

    try {
      await axelor.update("com.axelor.apps.purchase.db.PurchaseOrder", {
        id: order.id,
        version: order.version ?? 0,
        supplierPartner: input.supplierId ? { id: input.supplierId } : undefined,
        exTaxTotal: subtotal,
        inTaxTotal: Number((subtotal * 1.16).toFixed(2)),
        purchaseOrderLineList: lines,
        internalNote: input.notes,
      });
    } catch {}

    return order;
  }

  public async deleteOrder(id: number): Promise<{ success: boolean; message: string }> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Orden de compra no encontrada");
    }
    if (order.statusSelect && order.statusSelect !== 1) {
      throw new Error("Solo se pueden eliminar órdenes de compra en estado Borrador.");
    }

    const customIdx = CUSTOM_PURCHASE_ORDERS.findIndex((o) => o.id === id);
    if (customIdx >= 0) {
      CUSTOM_PURCHASE_ORDERS.splice(customIdx, 1);
    }
    const seedIdx = SEED_PURCHASE_ORDERS.findIndex((o) => o.id === id);
    if (seedIdx >= 0) {
      SEED_PURCHASE_ORDERS.splice(seedIdx, 1);
    }

    try {
      await axelor.remove("com.axelor.apps.purchase.db.PurchaseOrder", id, order.version ?? 0);
    } catch {}

    return { success: true, message: "Orden de compra en borrador eliminada exitosamente" };
  }

  public async confirmOrder(id: number): Promise<any> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Orden de compra no encontrada");
    }

    try {
      await axelor.update("com.axelor.apps.purchase.db.PurchaseOrder", {
        id: order.id,
        version: order.version ?? 0,
        statusSelect: 2, // Confirmed
      });
    } catch {}

    const localOrder = [...CUSTOM_PURCHASE_ORDERS, ...SEED_PURCHASE_ORDERS].find((o) => o.id === id);
    if (localOrder) {
      localOrder.statusSelect = 2;
    }

    order.statusSelect = 2;
    return order;
  }

  public async receiveOrder(id: number, input: ReceivePurchaseInput = {}): Promise<{
    success: boolean;
    receiptSeq?: string;
    purchaseOrderId: number;
    stockMoveId: number;
    warehouseId: number;
    receivedItems: number;
    timestamp: string;
  }> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error("Orden de compra no encontrada");
    }

    // Check if order was already received
    const alreadyReceived = goodsReceiptsRegistry.some(
      (r) => r.purchaseOrderId === order.id || (order.orderNumber && r.orderNumber === order.orderNumber)
    );
    if (order.statusSelect === 3 || order.receiptState === 3 || alreadyReceived) {
      throw new Error("Esta orden de compra ya fue recibida en almacén. No es posible volver a recibirla.");
    }

    const companyId = order.company?.id || 13;
    const warehouseId = input.warehouseId || (await this.getMainWarehouseId(companyId));
    const today = new Date().toISOString().slice(0, 10);

    // Prepare StockMove lines from purchase order lines
    const orderLines = order.purchaseOrderLineList || order.lines || [];
    const moveLines = orderLines.map((line: any) => ({
      product: { id: line.product?.id || line.productId },
      productName: line.productName || line.product?.name || "Producto",
      qty: Number(line.qty || 1),
      unitPrice: Number(line.price || line.unitPrice || 0),
      fromStockLocation: { id: warehouseId },
      toStockLocation: { id: warehouseId },
    }));

    // Create StockMove for physical inflow
    const stockMovePayload = {
      typeSelect: 1, // Inflow
      statusSelect: 2, // Realized
      company: { id: companyId },
      fromStockLocation: { id: warehouseId },
      toStockLocation: { id: warehouseId },
      estimatedDate: today,
      realDate: today,
      stockMoveLineList: moveLines,
    };

    let moveItem: any = null;
    try {
      const smRes = await axelor.create("com.axelor.apps.stock.db.StockMove", stockMovePayload);
      moveItem = Array.isArray(smRes.data) ? smRes.data[0] : smRes.data;
    } catch (e: any) {
      console.warn("StockMove creation warning:", e.message);
    }

    // Update PurchaseOrder status to Received (statusSelect: 3, receiptState: 3)
    try {
      await axelor.update("com.axelor.apps.purchase.db.PurchaseOrder", {
        id: order.id,
        version: order.version ?? 0,
        statusSelect: 3, // 3 = Received / Closed
        receiptState: 3, // 3 = Received
      });
    } catch (e: any) {
      console.warn("Axelor PO update warning:", e.message);
    }

    // Update product cost prices
    for (const line of orderLines) {
      const prodId = line.product?.id || line.productId;
      const unitCost = Number(line.price || line.unitPrice || 0);
      if (prodId && unitCost > 0) {
        try {
          const freshProd = await axelor.fetch("com.axelor.apps.base.db.Product", prodId);
          if (freshProd) {
            await axelor.update("com.axelor.apps.base.db.Product", {
              id: freshProd.id,
              version: freshProd.version ?? 0,
              costPrice: unitCost,
              purchasePrice: unitCost,
            });
          }
        } catch (e: any) {
          console.warn("Product cost update warning:", e.message);
        }
      }
    }

    // Create entry in goodsReceiptsRegistry
    const receiptSeq = `REC-ALM-2026-${String(++currentGoodsReceiptSeq).padStart(5, "0")}`;
    const supplierName = order.supplierPartner?.name || order.supplierPartner?.fullName || order.supplierName || "Proveedor";
    const receiptItems = orderLines.map((line: any) => ({
      productId: line.product?.id || line.productId || 1,
      productName: line.productName || line.product?.name || "Insumo / Producto",
      productCode: line.product?.code || line.productCode || "SKU-PROD",
      qtyOrdered: Number(line.qty || 1),
      qtyReceived: Number(line.qty || 1),
      lotNumber: input.lotNumber || `LOTE-2026-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: input.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      unitPrice: Number(line.price || line.unitPrice || 0),
    }));

    const totalQty = receiptItems.reduce((s: number, it: any) => s + it.qtyReceived, 0);
    const totalAmount = receiptItems.reduce((s: number, it: any) => s + it.qtyReceived * it.unitPrice, 0);

    const newReceipt: GoodsReceiptRecord = {
      id: receiptSeq,
      receiptSeq,
      companyId,
      purchaseOrderId: order.id,
      orderNumber: order.orderNumber || (typeof order.id === "string" ? order.id : `OC-2026-${order.id}`),
      supplierId: order.supplierPartner?.id || order.supplierId || 1,
      supplierName,
      warehouseId,
      warehouseName: warehouseId === 1 ? "Bodega Principal Toluca" : "Almacén General",
      receiptDate: today,
      items: receiptItems,
      totalQty,
      totalAmount,
      status: "RECEIVED",
      notes: input.notes || "Recepción física de mercancía e ingreso a inventario",
    };

    goodsReceiptsRegistry.unshift(newReceipt);

    // Update local store if custom or seed order
    const localOrder = [...CUSTOM_PURCHASE_ORDERS, ...SEED_PURCHASE_ORDERS].find((o) => o.id === id);
    if (localOrder) {
      localOrder.statusSelect = 3;
      localOrder.receiptState = 3;
      localOrder.receiptSeq = receiptSeq;
    }

    order.statusSelect = 3;
    order.receiptState = 3;
    order.receiptSeq = receiptSeq;

    return {
      success: true,
      receiptSeq,
      purchaseOrderId: order.id,
      stockMoveId: moveItem?.id || 1,
      warehouseId,
      receivedItems: orderLines.length,
      timestamp: new Date().toISOString(),
    };
  }

  public listReceipts(companyId?: number): GoodsReceiptRecord[] {
    if (!companyId) return goodsReceiptsRegistry;
    return goodsReceiptsRegistry.filter((r) => r.companyId === companyId);
  }

  public listVendorInvoices(companyId?: number): VendorInvoiceRecord[] {
    const list = companyId ? vendorInvoicesRegistry.filter((inv) => inv.companyId === companyId) : vendorInvoicesRegistry;
    const seen = new Set<string>();
    return list.filter((inv) => {
      const key = inv.purchaseOrderId ? `po_${inv.purchaseOrderId}` : inv.invoiceSeq;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  public async createVendorInvoice(input: VendorInvoiceInput): Promise<VendorInvoiceRecord> {
    const today = input.invoiceDate || new Date().toISOString().slice(0, 10);
    const dueDate = input.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const invoiceSeq = `FP-2026-${String(++currentVendorInvoiceSeq).padStart(5, "0")}`;

    const subtotal = input.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const taxAmount = Number((subtotal * 0.16).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    const companyId = input.companyId || 13;
    const warehouseId = input.warehouseId || 1;
    const warehouseName = warehouseId === 1 ? "Bodega Principal Toluca" : "Almacén General";

    // Auto-generate Purchase Order if not provided (Direct Purchase Flow)
    let orderSeq = input.orderNumber;
    let purchaseOrderId = input.purchaseOrderId;
    if (!orderSeq) {
      orderSeq = `OC-2026-${String(++currentPurchaseOrderSeq).padStart(5, "0")}`;
      purchaseOrderId = currentPurchaseOrderSeq;

      // Register completed PO in custom purchases list
      CUSTOM_PURCHASE_ORDERS.unshift({
        id: purchaseOrderId,
        orderNumber: orderSeq,
        purchaseOrderSeq: orderSeq,
        company: { id: companyId },
        supplierPartner: { id: input.supplierId, name: input.supplierName },
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        statusSelect: 3, // Received
        receiptState: 3,
        orderDate: today,
        creationDate: today,
        exTaxTotal: subtotal,
        inTaxTotal: totalAmount,
        totalAmount,
        notes: `Compra rápida directa / Factura ${input.invoiceNumber}`,
        lines: input.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          qty: it.qty,
          unitPrice: it.unitPrice,
          price: it.unitPrice,
        })),
      });
    }

    let receiptSeq: string | undefined = undefined;

    // Automatic Warehouse Inflow (Auto-Receive directly to Inventory)
    if (input.autoReceive !== false) {
      receiptSeq = `REC-ALM-2026-${String(++currentGoodsReceiptSeq).padStart(5, "0")}`;
      const receiptItems = input.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        productCode: it.productCode || `SKU-${it.productId}`,
        qtyOrdered: it.qty,
        qtyReceived: it.qty,
        lotNumber: it.lotNumber || input.lotNumber || `LOTE-2026-${Math.floor(100 + Math.random() * 900)}`,
        expiryDate: it.expiryDate || input.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        unitPrice: it.unitPrice,
      }));

      const totalQty = receiptItems.reduce((s, it) => s + it.qtyReceived, 0);

      const newReceipt: GoodsReceiptRecord = {
        id: receiptSeq,
        receiptSeq,
        companyId,
        purchaseOrderId: purchaseOrderId || 1,
        orderNumber: orderSeq,
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        warehouseId,
        warehouseName,
        receiptDate: today,
        items: receiptItems,
        totalQty,
        totalAmount,
        status: "RECEIVED",
        notes: `Entrada automática por Factura de Compra Directa ${input.invoiceNumber} (${invoiceSeq})`,
      };

      goodsReceiptsRegistry.unshift(newReceipt);

      // Create StockMove in Axelor
      try {
        const moveLines = input.items.map((line) => ({
          product: { id: line.productId },
          productName: line.productName,
          qty: Number(line.qty || 1),
          unitPrice: Number(line.unitPrice || 0),
          fromStockLocation: { id: warehouseId },
          toStockLocation: { id: warehouseId },
        }));

        await axelor.create("com.axelor.apps.stock.db.StockMove", {
          typeSelect: 1, // Inflow
          statusSelect: 2, // Realized
          company: { id: companyId },
          fromStockLocation: { id: warehouseId },
          toStockLocation: { id: warehouseId },
          estimatedDate: today,
          realDate: today,
          stockMoveLineList: moveLines,
          notes: `Entrada física automática por Factura Proveedor ${invoiceSeq} (${input.invoiceNumber})`,
        });

        // Update product cost prices in Axelor
        for (const line of input.items) {
          if (line.productId && line.unitPrice) {
            try {
              const freshProd = await axelor.fetch("com.axelor.apps.base.db.Product", line.productId);
              if (freshProd) {
                await axelor.update("com.axelor.apps.base.db.Product", {
                  id: freshProd.id,
                  version: freshProd.version ?? 0,
                  costPrice: Number(line.unitPrice),
                  purchasePrice: Number(line.unitPrice),
                });
              }
            } catch (e: any) {
              console.warn("Product cost update warning:", e.message);
            }
          }
        }
      } catch (smErr) {
        console.warn("Stock move creation warning for direct purchase:", smErr);
      }
    }

    const newInvoice: VendorInvoiceRecord = {
      id: invoiceSeq,
      invoiceSeq,
      vendorInvoiceNumber: input.invoiceNumber,
      companyId,
      purchaseOrderId,
      orderNumber: orderSeq,
      receiptSeq,
      warehouseName,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      supplierTaxNbr: input.supplierTaxNbr || "XAXX010101000",
      invoiceDate: today,
      dueDate,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount,
      totalAmount,
      amountPaid: 0,
      amountRemaining: totalAmount,
      status: "PENDING_PAYMENT",
      items: input.items.map((it) => ({
        ...it,
        total: Number((it.qty * it.unitPrice).toFixed(2)),
      })),
      notes: input.notes,
    };

    vendorInvoicesRegistry.unshift(newInvoice);
    return newInvoice;
  }

  public async generateInvoiceFromOrder(orderId: number): Promise<VendorInvoiceRecord> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error("Orden de compra no encontrada");

    // Check if an invoice already exists for this order
    const existingInvoice = vendorInvoicesRegistry.find(
      (inv) => inv.purchaseOrderId === order.id || (order.orderNumber && inv.orderNumber === order.orderNumber)
    );
    if (existingInvoice || order.invoicedState === 3 || order.isInvoiced) {
      throw new Error(`Esta orden de compra ya cuenta con la factura de proveedor ${existingInvoice?.invoiceSeq || "registrada"}. No es posible generar otra factura.`);
    }

    const orderLines = order.purchaseOrderLineList || order.lines || [];
    const items = orderLines.map((line: any) => ({
      productId: line.product?.id || line.productId || 1,
      productName: line.productName || line.product?.name || "Producto",
      qty: Number(line.qty || 1),
      unitPrice: Number(line.price || line.unitPrice || 0),
    }));

    const supplierName = order.supplierPartner?.name || order.supplierPartner?.fullName || "Proveedor";
    const companyId = order.company?.id || 13;

    const invoice = await this.createVendorInvoice({
      companyId,
      supplierId: order.supplierPartner?.id || 1,
      supplierName,
      supplierTaxNbr: "XAXX010101000",
      purchaseOrderId: order.id,
      orderNumber: order.orderNumber || `OC-2026-${order.id}`,
      invoiceNumber: `F-PROV-${order.id}`,
      autoReceive: false,
      items,
      notes: `Factura generada automáticamente desde Orden de Compra ${order.orderNumber || order.id}`,
    });

    order.invoicedState = 3;
    order.isInvoiced = true;
    order.invoiceSeq = invoice.invoiceSeq;

    return invoice;
  }

  public async createSupplierReturn(
    orderId: number,
    input: SupplierReturnInput
  ): Promise<{
    success: boolean;
    returnSeq: string;
    itemsReturned: number;
    totalAmount: number;
    timestamp: string;
  }> {
    const order = await this.getOrder(orderId);
    const companyId = order?.company?.id || 13;
    const supplierId = order?.supplierPartner?.id || 1;
    const warehouseId = input.locationId || (await this.getMainWarehouseId(companyId));
    const today = new Date().toISOString().slice(0, 10);
    const returnSeq = `DEV-PROV-2026-${String(++currentSupplierReturnSeq).padStart(5, "0")}`;

    let returnTotal = 0;
    const moveLines = input.items.map((item) => {
      const lineTotal = Number((item.qty * item.unitPrice).toFixed(2));
      returnTotal += lineTotal;
      return {
        product: { id: item.productId },
        productName: item.productName || "Producto devuelto",
        qty: item.qty,
        unitPrice: item.unitPrice,
        fromStockLocation: { id: warehouseId },
      };
    });

    // 1. Create Outflow StockMove (typeSelect = 2: Outflow / Return)
    try {
      await axelor.create("com.axelor.apps.stock.db.StockMove", {
        typeSelect: 2, // Outflow / Return
        statusSelect: 2, // Realized
        company: { id: companyId },
        fromStockLocation: { id: warehouseId },
        estimatedDate: today,
        realDate: today,
        stockMoveLineList: moveLines,
        notes: `Devolución a proveedor #${supplierId} - Orden #${orderId} (${input.reason}): ${input.notes || ""}`,
      });
    } catch (err) {
      console.warn("StockMove return warning:", err);
    }

    // 2. Create Vendor Credit Note in Axelor (operationSubTypeSelect = 4: Vendor refund / credit note)
    try {
      await axelor.create("com.axelor.apps.account.db.Invoice", {
        invoiceSeq: returnSeq,
        company: { id: companyId },
        partner: { id: supplierId },
        operationSubTypeSelect: 4, // Vendor Credit Note
        statusSelect: 3, // Validated
        invoiceDate: today,
        dueDate: today,
        inTaxTotal: Number((returnTotal * 1.16).toFixed(2)),
        amountPaid: Number((returnTotal * 1.16).toFixed(2)),
        amountRemaining: 0,
        specificNotes: `Devolución de mercancía a proveedor Orden #${orderId} (${input.reason})`,
      });
    } catch (err) {
      console.warn("Vendor credit note creation warning:", err);
    }

    return {
      success: true,
      returnSeq,
      itemsReturned: input.items.length,
      totalAmount: Number((returnTotal * 1.16).toFixed(2)),
      timestamp: new Date().toISOString(),
    };
  }
}

export const purchasingService = new PurchasingService();
