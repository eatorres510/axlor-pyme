import { Request, Response, Router } from "express";
import { onboardingService } from "./onboardingService.js";
import { CompanyOnboardSchema } from "./onboardingTypes.js";

export const onboardingRouter = Router();

/**
 * POST /api/companies/onboard
 * High-speed multi-company onboarding in under 15 seconds.
 */
onboardingRouter.post("/onboard", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = CompanyOnboardSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: "Datos de empresa inválidos",
        details: parseResult.error.flatten(),
      });
      return;
    }

    const result = await onboardingService.onboardCompany(parseResult.data);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error en onboarding de empresa:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error interno al procesar el onboarding",
    });
  }
});

/**
 * GET /api/onboarding/companies or /api/onboarding
 * List all companies.
 */
onboardingRouter.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await onboardingService.listCompanies();
    res.json({
      success: true,
      data: companies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

onboardingRouter.get("/companies", async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await onboardingService.listCompanies();
    res.json({
      success: true,
      data: companies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/companies/:id
 * Get single company details.
 */
onboardingRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "ID inválido" });
      return;
    }
    const company = await onboardingService.getCompany(id);
    if (!company) {
      res.status(404).json({ success: false, error: "Empresa no encontrada" });
      return;
    }
    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/companies/:id/accounts
 * Get Chart of Accounts for the company.
 */
onboardingRouter.get("/:id/accounts", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "ID inválido" });
      return;
    }
    const accounts = await onboardingService.getCompanyAccounts(id);
    res.json({
      success: true,
      data: accounts,
      total: accounts.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
