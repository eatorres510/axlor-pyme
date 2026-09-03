import { Router, Request, Response } from "express";
import { financeService } from "./financeService.js";
import {
  InvoiceListParamsSchema,
  InvoicePaymentSchema,
  CreditNoteSchema,
  QuickPaymentInputSchema,
} from "./financeTypes.js";
import { verifyJWT, tenantGuard, AuthenticatedRequest } from "../auth/authMiddleware.js";

export const financeRouter = Router();

financeRouter.use(verifyJWT);
financeRouter.use(tenantGuard);

// GET /api/finance/invoices
financeRouter.get("/invoices", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = InvoiceListParamsSchema.parse(req.query);
    const companyId = parsed.companyId || req.user?.activeCompanyId || 13;
    const result = await financeService.listInvoices({ ...parsed, companyId });
    res.json({
      success: true,
      data: result.invoices,
      total: result.total,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/finance/invoices/:id
financeRouter.get("/invoices/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const invoice = await financeService.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Factura no encontrada" });
    }
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/invoices/:id/payment
financeRouter.post("/invoices/:id/payment", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const input = InvoicePaymentSchema.parse(req.body);
    const result = await financeService.registerPayment(id, input);
    res.json({
      success: true,
      message: "Pago registrado exitosamente",
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/invoices/:id/credit-note (Emisión de Nota de Crédito / Devolución)
financeRouter.post("/invoices/:id/credit-note", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const input = CreditNoteSchema.parse(req.body);
    const result = await financeService.createCustomerCreditNote(id, input);
    res.json({
      success: true,
      message: `Nota de Crédito ${result.creditNoteSeq} emitida exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/credit-notes (Alias)
financeRouter.post("/credit-notes", async (req: Request, res: Response) => {
  try {
    const invoiceId = req.body.invoiceId || 101;
    const input = CreditNoteSchema.parse(req.body);
    const result = await financeService.createCustomerCreditNote(invoiceId, input);
    res.json({
      success: true,
      message: `Nota de Crédito ${result.creditNoteSeq} emitida exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/invoices/:id/debit-note (Emisión de Nota de Débito)
financeRouter.post("/invoices/:id/debit-note", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await financeService.createCustomerDebitNote(id, req.body);
    res.json({
      success: true,
      message: `Nota de Débito ${result.debitNoteSeq} emitida exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/debit-notes (Alias)
financeRouter.post("/debit-notes", async (req: Request, res: Response) => {
  try {
    const invoiceId = req.body.invoiceId || 101;
    const result = await financeService.createCustomerDebitNote(invoiceId, req.body);
    res.json({
      success: true,
      message: `Nota de Débito ${result.debitNoteSeq} emitida exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/payments (Alias)
financeRouter.post("/payments", async (req: Request, res: Response) => {
  try {
    const invoiceId = req.body.invoiceId || 101;
    const input = InvoicePaymentSchema.parse(req.body);
    const result = await financeService.registerPayment(invoiceId, input);
    res.json({
      success: true,
      message: `Recibo de Cobro ${result.receiptSeq} registrado exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/multi-payments (Cobranza Multi-Factura)
financeRouter.post("/multi-payments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await financeService.registerMultiPayment(req.body);
    res.json({
      success: true,
      message: `Cobro multi-factura aplicado a ${result.invoicesSettled} facturas`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/finance/aging
financeRouter.get("/aging", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string, 10) || req.user?.activeCompanyId || 13;
    const type = (req.query.type as any) === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";
    const report = await financeService.getAgingReport(companyId, type);
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/bank-reconciliation
financeRouter.get("/bank-reconciliation", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string, 10) || req.user?.activeCompanyId || 13;
    const report = await financeService.getBankReconciliation(companyId);
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/bank-reconciliation/match
financeRouter.post("/bank-reconciliation/match", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.body.companyId, 10) || req.user?.activeCompanyId || 13;
    const { itemId, matchedOrigin } = req.body;
    const report = await financeService.matchReconciliationItem(companyId, itemId, matchedOrigin);
    res.json({
      success: true,
      message: "Movimiento conciliado exitosamente",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/bank-reconciliation/unmatch
financeRouter.post("/bank-reconciliation/unmatch", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.body.companyId, 10) || req.user?.activeCompanyId || 13;
    const { itemId } = req.body;
    const report = await financeService.unmatchReconciliationItem(companyId, itemId);
    res.json({
      success: true,
      message: "Conciliación revertida",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/bank-reconciliation/auto-match
financeRouter.post("/bank-reconciliation/auto-match", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.body.companyId, 10) || req.user?.activeCompanyId || 13;
    const report = await financeService.autoMatchReconciliation(companyId);
    res.json({
      success: true,
      message: "Auto-conciliación completada exitosamente",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/bank-reconciliation/adjust
financeRouter.post("/bank-reconciliation/adjust", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.body.companyId, 10) || req.user?.activeCompanyId || 13;
    const { itemId, accountCode, accountName } = req.body;
    const report = await financeService.createReconciliationAdjustment(companyId, itemId, accountCode, accountName);
    res.json({
      success: true,
      message: "Póliza de ajuste creada y movimiento conciliado",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/bank-reconciliation/import
financeRouter.post("/bank-reconciliation/import", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.body.companyId, 10) || req.user?.activeCompanyId || 13;
    const report = await financeService.importStatementItem(companyId, req.body.item);
    res.json({
      success: true,
      message: "Movimiento de extracto agregado",
      data: report,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/finance/pnl (Estado de Resultados por Sucursal)
financeRouter.get("/pnl", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = parseInt(req.query.companyId as string, 10) || req.user?.activeCompanyId || 13;
    const report = await financeService.getIncomeStatement(companyId);
    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/partners/:partnerId/statement (Estado de Cuenta Individual por Socio)
financeRouter.get("/partners/:partnerId/statement", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.partnerId, 10);
    const companyId = parseInt(req.query.companyId as string, 10) || req.user?.activeCompanyId || 13;
    const statement = await financeService.getPartnerStatement(partnerId, companyId);
    res.json({
      success: true,
      data: statement,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/invoices/:id/credit-note
financeRouter.post("/invoices/:id/credit-note", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const result = await financeService.createCustomerCreditNote(invoiceId, req.body);
    res.status(201).json({
      success: true,
      message: `Nota de Crédito ${result.creditNoteSeq} emitida exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/finance/invoices/:id/debit-note
financeRouter.post("/invoices/:id/debit-note", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const result = await financeService.createCustomerDebitNote(invoiceId, req.body);
    res.status(201).json({
      success: true,
      message: `Nota de Débito ${result.debitNoteSeq} emitida exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// =========================================================================
// COBROS (CxC), PAGOS (CxP) RÁPIDOS & RECIBOS INMUTABLES
// =========================================================================

// GET /api/finance/partner/:partnerId/pending-invoices (FIFO Pending Invoices)
financeRouter.get("/partner/:partnerId/pending-invoices", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.partnerId, 10);
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : req.user?.activeCompanyId || 13;
    const partnerType = ((req.query.type as string) || "CUSTOMER") as "CUSTOMER" | "SUPPLIER";

    const result = await financeService.getPartnerPendingInvoices(companyId, partnerId, partnerType);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/quick-payment (Cobro CxC o Pago CxP Multifactura)
financeRouter.post("/quick-payment", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = QuickPaymentInputSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de cobro/pago inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const receipt = await financeService.createQuickPaymentReceipt(parse.data);
    res.status(201).json({
      success: true,
      message: `Recibo ${receipt.receiptSeq} emitido y contabilizado exitosamente`,
      data: receipt,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/finance/receipts (Listado de Recibos de Caja & Egresos)
financeRouter.get("/receipts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : req.user?.activeCompanyId || 13;
    const type = req.query.type as string | undefined;
    const partnerId = req.query.partnerId ? parseInt(req.query.partnerId as string, 10) : undefined;
    const q = req.query.q as string | undefined;

    const receipts = await financeService.listPaymentReceipts(companyId, { type, partnerId, q });
    res.json({ success: true, data: receipts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/receipts/:id (Detalle de Recibo de Caja o Egreso)
financeRouter.get("/receipts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const receipt = await financeService.getPaymentReceipt(req.params.id);
    if (!receipt) {
      res.status(404).json({ success: false, error: "Recibo no encontrado" });
      return;
    }
    res.json({ success: true, data: receipt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/finance/receipts/:id (Bloqueo de Inmutabilidad)
financeRouter.put("/receipts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    await financeService.updatePaymentReceipt(req.params.id, req.body);
  } catch (err: any) {
    // 400 Bad Request with the strict immutability protection message
    res.status(400).json({ success: false, error: err.message });
  }
});

