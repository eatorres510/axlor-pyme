import { Request, Response, Router } from "express";
import { dashboardService } from "./dashboardService.js";

export const dashboardRouter = Router();

dashboardRouter.get("/kpis", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const result = await dashboardService.getExecutiveKPIs(companyId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

dashboardRouter.get("/sales-trend", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const category = req.query.category as string | undefined;
    const result = await dashboardService.getSalesTrend(companyId, days, category);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
