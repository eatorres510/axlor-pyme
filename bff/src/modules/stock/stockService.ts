import { axelor } from "../../services/axelor/axelorClient.js";
import {
  StockLocationInput,
  StockTransferInput,
  StockAdjustmentInput,
  StockAdjustmentRecord,
  StockAdjustmentReason,
  InventoryValuationSummary,
  WarehouseValuation,
  ProductStockValuationItem,
} from "./stockTypes.js";
import { SEED_WAREHOUSES, SEED_PRODUCTS } from "../../data/masterRelationalSeed.js";

export const ADJUSTMENT_REASON_LABELS: Record<string, string> = {
  INITIAL_INVENTORY: "Inventario Inicial de Apertura",
  PHYSICAL_COUNT_SURPLUS: "Sobrante en Conteo Físico (+)",
  PHYSICAL_COUNT_SHORTAGE: "Faltante en Conteo Físico (-)",
  DAMAGED_WASTE: "Merma / Producto Dañado (-)",
  EXPIRED: "Caducidad / Producto Vencido (-)",
  INTERNAL_CONSUMPTION: "Consumo / Uso Interno (-)",
  THEFT_LOSS: "Pérdida por Robo o Extravío (-)",
  ENTRY_ERROR: "Corrección de Error de Captura",
  OTHER: "Ajuste Extraordinario de Inventario",
};

export const ADJUSTMENTS_STORE: StockAdjustmentRecord[] = [
  {
    id: "ADJ-1001",
    voucherSeq: "AJU-2026-01001",
    date: "2026-09-01",
    companyId: 13,
    warehouseId: 6,
    warehouseName: "Almacén Principal",
    warehouseCode: "ALM-PRINCIPAL",
    productId: 1,
    productName: "Agua Mineral 600ml",
    productCode: "7501055312345",
    categoryName: "Bebidas y Refrescos",
    uomCode: "PZA",
    previousStock: 0,
    physicalQty: 50,
    deltaQty: 50,
    adjustmentType: "INFLOW",
    unitCost: 8.0,
    totalImpactValue: 400.0,
    reason: "INITIAL_INVENTORY",
    reasonLabel: "Inventario Inicial de Apertura",
    notes: "Carga de saldo inicial por apertura de sistema",
    stockMoveId: 8101,
    responsibleName: "Auditoría de Inventarios",
    status: "APPLIED",
  },
];

export class StockService {
  // ==========================================
  // ALMACENES / BODEGAS
  // ==========================================

  public async listLocations(companyId: number): Promise<any[]> {
    let locs: any[] = [];
    try {
      const res = await axelor.search("com.axelor.apps.stock.db.StockLocation", {
        data: {
          _domain: `self.company.id = ${companyId}`,
        },
        limit: 50,
        sortBy: ["name"],
      });
      locs = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.warn("Error searching stock locations in Axelor:", e);
    }

    if (locs.length === 0) {
      locs = SEED_WAREHOUSES.map((w) => ({
        ...w,
        company: { id: companyId },
      }));
    }
    return locs;
  }

