import { Request, Response, Router } from "express";
import { stockService } from "./stockService.js";
import { StockLocationSchema, StockTransferSchema, StockAdjustmentSchema } from "./stockTypes.js";

export const stockRouter = Router();

stockRouter.get("/locations", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const result = await stockService.listLocations(companyId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

stockRouter.post("/locations", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = StockLocationSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de almacén inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await stockService.createLocation(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

stockRouter.get("/levels", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string, 10) : undefined;
    const lowStockOnly = req.query.lowStockOnly === "true";

    const result = await stockService.getStockLevels({ companyId, warehouseId, lowStockOnly });
    res.json({
      success: true,
      data: result.items,
      total: result.total,
      lowStockCount: result.lowStockCount,
      summary: result.summary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

stockRouter.get("/valuation", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string, 10) : undefined;

    const result = await stockService.getWarehouseValuation({ companyId, warehouseId });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

stockRouter.post("/transfers", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = StockTransferSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de traslado inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await stockService.transferStock(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

stockRouter.post("/adjustments", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = StockAdjustmentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de ajuste inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await stockService.adjustStock(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stock/kardex
stockRouter.get("/kardex", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string, 10) : undefined;
    const productId = req.query.productId ? parseInt(req.query.productId as string, 10) : undefined;

    const result = await stockService.listKardexMovements({ companyId, warehouseId, productId });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
