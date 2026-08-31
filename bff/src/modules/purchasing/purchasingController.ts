import { Request, Response, Router } from "express";
import { purchasingService } from "./purchasingService.js";
import {
  PurchaseOrderSchema,
  ReceivePurchaseSchema,
  SupplierReturnSchema,
  VendorInvoiceSchema,
} from "./purchasingTypes.js";

export const purchasingRouter = Router();

purchasingRouter.get("/orders", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
    const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string, 10) : undefined;
    const statusSelect = req.query.statusSelect ? parseInt(req.query.statusSelect as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await purchasingService.listOrders({ companyId, supplierId, statusSelect, limit, offset });
    res.json({ success: true, data: result.orders, total: result.total });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

purchasingRouter.get("/orders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await purchasingService.getOrder(id);
    if (!order) {
      res.status(404).json({ success: false, error: "Orden de compra no encontrada" });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

purchasingRouter.put("/orders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await purchasingService.updateOrder(id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

purchasingRouter.delete("/orders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await purchasingService.deleteOrder(id);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

purchasingRouter.post("/orders", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = PurchaseOrderSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de orden de compra inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await purchasingService.createOrder(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

purchasingRouter.post("/orders/:id/confirm", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await purchasingService.confirmOrder(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

purchasingRouter.post("/orders/:id/receive", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parse = ReceivePurchaseSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de recepción inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await purchasingService.receiveOrder(id, parse.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

purchasingRouter.post("/orders/:id/return", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parse = SupplierReturnSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de devolución inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await purchasingService.createSupplierReturn(id, parse.data);
    res.json({
      success: true,
      message: `Devolución a proveedor ${result.returnSeq} registrada exitosamente`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/purchasing/receipts (Recepciones de Almacén)
purchasingRouter.get("/receipts", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
    const receipts = purchasingService.listReceipts(companyId);
    res.json({ success: true, data: receipts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/purchasing/invoices (Facturas de Proveedor / CxP)
purchasingRouter.get("/invoices", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
    const invoices = purchasingService.listVendorInvoices(companyId);
    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/purchasing/invoices (Registrar Factura de Proveedor)
purchasingRouter.post("/invoices", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = VendorInvoiceSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de factura de proveedor inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await purchasingService.createVendorInvoice(parse.data);
    res.status(201).json({
      success: true,
      message: `Factura de Proveedor ${result.invoiceSeq} registrada exitosamente`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/purchasing/orders/:id/invoice (Generar Factura de Proveedor desde Orden)
purchasingRouter.post("/orders/:id/invoice", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await purchasingService.generateInvoiceFromOrder(id);
    res.json({
      success: true,
      message: `Factura de Proveedor ${result.invoiceSeq} generada contra Orden de Compra`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
