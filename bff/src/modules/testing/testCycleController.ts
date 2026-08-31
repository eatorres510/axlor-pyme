import { Router, Response } from "express";
import { testCycleService } from "./testCycleService.js";
import { verifyJWT, AuthenticatedRequest } from "../auth/authMiddleware.js";

export const testCycleRouter = Router();

// POST /api/test/run-full-cycle
testCycleRouter.post("/run-full-cycle", verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.body.companyId, 10) || req.user?.activeCompanyId || 13;
    const report = await testCycleService.runFullCycle(companyId);
    res.json({
      success: true,
      message: `Ciclo integral de prueba ${report.executionId} ejecutado con estado ${report.overallStatus}`,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/test/last-run
testCycleRouter.get("/last-run", verifyJWT, (req: AuthenticatedRequest, res: Response) => {
  const lastRun = testCycleService.getLastRun();
  if (!lastRun) {
    res.json({
      success: true,
      message: "No se ha ejecutado ningún ciclo de prueba en esta sesión.",
      data: null,
    });
    return;
  }
  res.json({
    success: true,
    data: lastRun,
  });
});
