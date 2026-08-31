import { Request, Response, Router } from "express";
import { expensesService } from "./expensesService.js";
import { ExpenseSchema, ExpenseCategory } from "./expensesTypes.js";

export const expensesRouter = Router();

expensesRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const category = req.query.category as ExpenseCategory | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await expensesService.listExpenses({ companyId, category, limit, offset });
    res.json({ success: true, data: result.expenses, total: result.total });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

expensesRouter.get("/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : 13;
    const result = await expensesService.getExpenseSummary(companyId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

expensesRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = ExpenseSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: "Datos de gasto inválidos",
        details: parse.error.flatten(),
      });
      return;
    }
    const result = await expensesService.createExpense(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
