import { axelor } from "../../services/axelor/axelorClient";
import { CreateLotPayload, CreateDeliveryNotePayload, CreateAdjustmentPayload } from "./logisticsTypes";

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
  accountCode: string; // 501.01 o 609.01
  date: string;
  notes?: string;
}

// In-memory registries
export const lotsRegistry: BatchLotRecord[] = [
  {
    id: "LOT-001",
    companyId: 13,
    productId: 1,
    productName: "Agua Mineral 600ml",
    lotNumber: "LOTE-2026-A12",
    stockQty: 450,
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    daysRemaining: 180,
    status: "GOOD",
    warehouseId: 1,
  },
  {
    id: "LOT-002",
    companyId: 13,
    productId: 2,
    productName: "Bebida Energética 500ml",
    lotNumber: "LOTE-2025-E88",
    stockQty: 80,
    expiryDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    daysRemaining: 20,
    status: "NEAR_EXPIRY",
    warehouseId: 1,
  },
];

export const deliveryNotesRegistry: DeliveryNoteRecord[] = [
  {
    id: "REM-001",
    deliverySeq: "REM-2026-001",
    companyId: 13,
    partnerId: 10,
    partnerName: "Constructora del Bajío S.A.",
    driverName: "Armando Paredes",
    licensePlates: "NKL-4589",
    destinationAddress: "Av. Central 890, Bodega 4",
    status: "IN_TRANSIT",
    departureDate: new Date().toISOString().slice(0, 10),
    items: [{ productId: 1, productName: "Agua Mineral 600ml", qty: 100, lotNumber: "LOTE-2026-A12" }],
    notes: "Entregar en puerta 2 de almacén",
  },
];

export const adjustmentsRegistry: InventoryAdjustmentRecord[] = [
  {
    id: "ADJ-001",
    companyId: 13,
    productId: 1,
    productName: "Agua Mineral 600ml",
    beforeQty: 50,
    countedQty: 48,
    difference: -2,
    reason: "ROTURA",
    accountCode: "609.01",
    date: new Date().toISOString().slice(0, 10),
    notes: "2 botellas dañadas en maniobra de montacargas",
  },
];

export class LogisticsService {
  listLots(companyId: number): BatchLotRecord[] {
    return lotsRegistry.filter((l) => l.companyId === Number(companyId));
  }

  createLot(payload: CreateLotPayload): BatchLotRecord {
    const expiry = new Date(payload.expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

    let status: "GOOD" | "NEAR_EXPIRY" | "EXPIRED" = "GOOD";
    if (diffDays <= 0) status = "EXPIRED";
    else if (diffDays <= 30) status = "NEAR_EXPIRY";

    const newLot: BatchLotRecord = {
      id: `LOT-${Math.floor(Math.random() * 899) + 100}`,
      companyId: payload.companyId,
      productId: payload.productId,
      productName: payload.productName,
      lotNumber: payload.lotNumber,
      stockQty: payload.stockQty,
      expiryDate: payload.expiryDate,
      daysRemaining: Math.max(0, diffDays),
      status,
      warehouseId: payload.warehouseId,
    };

    lotsRegistry.unshift(newLot);
    return newLot;
  }

  listDeliveries(companyId: number): DeliveryNoteRecord[] {
    return deliveryNotesRegistry.filter((d) => d.companyId === Number(companyId));
  }

  createDelivery(payload: CreateDeliveryNotePayload): DeliveryNoteRecord {
    const seq = deliveryNotesRegistry.length + 1;
    const newDelivery: DeliveryNoteRecord = {
      id: `REM-2026-${seq.toString().padStart(5, "0")}`,
      deliverySeq: `REM-2026-${seq.toString().padStart(5, "0")}`,
      companyId: payload.companyId,
      partnerId: payload.partnerId,
      partnerName: payload.partnerName,
      driverName: payload.driverName,
      licensePlates: payload.licensePlates,
      destinationAddress: payload.destinationAddress,
      status: "IN_TRANSIT",
      departureDate: new Date().toISOString().slice(0, 10),
      items: payload.items,
      notes: payload.notes,
    };

    deliveryNotesRegistry.unshift(newDelivery);
    return newDelivery;
  }

  markDelivered(deliveryId: string): DeliveryNoteRecord {
    const item = deliveryNotesRegistry.find((d) => d.id === deliveryId || d.deliverySeq === deliveryId);
    if (!item) throw new Error("Remisión no encontrada");
    item.status = "DELIVERED";
    return item;
  }

  listAdjustments(companyId: number): InventoryAdjustmentRecord[] {
    return adjustmentsRegistry.filter((a) => a.companyId === Number(companyId));
  }

  async createAdjustment(payload: CreateAdjustmentPayload): Promise<InventoryAdjustmentRecord> {
    const difference = payload.countedQty - payload.beforeQty;
    const accountCode = difference < 0 ? "609.01" : "501.01";
    const seq = adjustmentsRegistry.length + 1;

    const newAdj: InventoryAdjustmentRecord = {
      id: `ADJ-2026-${seq.toString().padStart(5, "0")}`,
      companyId: payload.companyId,
      productId: payload.productId,
      productName: payload.productName,
      beforeQty: payload.beforeQty,
      countedQty: payload.countedQty,
      difference,
      reason: payload.reason,
      accountCode,
      date: new Date().toISOString().slice(0, 10),
      notes: payload.notes,
    };

    // Registrar asiento en Axelor
    try {
      await axelor.create("com.axelor.apps.account.db.Move", {
        name: `Ajuste Inventario - ${payload.productName} (${payload.reason})`,
        date: new Date().toISOString().slice(0, 10),
        company: { id: payload.companyId },
      });
    } catch (e) {
      console.warn("Ajuste registrado en memoria:", e);
    }

    adjustmentsRegistry.unshift(newAdj);
    return newAdj;
  }
}

export const logisticsService = new LogisticsService();