  public async createLocation(input: StockLocationInput): Promise<any> {
    const code = input.code || `ALM-${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      name: input.name,
      code: code,
      typeSelect: 1, // Internal Warehouse
      company: { id: input.companyId },
      usableOnSaleOrder: input.usableOnSaleOrder,
      usableOnPurchaseOrder: input.usableOnPurchaseOrder,
    };

    try {
      const res = await axelor.create("com.axelor.apps.stock.db.StockLocation", payload);
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      if (item && item.id) return item;
    } catch (e) {
      console.warn("Axelor createLocation fallback:", e);
    }

    return {
      id: Math.floor(100 + Math.random() * 900),
      name: input.name,
      code,
      typeSelect: 1,
      company: { id: input.companyId },
    };
  }

  // ==========================================
  // VALORACIÓN DE INVENTARIO POR BODEGA
  // ==========================================

  public async getWarehouseValuation(params: {
    companyId: number;
    warehouseId?: number;
  }): Promise<InventoryValuationSummary> {
    const { companyId, warehouseId } = params;
    const locations = await this.listLocations(companyId);

    // 1. Fetch products
    let products: any[] = [];
    try {
      const prodRes = await axelor.search("com.axelor.apps.base.db.Product", {
        data: { _domain: "self.stockManaged = true" },
        limit: 500,
      });
      products = Array.isArray(prodRes.data) ? prodRes.data : [];
    } catch (e) {
      console.warn("Error fetching products for valuation:", e);
    }

    if (products.length === 0) {
      products = SEED_PRODUCTS;
    }

    // 2. Fetch stock moves by location
    const warehouseStockMap: Record<number, Record<number, number>> = {};
    for (const loc of locations) {
      warehouseStockMap[loc.id] = {};
    }

    const primaryLocId = locations[0]?.id || 6;
    const resolveLocId = (loc: any): number => {
      if (!loc) return primaryLocId;
      if (typeof loc === "number") {
        if (warehouseStockMap[loc]) return loc;
        return primaryLocId;
      }
      if (loc.id && warehouseStockMap[loc.id]) return loc.id;
      if (loc.name && typeof loc.name === "string") {
        const found = locations.find((l) => l.name?.toLowerCase().trim() === loc.name?.toLowerCase().trim());
        if (found) return found.id;
      }
      return primaryLocId;
    };

    try {
      const movesRes = await axelor.search("com.axelor.apps.stock.db.StockMoveLine", {
        data: { _domain: "self.stockMove.statusSelect = 2" },
        fields: ["product", "qty", "fromStockLocation", "toStockLocation", "stockMove.typeSelect", "stockMove.origin"],
        limit: 1500,
      });
      const moves = Array.isArray(movesRes.data) ? movesRes.data : [];
      for (const m of moves) {
        const pId = m.product?.id;
        const qty = Number(m.qty || 0);
        const toLocId = resolveLocId(m.toStockLocation);
        const fromLocId = resolveLocId(m.fromStockLocation);
        const moveType = (m as any)["stockMove.typeSelect"] ?? m.stockMove?.typeSelect;

        if (!pId) continue;

        if (moveType === 1) {
          // Inflow / Entrada de compras o ajuste positivo: suma a almacén destino
          if (warehouseStockMap[toLocId]) {
            warehouseStockMap[toLocId][pId] = (warehouseStockMap[toLocId][pId] || 0) + qty;
          }
        } else if (moveType === 2) {
          // Outflow / Salida por venta B2B o POS: resta de almacén origen
          if (warehouseStockMap[fromLocId]) {
            warehouseStockMap[fromLocId][pId] = (warehouseStockMap[fromLocId][pId] || 0) - qty;
          }
        } else if (moveType === 3) {
          // Traslado interno entre bodegas
          if (fromLocId !== toLocId) {
            if (warehouseStockMap[fromLocId]) {
              warehouseStockMap[fromLocId][pId] = (warehouseStockMap[fromLocId][pId] || 0) - qty;
            }
            if (warehouseStockMap[toLocId]) {
              warehouseStockMap[toLocId][pId] = (warehouseStockMap[toLocId][pId] || 0) + qty;
            }
          }
        } else {
          if (warehouseStockMap[fromLocId]) {
            warehouseStockMap[fromLocId][pId] = (warehouseStockMap[fromLocId][pId] || 0) - qty;
          }
        }
      }
    } catch (e) {
      console.warn("Error fetching stock moves for warehouse breakdown:", e);
    }

    // Default base stock distribution
    const defaultWarehouseWeights: Record<number, number> = {
      0: 0.55,
      1: 0.30,
      2: 0.15,
    };

    let totalCompanyCostValuation = 0;
    let totalCompanySaleValuation = 0;
    let totalCompanyUnits = 0;
    let totalCriticalItems = 0;
    const globalSkusSet = new Set<number>();

    const warehouseValuations: WarehouseValuation[] = locations.map((loc, locIdx) => {
      const weight = defaultWarehouseWeights[locIdx] || 0.33;
      let whCostValuation = 0;
      let whSaleValuation = 0;
      let whUnits = 0;
      let whCritical = 0;
      let whSkus = 0;

      const items: ProductStockValuationItem[] = products.map((p: any) => {
        // Net movement delta (Inflows - Outflows) from Axelor StockMoveLines
        const deltaMoves = warehouseStockMap[loc.id]?.[p.id] || 0;

        // Current real stock = deltaMoves (starts at 0 for new products)
        const stock = Math.max(0, deltaMoves);

        const cost = Number(p.costPrice || 12.0);
        const sale = Number(p.salePrice || cost * 1.6);
        const minStock = Number(p.minStock || 0);
        const maxStock = Number(p.maxStock || 200);
        const isLow = minStock > 0 && stock <= minStock;

        const totalCostValue = Number((stock * cost).toFixed(2));
        const totalSaleValue = Number((stock * sale).toFixed(2));
        const marginValue = Number((totalSaleValue - totalCostValue).toFixed(2));
        const marginPercent = totalSaleValue > 0 ? Number(((marginValue / totalSaleValue) * 100).toFixed(1)) : 0;

        if (stock > 0) {
          whSkus++;
          globalSkusSet.add(p.id);
        }
        whUnits += stock;
        whCostValuation += totalCostValue;
        whSaleValuation += totalSaleValue;
        if (isLow) {
          whCritical++;
          totalCriticalItems++;
        }

        return {
          productId: p.id,
          productName: p.name || p.fullName || "Producto",
          productCode: p.code || `SKU-${p.id}`,
          category: p.category?.name || p.category || "General",
          locationId: loc.id,
          locationName: loc.name,
          currentStock: stock,
          minStock,
          maxStock,
          costPrice: cost,
          salePrice: sale,
          totalCostValue,
          totalSaleValue,
          marginValue,
          marginPercent,
          isLowStock: isLow,
          uomCode: p.unit?.code || "PZA",
        };
      });

      totalCompanyCostValuation += whCostValuation;
      totalCompanySaleValuation += whSaleValuation;
      totalCompanyUnits += whUnits;

      const projectedMargin = Number((whSaleValuation - whCostValuation).toFixed(2));
      const projectedMarginPercent =
        whSaleValuation > 0 ? Number(((projectedMargin / whSaleValuation) * 100).toFixed(1)) : 0;

      return {
        warehouseId: loc.id,
        warehouseName: loc.name,
        warehouseCode: loc.code || `ALM-${loc.id}`,
        totalSkus: whSkus,
        totalUnits: whUnits,
        totalCostValuation: Number(whCostValuation.toFixed(2)),
        totalSaleValuation: Number(whSaleValuation.toFixed(2)),
        projectedMargin,
        projectedMarginPercent,
        percentageOfTotal: 0,
        criticalStockCount: whCritical,
        items,
      };
    });

    for (const wh of warehouseValuations) {
      wh.percentageOfTotal =
        totalCompanyCostValuation > 0
          ? Number(((wh.totalCostValuation / totalCompanyCostValuation) * 100).toFixed(1))
          : 0;
    }

    const overallGrossMargin = totalCompanySaleValuation - totalCompanyCostValuation;
    const overallGrossMarginPercent =
      totalCompanySaleValuation > 0 ? Number(((overallGrossMargin / totalCompanySaleValuation) * 100).toFixed(1)) : 0;

    return {
      companyId,
      generatedAt: new Date().toISOString(),
      totalCompanyCostValuation: Number(totalCompanyCostValuation.toFixed(2)),
      totalCompanySaleValuation: Number(totalCompanySaleValuation.toFixed(2)),
      totalCompanyUnits,
      totalActiveSkus: globalSkusSet.size,
      totalCriticalItems,
      overallGrossMarginPercent,
      warehouses: warehouseValuations,
      selectedWarehouseId: warehouseId,
    };
  }

  // ==========================================
  // NIVELES DE EXISTENCIAS & ALERTAS
  // ==========================================

  public async getStockLevels(params: {
    companyId: number;
    warehouseId?: number;
    lowStockOnly?: boolean;
  }): Promise<{
    items: Array<ProductStockValuationItem & { code?: string; locationName?: string }>;
    total: number;
    lowStockCount: number;
    summary: InventoryValuationSummary;
  }> {
    const valuation = await this.getWarehouseValuation(params);

    let allItems: any[] = [];
    if (params.warehouseId && params.warehouseId > 0) {
      const wh = valuation.warehouses.find((w) => w.warehouseId === params.warehouseId);
      allItems = wh ? wh.items : [];
    } else {
      allItems = valuation.warehouses.flatMap((w) => w.items);
    }

    if (params.lowStockOnly) {
      allItems = allItems.filter((i) => i.isLowStock);
    }

    return {
      items: allItems.map((it) => ({
        ...it,
        code: it.productCode,
      })),
      total: allItems.length,
      lowStockCount: valuation.totalCriticalItems,
      summary: valuation,
    };
  }

  // ==========================================
  // TRASLADOS ENTRE ALMACENES
  // ==========================================

  public async transferStock(input: StockTransferInput): Promise<{
    success: boolean;
    stockMoveId: number;
    fromWarehouseId: number;
    toWarehouseId: number;
    itemCount: number;
    timestamp: string;
  }> {
    const today = new Date().toISOString().slice(0, 10);

    const moveLines = input.items.map((item) => ({
      product: { id: item.productId },
      productName: item.productName,
      qty: item.qty,
      unitPrice: item.unitPrice,
      fromStockLocation: { id: input.fromWarehouseId },
      toStockLocation: { id: input.toWarehouseId },
    }));

    const payload = {
      typeSelect: 3, // Internal Transfer
      statusSelect: 2, // Realized
      company: { id: input.companyId },
      fromStockLocation: { id: input.fromWarehouseId },
      toStockLocation: { id: input.toWarehouseId },
      estimatedDate: today,
      realDate: today,
      stockMoveLineList: moveLines,
      notes: input.notes,
    };

    const res = await axelor.create("com.axelor.apps.stock.db.StockMove", payload);
    const item = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!item || !item.id) {
      throw new Error(`Error al registrar traslado interno: ${JSON.stringify(res)}`);
    }

    return {
      success: true,
      stockMoveId: item.id,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      itemCount: input.items.length,
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================
  // AJUSTES DE INVENTARIO (AXELOR BACKED)
  // ==========================================

  public async adjustStock(input: StockAdjustmentInput): Promise<StockAdjustmentRecord> {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Consultar metadatos del producto en Axelor
    let prod: any = null;
    try {
      prod = await axelor.fetch("com.axelor.apps.base.db.Product", input.productId);
    } catch (e: any) {
      console.warn("[StockService] Error fetching product for adjustment:", e.message);
    }

    const prodName = prod?.name || prod?.fullName || input.productName || "Producto";
    const prodCode = prod?.code || input.productCode || `SKU-${input.productId}`;
    const categoryName = prod?.productCategory?.name || prod?.category?.name || "General";
    const uomCode = prod?.unit?.code || "PZA";
    const costPrice = Number(prod?.costPrice || prod?.purchasePrice || 12.0);

    // 2. Consultar almacén en Axelor
    let warehouseName = "Almacén Principal";
    let warehouseCode = `ALM-${input.warehouseId}`;
    try {
      const loc = await axelor.fetch("com.axelor.apps.stock.db.StockLocation", input.warehouseId);
      if (loc) {
        warehouseName = loc.name || warehouseName;
        warehouseCode = loc.code || warehouseCode;
      }
    } catch {}

    // 3. Consultar existencia teórica actual en Axelor para este producto y almacén
    let previousStock = 0;
    try {
      const domain = `self.product.id = ${input.productId} and self.stockMove.statusSelect = 2 and (self.fromStockLocation.id = ${input.warehouseId} or self.toStockLocation.id = ${input.warehouseId})`;
      const movesRes = await axelor.search("com.axelor.apps.stock.db.StockMoveLine", {
        data: { _domain: domain },
        fields: ["qty", "stockMove.typeSelect", "fromStockLocation", "toStockLocation"],
        limit: 1000,
      });

      const moves = Array.isArray(movesRes.data) ? movesRes.data : [];
      let netStock = 0;
      for (const m of moves) {
        const qty = Number(m.qty || 0);
        const moveType = (m as any)["stockMove.typeSelect"] ?? m.stockMove?.typeSelect;
        const fromLocId = m.fromStockLocation?.id;
        const toLocId = m.toStockLocation?.id;

        if (moveType === 1) {
          netStock += qty;
        } else if (moveType === 2) {
          netStock -= qty;
        } else if (moveType === 3) {
          if (toLocId === input.warehouseId) netStock += qty;
          else if (fromLocId === input.warehouseId) netStock -= qty;
        }
      }
      previousStock = Math.max(0, netStock);
    } catch (e: any) {
      console.warn("[StockService] Error fetching previous stock from Axelor:", e.message);
    }

    // 4. Calcular delta matemático: Δ = Conteo Físico - Existencia Teórica
    const physicalQty = Number(input.physicalQty);
    if (isNaN(physicalQty) || physicalQty < 0) {
      throw new Error(`❌ BLOQUEO DE CONTROL INTERNO: La existencia física no puede ser negativa (${physicalQty}). La existencia mínima permitida es 0.`);
    }

    const delta = physicalQty - previousStock;
    const absDelta = Math.abs(delta);

    // Regla de Control de Inventario: El ajuste de salida no puede superar la existencia real disponible
    if (delta < 0 && absDelta > previousStock) {
      throw new Error(`❌ BLOQUEO DE STOCK: No se puede dar salida a más unidades (${absDelta} pzas) de las que existen realmente en el almacén (${previousStock} pzas). La existencia resultante no puede ser negativa.`);
    }

    // Consecutivo oficial de vale
    const voucherIndex = ADJUSTMENTS_STORE.length + 1001;
    const voucherSeq = `AJU-2026-${String(voucherIndex).padStart(5, "0")}`;
    const reasonLabel = ADJUSTMENT_REASON_LABELS[input.reason] || input.reason || "Ajuste de inventario";

    let stockMoveId = 1;
    let adjustmentType: "INFLOW" | "OUTFLOW" | "NO_CHANGE" = "NO_CHANGE";

    // 5. Si hay diferencia, registrar StockMove y StockMoveLine en Axelor
    if (delta !== 0) {
      let typeSelect = 1; // 1 = Entrada, 2 = Salida
      let originStr = "";

      if (delta > 0) {
        typeSelect = 1;
        adjustmentType = "INFLOW";
        originStr = `Ajuste (+) [${voucherSeq}] - ${reasonLabel}`;
      } else {
        typeSelect = 2;
        adjustmentType = "OUTFLOW";
        originStr = `Ajuste (-) [${voucherSeq}] - ${reasonLabel}`;
      }

      const moveLines = [
        {
          product: { id: input.productId },
          productName: prodName,
          qty: absDelta,
          unitPrice: costPrice,
          fromStockLocation: { id: input.warehouseId },
          toStockLocation: { id: input.warehouseId },
        },
      ];

      const payload = {
        typeSelect,
        statusSelect: 2, // Realized / Validé
        company: { id: input.companyId },
        fromStockLocation: { id: input.warehouseId },
        toStockLocation: { id: input.warehouseId },
        estimatedDate: today,
        realDate: today,
        origin: originStr,
        stockMoveLineList: moveLines,
        notes: input.notes ? `${reasonLabel}: ${input.notes}` : reasonLabel,
      };

      try {
        const res = await axelor.create("com.axelor.apps.stock.db.StockMove", payload);
        const created = Array.isArray(res.data) ? res.data[0] : res.data;
        if (created?.id) stockMoveId = created.id;
      } catch (err: any) {
        console.warn("[StockService] Error creando StockMove en Axelor:", err.message);
      }
    }

    const totalImpactValue = Number((absDelta * costPrice).toFixed(2));

    const record: StockAdjustmentRecord = {
      id: `ADJ-${Date.now()}`,
      voucherSeq,
      date: today,
      companyId: input.companyId,
      warehouseId: input.warehouseId,
      warehouseName,
      warehouseCode,
      productId: input.productId,
      productName: prodName,
      productCode: prodCode,
      categoryName,
      uomCode,
      previousStock,
      physicalQty,
      deltaQty: delta,
      adjustmentType,
      unitCost: costPrice,
      totalImpactValue,
      reason: input.reason,
      reasonLabel,
      notes: input.notes,
      stockMoveId,
      responsibleName: input.responsibleName || "Responsable de Almacén",
      status: "APPLIED",
    };

    ADJUSTMENTS_STORE.unshift(record);
    return record;
  }

  public async listAdjustments(params: {
    companyId: number;
    warehouseId?: number;
    productId?: number;
  }): Promise<StockAdjustmentRecord[]> {
    let list = ADJUSTMENTS_STORE.filter((a) => a.companyId === params.companyId);
    if (params.warehouseId && params.warehouseId > 0) {
      list = list.filter((a) => a.warehouseId === params.warehouseId);
    }
    if (params.productId && params.productId > 0) {
      list = list.filter((a) => a.productId === params.productId);
    }
    return list;
  }

  public async getAdjustmentVoucher(idOrSeq: string): Promise<StockAdjustmentRecord | null> {
    const match = ADJUSTMENTS_STORE.find((a) => a.id === idOrSeq || a.voucherSeq === idOrSeq);
    return match || null;
  }

  // ==========================================
  // KARDEX DE MOVIMIENTOS HISTÓRICOS
  // ==========================================

  public async listKardexMovements(params: {
    companyId: number;
    warehouseId?: number;
    productId?: number;
  }): Promise<any[]> {
    try {
      let domain = "self.stockMove.statusSelect = 2";
      if (params.warehouseId && params.warehouseId > 0) {
        domain += ` and (self.fromStockLocation.id = ${params.warehouseId} or self.toStockLocation.id = ${params.warehouseId})`;
      }
      if (params.productId && params.productId > 0) {
        domain += ` and self.product.id = ${params.productId}`;
      }

      const movesRes = await axelor.search("com.axelor.apps.stock.db.StockMoveLine", {
        data: { _domain: domain },
        fields: [
          "id",
          "product",
          "productName",
          "qty",
          "unitPrice",
          "fromStockLocation",
          "toStockLocation",
          "stockMove.typeSelect",
          "stockMove.origin",
          "stockMove.realDate",
          "stockMove.createdOn",
          "stockMove.notes",
        ],
        sortBy: ["-id", "-stockMove.realDate"],
        limit: 300,
      });

      const list = Array.isArray(movesRes.data) ? movesRes.data : [];
      return list.map((m: any) => {
        const typeSelect = (m as any)["stockMove.typeSelect"] ?? m.stockMove?.typeSelect ?? 2;
        const originStr = (m as any)["stockMove.origin"] ?? m.stockMove?.origin ?? "Movimiento de Inventario";
        const dateStr = (m as any)["stockMove.realDate"] ?? (m as any)["stockMove.createdOn"] ?? new Date().toISOString().slice(0, 10);
        const qtyNum = Number(m.qty || 0);

        let typeLabel = "Salida por Venta";
        let typeCode = "OUTFLOW";
        if (typeSelect === 1) {
          typeLabel = "Entrada por Compra / Ajuste";
          typeCode = "INFLOW";
        } else if (typeSelect === 2) {
          if (originStr.includes("POS")) {
            typeLabel = "Salida por Venta POS";
            typeCode = "POS_SALE";
          } else {
            typeLabel = "Salida por Factura B2B";
            typeCode = "B2B_SALE";
          }
        } else if (typeSelect === 3) {
          typeLabel = "Traslado entre Bodegas";
          typeCode = "TRANSFER";
        }

        return {
          id: String(m.id),
          date: String(dateStr).slice(0, 10),
          productId: m.product?.id || 1,
          productName: m.productName || m.product?.name || m.product?.fullName || "Producto",
          productCode: m.product?.code || `SKU-${m.product?.id || ""}`,
          qty: qtyNum,
          unitPrice: Number(m.unitPrice || 0),
          fromWarehouseName: m.fromStockLocation?.name || "Almacén Principal",
          toWarehouseName: m.toStockLocation?.name || "Almacén Principal",
          typeSelect,
          typeLabel,
          typeCode,
          origin: originStr,
          status: "CONTABILIZADO",
        };
      });
    } catch (err: any) {
      console.warn("[StockService] Error consultando Kardex en Axelor:", err.message);
      return [];
    }
  }

  // ==========================================
  // KARDEX POR PRODUCTO INDIVIDUAL (LEDGER)
  // ==========================================

  public async getProductKardex(params: {
    companyId: number;
    productId: number;
    warehouseId?: number;
  }): Promise<{
    product: {
      id: number;
      name: string;
      code: string;
      barCode?: string;
      categoryName: string;
      uomCode: string;
      costPrice: number;
      salePrice: number;
      minStock: number;
      maxStock: number;
    };
    summary: {
      initialStock: number;
      totalInflows: number;
      totalOutflows: number;
      currentStock: number;
      costPrice: number;
      salePrice: number;
      totalCostValuation: number;
      totalSaleValuation: number;
      isLowStock: boolean;
    };
    ledger: Array<{
      id: string;
      date: string;
      origin: string;
      typeSelect: number;
      typeLabel: string;
      typeCode: string;
      warehouseName: string;
      inflowQty: number;
      outflowQty: number;
      unitPrice: number;
      runningBalance: number;
      balanceValue: number;
      status: string;
    }>;
  }> {
    const { companyId, productId, warehouseId } = params;

    // 1. Fetch Product metadata
    let prod: any = null;
    try {
      const prodRes = await axelor.fetch("com.axelor.apps.base.db.Product", productId);
      if (prodRes) prod = prodRes;
    } catch {}

    const productName = prod?.name || prod?.fullName || "Producto";
    const productCode = prod?.code || `SKU-${productId}`;
    const barCode = prod?.barCode || prod?.barcode || "";
    const categoryName = prod?.category?.name || "General";
    const uomCode = prod?.unit?.code || "PZA";
    const costPrice = Number(prod?.costPrice || 12.0);
    const salePrice = Number(prod?.salePrice || costPrice * 1.6);
    const minStock = Number(prod?.minStock || 20);
    const maxStock = Number(prod?.maxStock || 200);

    // 2. Fetch stock moves for this product in chronological order
    let domain = `self.product.id = ${productId} and self.stockMove.statusSelect = 2`;
    if (warehouseId && warehouseId > 0) {
      domain += ` and (self.fromStockLocation.id = ${warehouseId} or self.toStockLocation.id = ${warehouseId})`;
    }

    let rawMoves: any[] = [];
    try {
      const movesRes = await axelor.search("com.axelor.apps.stock.db.StockMoveLine", {
        data: { _domain: domain },
        fields: [
          "id",
          "product",
          "productName",
          "qty",
          "unitPrice",
          "fromStockLocation",
          "toStockLocation",
          "stockMove.typeSelect",
          "stockMove.origin",
          "stockMove.realDate",
          "stockMove.createdOn",
          "stockMove.notes",
        ],
        sortBy: ["id"], // Chronological order
        limit: 500,
      });
      rawMoves = Array.isArray(movesRes.data) ? movesRes.data : [];
    } catch (e: any) {
      console.warn("[StockService] Error fetching product moves:", e.message);
    }

    // 3. Compute real inventory based strictly on Axelor stock movements
    let runningBalance = 0;
    let totalInflows = 0;
    let totalOutflows = 0;

    const ledger = rawMoves.map((m: any) => {
      const typeSelect = (m as any)["stockMove.typeSelect"] ?? m.stockMove?.typeSelect ?? 2;
      const originStr = (m as any)["stockMove.origin"] ?? m.stockMove?.origin ?? "Movimiento de Inventario";
      const dateStr = (m as any)["stockMove.realDate"] ?? (m as any)["stockMove.createdOn"] ?? new Date().toISOString().slice(0, 10);
      const qty = Number(m.qty || 0);
      const unitPrice = Number(m.unitPrice || costPrice);

      let inflowQty = 0;
      let outflowQty = 0;
      let typeLabel = "Salida por Venta";
      let typeCode = "OUTFLOW";

      if (typeSelect === 1) {
        typeLabel = "Entrada por Compra / Recepción";
        typeCode = "INFLOW";
        inflowQty = qty;
        totalInflows += qty;
        runningBalance += qty;
      } else if (typeSelect === 2) {
        if (originStr.includes("POS")) {
          typeLabel = "Salida por Venta POS";
          typeCode = "POS_SALE";
        } else {
          typeLabel = "Salida por Factura B2B";
          typeCode = "B2B_SALE";
        }
        outflowQty = qty;
        totalOutflows += qty;
        runningBalance -= qty;
      } else if (typeSelect === 3) {
        typeLabel = "Traslado entre Bodegas";
        typeCode = "TRANSFER";
        if (warehouseId && warehouseId > 0) {
          const fromLocId = m.fromStockLocation?.id;
          const toLocId = m.toStockLocation?.id;
          if (toLocId === warehouseId) {
            inflowQty = qty;
            totalInflows += qty;
            runningBalance += qty;
          } else if (fromLocId === warehouseId) {
            outflowQty = qty;
            totalOutflows += qty;
            runningBalance -= qty;
          }
        }
      } else {
        outflowQty = qty;
        totalOutflows += qty;
        runningBalance -= qty;
      }

      const balanceValue = Number((Math.max(0, runningBalance) * costPrice).toFixed(2));

      return {
        id: String(m.id),
        date: String(dateStr).slice(0, 10),
        origin: originStr,
        typeSelect,
        typeLabel,
        typeCode,
        warehouseName: m.toStockLocation?.name || m.fromStockLocation?.name || "Almacén Principal",
        inflowQty,
        outflowQty,
        unitPrice,
        runningBalance: Math.max(0, runningBalance),
        balanceValue,
        status: "CONTABILIZADO",
      };
    });

    const currentStock = Math.max(0, runningBalance);
    const totalCostValuation = Number((currentStock * costPrice).toFixed(2));
    const totalSaleValuation = Number((currentStock * salePrice).toFixed(2));
    const isLowStock = minStock > 0 && currentStock <= minStock;

    return {
      product: {
        id: productId,
        name: productName,
        code: productCode,
        barCode,
        categoryName,
        uomCode,
        costPrice,
        salePrice,
        minStock,
        maxStock,
      },
      summary: {
        initialStock: 0,
        totalInflows,
        totalOutflows,
        currentStock,
        costPrice,
        salePrice,
        totalCostValuation,
        totalSaleValuation,
        isLowStock,
      },
      ledger: ledger.reverse(), // Show newest first in UI table
    };
  }
}

export const stockService = new StockService();
