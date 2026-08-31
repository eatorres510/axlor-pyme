import { Router, Response } from "express";
import { saasService } from "./saasService";
import { CreateTenantSchema } from "./saasTypes";
import { verifyJWT, requireRole, AuthenticatedRequest } from "../auth/authMiddleware";

export const saasRouter = Router();

// GET /api/saas/plans (Público / Informativo)
saasRouter.get("/plans", (req, res: Response) => {
  res.json({
    success: true,
    data: saasService.listPlans(),
  });
});

// GET /api/saas/tenants (Requiere SUPER_ADMIN)
saasRouter.get("/tenants", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: saasService.listTenants(),
  });
});

// GET /api/saas/metrics (Requiere SUPER_ADMIN)
saasRouter.get("/metrics", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: saasService.getSaaSMetrics(),
  });
});

// POST /api/saas/tenants (Aprovisionamiento Express - Requiere SUPER_ADMIN)
saasRouter.post("/tenants", verifyJWT, requireRole(["SUPER_ADMIN"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = CreateTenantSchema.parse(req.body);
    const result = await saasService.provisionTenant(payload);
    res.status(201).json({
      success: true,
      message: `Tenant ${payload.tenantName} aprovisionado exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Error al aprovisionar nuevo tenant",
    });
  }
});

// PUT /api/saas/tenants/:id (Actualizar Tenant)
saasRouter.put("/tenants/:id", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = saasService.updateTenant(req.params.id, req.body);
    res.json({
      success: true,
      message: `Tenant ${result.name} actualizado`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/saas/tenants/:id/status (Suspender / Activar Tenant)
saasRouter.put("/tenants/:id/status", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = saasService.toggleTenantStatus(req.params.id);
    res.json({
      success: true,
      message: `Estado del tenant ${result.name} cambiado a ${result.status}`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/saas/tenants/:id/reset-password (Resetear Password Master)
saasRouter.post("/tenants/:id/reset-password", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = saasService.resetTenantPassword(req.params.id, req.body.newPassword);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/saas/tenants/:id (Eliminar Tenant)
saasRouter.delete("/tenants/:id", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = saasService.deleteTenant(req.params.id);
    res.json({
      success,
      message: success ? "Tenant eliminado exitosamente" : "Tenant no encontrado",
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/saas/plans (Crear Plan SaaS)
saasRouter.post("/plans", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = saasService.createPlan(req.body);
    res.status(201).json({
      success: true,
      message: `Plan ${result.name} creado exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/saas/plans/:code (Actualizar Plan SaaS)
saasRouter.put("/plans/:code", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = saasService.updatePlan(req.params.code, req.body);
    res.json({
      success: true,
      message: `Plan ${result.name} actualizado`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/saas/plans/:code (Eliminar Plan SaaS)
saasRouter.delete("/plans/:code", verifyJWT, requireRole(["SUPER_ADMIN"]), (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = saasService.deletePlan(req.params.code);
    res.json({
      success,
      message: success ? "Plan eliminado" : "No encontrado",
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
