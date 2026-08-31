import { Request, Response, Router } from "express";
import { treasuryService } from "./treasuryService.js";
import {
  CashRegisterSchema,
  CashAuditSchema,
  BankAccountSchema,
  TreasuryTransferSchema,
  CreateMovementSchema,
} from "./treasuryTypes.js";

export const treasuryRouter = Router();

// ==========================================
// REPORTE CONSOLIDADO & KPIS DE TESORERÍA
// ==========================================

treasuryRouter.get("/report", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const report = await treasuryService.getTreasuryReport(companyId);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// MOVIMIENTOS & LIBRO DIARIO DE CAJA Y BANCOS
// ==========================================

treasuryRouter.get("/movements", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
    const sourceType = req.query.sourceType as "CASH" | "BANK" | "ALL" | undefined;
    const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string, 10) : undefined;
    const type = req.query.type as "INCOME" | "EXPENSE" | "TRANSFER" | "ALL" | undefined;
    const paymentMethod = req.query.paymentMethod as string | undefined;
    const category = req.query.category as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const query = req.query.q as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await treasuryService.listMovements({
      companyId,
      sourceType,
      sourceId,
      type,
      paymentMethod,
      category,
      startDate,
      endDate,
      query,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result.movements,
      total: result.total,
      summary: result.summary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.post("/movements", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = CreateMovementSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de movimiento inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await treasuryService.recordMovement(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.post("/movements/:id/reconcile", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const result = treasuryService.toggleReconcile(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// CAJAS DE EFECTIVO & ARQUEOS DE TURNO
// ==========================================

treasuryRouter.get("/cash-registers", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const registers = await treasuryService.listCashRegisters(companyId);
    res.json({ success: true, data: registers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.post("/cash-registers", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = CashRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de caja inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await treasuryService.createCashRegister(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.post("/cash-registers/:id/audit", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const bodyWithId = { ...req.body, cashRegisterId: id };
    const parse = CashAuditSchema.safeParse(bodyWithId);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de arqueo inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await treasuryService.auditCashRegister(parse.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.get("/cash-registers/:id/cuadre", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await treasuryService.getCashCuadreReport(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// CUENTAS BANCARIAS & CONCILIACIÓN
// ==========================================

treasuryRouter.get("/bank-accounts", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const accounts = await treasuryService.listBankAccounts(companyId);
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.post("/bank-accounts", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = BankAccountSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de cuenta bancaria inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await treasuryService.createBankAccount(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.delete("/bank-accounts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await treasuryService.deleteBankAccount(id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

treasuryRouter.get("/bank-accounts/:id/reconciliation", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await treasuryService.getBankReconciliation(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// TRASPASOS INTERNOS
// ==========================================

treasuryRouter.post("/transfers", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = TreasuryTransferSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de traspaso inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await treasuryService.createTransfer(parse.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
