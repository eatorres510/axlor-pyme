import { Router, Response } from "express";
import { salesService } from "./salesService.js";
import { CreateQuoteSchema, CreateB2BOrderSchema } from "./salesTypes.js";
import { verifyJWT, tenantGuard, AuthenticatedRequest } from "../auth/authMiddleware.js";

export const salesRouter = Router();

salesRouter.use(verifyJWT);
salesRouter.use(tenantGuard);

// GET /api/sales/price-lists
salesRouter.get("/price-lists", async (_req, res: Response): Promise<void> => {
  try {
    const list = await salesService.listPriceLists();
    res.json({
      success: true,
      data: list,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/price-lists
salesRouter.post("/price-lists", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await salesService.createPriceList(req.body);
    res.status(201).json({
      success: true,
      message: `Lista de precios ${result.code} creada exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/sales/price-lists/:code
salesRouter.put("/price-lists/:code", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await salesService.updatePriceList(req.params.code, req.body);
    res.json({
      success: true,
      message: `Lista de precios ${result.code} actualizada`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/sales/price-lists/:code
salesRouter.delete("/price-lists/:code", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const success = await salesService.deletePriceList(req.params.code);
    res.json({
      success,
      message: success ? "Lista de precios eliminada" : "No encontrada",
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/sales/quotes
salesRouter.get("/quotes", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = Number(req.query.companyId || req.user?.activeCompanyId || 13);
    const quotes = await salesService.listQuotes(companyId);
    res.json({
      success: true,
      data: quotes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/quotes
salesRouter.post("/quotes", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const payload = CreateQuoteSchema.parse(req.body);
    const result = await salesService.createQuote(payload);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `total;dur=${duration}`);
    res.status(201).json({
      success: true,
      message: `Cotización ${result.quoteSeq} creada exitosamente`,
      data: result,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al crear cotización" });
  }
});

// GET /api/sales/quotes/:id
salesRouter.get("/quotes/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const quote = await salesService.getQuote(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, error: "Cotización no encontrada" });
      return;
    }
    res.json({ success: true, data: quote });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/sales/quotes/:id
salesRouter.put("/quotes/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await salesService.updateQuote(req.params.id, req.body);
    res.json({
      success: true,
      message: `Cotización ${result.quoteSeq} actualizada exitosamente`,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/sales/quotes/:id
salesRouter.delete("/quotes/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const success = await salesService.deleteQuote(req.params.id);
    res.json({ success, message: "Cotización en borrador eliminada exitosamente" });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/sales/orders
salesRouter.get("/orders", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = Number(req.query.companyId || req.user?.activeCompanyId || 13);
    const orders = await salesService.listOrders(companyId);
    res.json({
      success: true,
      data: orders,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sales/orders/:id
salesRouter.get("/orders/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const order = await salesService.getOrder(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, error: "Pedido B2B no encontrado" });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sales/orders
salesRouter.post("/orders", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const payload = CreateB2BOrderSchema.parse(req.body);
    const result = await salesService.createOrder(payload);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `total;dur=${duration}`);
    res.status(201).json({
      success: true,
      message: `Pedido B2B ${result.orderSeq} creado exitosamente`,
      data: result,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al crear pedido B2B" });
  }
});

// POST /api/sales/quotes/:id/convert-to-order
salesRouter.post("/quotes/:id/convert-to-order", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const result = await salesService.convertToOrder(req.params.id);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `total;dur=${duration}`);
    res.json({
      success: true,
      message: `Cotización convertida a Pedido B2B ${result.orderSeq}`,
      data: result,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al convertir cotización" });
  }
});

// POST /api/sales/quotes/:id/convert-to-invoice
salesRouter.post("/quotes/:id/convert-to-invoice", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const result = await salesService.convertToInvoice(req.params.id);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `axelor;dur=${duration}, total;dur=${duration}`);
    res.json({
      success: true,
      message: `Factura ${result.invoiceSeq} generada desde cotización`,
      data: result,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al facturar cotización" });
  }
});

// POST /api/sales/orders/:id/convert-to-invoice
salesRouter.post("/orders/:id/convert-to-invoice", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const result = await salesService.convertOrderToInvoice(req.params.id);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `axelor;dur=${duration}, total;dur=${duration}`);
    res.json({
      success: true,
      message: `Factura ${result.invoiceSeq} generada desde pedido ${result.orderSeq}`,
      data: result,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al facturar pedido" });
  }
});

// GET /api/sales/invoices
salesRouter.get("/invoices", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : req.user?.activeCompanyId || 13;
    const invoices = await salesService.listInvoices(companyId);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `total;dur=${duration}`);
    res.json({
      success: true,
      data: invoices,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Error al consultar facturas" });
  }
});

// GET /api/sales/invoices/:id
salesRouter.get("/invoices/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const invoice = await salesService.getInvoice(req.params.id);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `total;dur=${duration}`);
    if (!invoice) {
      res.status(404).json({ success: false, error: "Factura no encontrada" });
      return;
    }
    res.json({
      success: true,
      data: invoice,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Error al obtener factura" });
  }
});

// POST /api/sales/direct-invoice (Factura Rápida B2B)
salesRouter.post("/direct-invoice", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const start = performance.now();
  try {
    const payload = {
      ...req.body,
      companyId: req.body.companyId || req.user?.activeCompanyId || 13,
    };
    const result = await salesService.createDirectInvoice(payload);
    const duration = Math.round(performance.now() - start);
    res.set("Server-Timing", `axelor;dur=${duration}, total;dur=${duration}`);
    res.json({
      success: true,
      message: `Factura Rápida ${result.invoiceSeq} y Pedido ${result.orderSeq} generados con éxito`,
      data: result,
      executionTimeMs: duration,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Error al emitir factura rápida B2B" });
  }
});
