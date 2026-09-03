import { Request, Response, Router } from "express";
import { payrollService } from "./payrollService.js";
import {
  EmployeeSchema,
  UpdateEmployeeSchema,
  PayrollPeriodSchema,
  UpdatePayrollPeriodSchema,
  AdvanceSchema,
  UpdateAdvanceSchema,
  AuthorizeAdvanceSchema,
  PayrollRunSchema,
} from "./payrollTypes.js";

export const payrollRouter = Router();

// ==========================================
// 1. EMPLEADOS & COLABORADORES
// ==========================================

payrollRouter.get("/employees", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const result = await payrollService.listEmployees(companyId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.post("/employees", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = EmployeeSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de empleado inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.createEmployee(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.put("/employees/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parse = UpdateEmployeeSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de actualización inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.updateEmployee(id, parse.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.delete("/employees/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await payrollService.toggleEmployeeStatus(id, "INACTIVE");
    res.json({ success: true, data: result, message: "Empleado dado de baja exitosamente" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. PERIODOS DE NÓMINA
// ==========================================

payrollRouter.get("/periods", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const result = await payrollService.listPayrollPeriods(companyId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.post("/periods", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = PayrollPeriodSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de periodo de nómina inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.createPayrollPeriod(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.put("/periods/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parse = UpdatePayrollPeriodSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de actualización inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.updatePayrollPeriod(id, parse.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. ANTICIPOS DE SUELDO & INMUTABILIDAD
// ==========================================

payrollRouter.get("/advances", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const status = req.query.status as string | undefined;
    const periodCode = req.query.periodCode as string | undefined;

    const result = await payrollService.listAdvances(companyId, { employeeId, status, periodCode });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.post("/advances", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = AdvanceSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de anticipo inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.createAdvance(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.put("/advances/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parse = UpdateAdvanceSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de actualización inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.updateAdvance(id, parse.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    // Return 400 with the exact business rule message (Immutability error)
    res.status(400).json({ success: false, error: error.message });
  }
});

payrollRouter.post("/advances/:id/authorize", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parse = AuthorizeAdvanceSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Parámetros de autorización inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.authorizeAdvance(id, parse.data);
    res.json({ success: true, data: result, message: "Anticipo autorizado y desembolsado exitosamente" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.post("/advances/:id/reject", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const reason = req.body?.reason as string | undefined;
    const result = await payrollService.rejectAdvance(id, reason);
    res.json({ success: true, data: result, message: "Anticipo rechazado" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. PRE-NÓMINA & DISPERSIÓN DINÁMICA
// ==========================================

payrollRouter.get("/runs/preview", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const periodCode = (req.query.period as string) || "2026-09-Q1";

    const result = await payrollService.getPayrollPreview(companyId, periodCode);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.post("/runs", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = PayrollRunSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de corrida de nómina inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await payrollService.runPayroll(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

payrollRouter.get("/runs", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const result = await payrollService.listPayrollRuns(companyId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

