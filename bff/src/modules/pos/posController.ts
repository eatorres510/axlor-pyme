import { Request, Response, Router } from "express";
import { posService } from "./posService.js";
import { POSCheckoutSchema } from "./posTypes.js";

export const posRouter = Router();

posRouter.post("/checkout", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = POSCheckoutSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de venta POS inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const ticket = await posService.checkout(parse.data);
    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

posRouter.get("/tickets", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
    const tickets = posService.listTickets(companyId);
    res.json({ success: true, data: tickets, total: tickets.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

posRouter.get("/tickets/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const ticket = await posService.getTicket(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: "Ticket de venta no encontrado" });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
