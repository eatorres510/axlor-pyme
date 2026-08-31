import { Request, Response, Router } from "express";
import { payrollService } from "./payrollService.js";
import { EmployeeSchema, AdvanceSchema, PayrollRunSchema } from "./payrollTypes.js";

export const payrollRouter = Router();

// --- Empleados ---
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

// --- Anticipos ---
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

payrollRouter.get("/advances", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const result = await payrollService.listAdvances(companyId, employeeId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Planilla Express / Dispersión ---
payrollRouter.post("/runs", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = PayrollRunSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de nómina inválidos",
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
