import { Router, Response } from "express";
import { logisticsService } from "./logisticsService";
import { CreateLotSchema, CreateDeliveryNoteSchema, CreateAdjustmentSchema } from "./logisticsTypes";
import { verifyJWT, tenantGuard, AuthenticatedRequest } from "../auth/authMiddleware";

export const logisticsRouter = Router();

logisticsRouter.use(verifyJWT);
logisticsRouter.use(tenantGuard);

// GET /api/logistics/lots
logisticsRouter.get("/lots", (req: AuthenticatedRequest, res: Response) => {
  const companyId = Number(req.query.companyId || req.user?.activeCompanyId || 13);
  res.json({
    success: true,
    data: logisticsService.listLots(companyId),
  });
});

// POST /api/logistics/lots
logisticsRouter.post("/lots", (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = CreateLotSchema.parse(req.body);
    const result = logisticsService.createLot(payload);
    res.status(201).json({
      success: true,
      message: `Lote ${result.lotNumber} registrado exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al registrar lote" });
  }
});

// GET /api/logistics/deliveries
logisticsRouter.get("/deliveries", (req: AuthenticatedRequest, res: Response) => {
  const companyId = Number(req.query.companyId || req.user?.activeCompanyId || 13);
  res.json({
    success: true,
    data: logisticsService.listDeliveries(companyId),
  });
});

// POST /api/logistics/deliveries
logisticsRouter.post("/deliveries", (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = CreateDeliveryNoteSchema.parse(req.body);
    const result = logisticsService.createDelivery(payload);
    res.status(201).json({
      success: true,
      message: `Remisión de Salida ${result.deliverySeq} generada exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al crear remisión" });
  }
});

// POST /api/logistics/deliveries/:id/delivered
logisticsRouter.post("/deliveries/:id/delivered", (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = logisticsService.markDelivered(req.params.id);
    res.json({
      success: true,
      message: `Remisión ${result.deliverySeq} marcada como entregada`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/logistics/adjustments
logisticsRouter.get("/adjustments", (req: AuthenticatedRequest, res: Response) => {
  const companyId = Number(req.query.companyId || req.user?.activeCompanyId || 13);
  res.json({
    success: true,
    data: logisticsService.listAdjustments(companyId),
  });
});

// POST /api/logistics/adjustments
logisticsRouter.post("/adjustments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = CreateAdjustmentSchema.parse(req.body);
    const result = await logisticsService.createAdjustment(payload);
    res.status(201).json({
      success: true,
      message: `Ajuste de inventario aplicado con asiento en cuenta ${result.accountCode}`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al registrar ajuste" });
  }
});
