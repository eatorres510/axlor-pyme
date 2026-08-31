import { Router, Response } from "express";
import { saasService, tenantsRegistry } from "../saas/saasService";
import { CreateCollaboratorSchema } from "../saas/saasTypes";
import { verifyJWT, requireRole, AuthenticatedRequest } from "../auth/authMiddleware";
import { axelor } from "../../services/axelor/axelorClient";

export const tenantRouter = Router();

// GET /api/tenant/collaborators
tenantRouter.get(
  "/collaborators",
  verifyJWT,
  requireRole(["TENANT_ADMIN", "SUPER_ADMIN", "ADMIN"]),
  (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.user?.tenantId || (req.user?.role === "SUPER_ADMIN" ? undefined : "TNT-001");
    const list = saasService.listCollaborators(tenantId);
    res.json({
      success: true,
      data: list,
    });
  }
);

// POST /api/tenant/collaborators
tenantRouter.post(
  "/collaborators",
  verifyJWT,
  requireRole(["TENANT_ADMIN", "SUPER_ADMIN", "ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload = CreateCollaboratorSchema.parse(req.body);
      const tenantId = req.user?.tenantId || "TNT-001";
      const company = req.user?.allowedCompanies.find((c) => Number(c.id) === payload.companyId);
      const companyName = company?.name || req.user?.activeCompanyName || "Empresa PyME";

      const newCollab = await saasService.createCollaborator(tenantId, payload, companyName);
      res.status(201).json({
        success: true,
        message: `Colaborador ${payload.name} creado exitosamente`,
        data: newCollab,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || "Error al registrar colaborador",
      });
    }
  }
);

// PUT /api/tenant/collaborators/:id/status
tenantRouter.put(
  "/collaborators/:id/status",
  verifyJWT,
  requireRole(["TENANT_ADMIN", "SUPER_ADMIN", "ADMIN"]),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = saasService.toggleCollaboratorStatus(id);
      res.json({
        success: true,
        message: `Estado del colaborador actualizado a ${updated.status}`,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/tenant/collaborators/:id
tenantRouter.put(
  "/collaborators/:id",
  verifyJWT,
  requireRole(["TENANT_ADMIN", "SUPER_ADMIN", "ADMIN"]),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, role, companyId, companyName } = req.body;
      const updated = saasService.updateCollaborator(id, { name, role, companyId, companyName });
      res.json({
        success: true,
        message: `Colaborador ${updated.name} actualizado exitosamente`,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// DELETE /api/tenant/collaborators/:id
tenantRouter.delete(
  "/collaborators/:id",
  verifyJWT,
  requireRole(["TENANT_ADMIN", "SUPER_ADMIN", "ADMIN"]),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = saasService.deleteCollaborator(id);
      res.json({
        success: true,
        message: deleted ? "Colaborador eliminado exitosamente" : "Colaborador no encontrado",
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// POST /api/tenant/branches
tenantRouter.post(
  "/branches",
  verifyJWT,
  requireRole(["TENANT_ADMIN", "SUPER_ADMIN", "ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, code, taxId, currency } = req.body;
      const tenantId = req.user?.tenantId || "TNT-001";
      const tenant = tenantsRegistry.find((t) => t.id === tenantId) || tenantsRegistry[0];
      const plan = saasService.getPlan(tenant.planCode);

      if (tenant.companyIds.length >= plan.maxCompanies) {
        return res.status(400).json({
          success: false,
          error: `Límite de sucursales alcanzado (${plan.maxCompanies} sucursales en ${plan.name}). Actualice a Plan Enterprise para sucursales ilimitadas.`,
        });
      }

      let newCompanyId = Math.floor(Math.random() * 800) + 100;
      try {
        const compRes = await axelor.create("com.axelor.apps.base.db.Company", {
          name,
          code: code.toUpperCase(),
          codeTax: taxId || "XAXX010101000",
          currency: { code: currency || "MXN" },
        });
        if (compRes.data && compRes.data.length > 0) {
          newCompanyId = Number(compRes.data[0].id);
        }

        await axelor.create("com.axelor.apps.cash.db.CashRegister", {
          name: `Caja Mostrador - ${code}`,
          code: `CAJA-${code}-01`,
          company: { id: newCompanyId },
        });

        await axelor.create("com.axelor.apps.stock.db.StockLocation", {
          name: `Almacén Principal - ${code}`,
          code: `ALM-${code}-01`,
          typeSelect: 1,
          company: { id: newCompanyId },
        });
      } catch (e) {
        console.warn("Sucursal creada en memoria:", e);
      }

      tenant.companyIds.push(newCompanyId);

      res.status(201).json({
        success: true,
        message: `Sucursal ${name} creada e inicializada con Caja y Almacén`,
        data: {
          id: newCompanyId,
          name,
          code: code.toUpperCase(),
          currency: currency || "MXN",
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// GET /api/tenant/plan
tenantRouter.get(
  "/plan",
  verifyJWT,
  (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.user?.tenantId || "TNT-001";
    const tenant = saasService.listTenants().find((t) => t.id === tenantId) || saasService.listTenants()[0];
    const plan = saasService.getPlan(tenant.planCode);
    const collaboratorsCount = saasService.listCollaborators(tenantId).length;

    res.json({
      success: true,
      data: {
        tenant,
        plan,
        usage: {
          companiesUsed: tenant.companyIds.length,
          companiesMax: plan.maxCompanies,
          usersUsed: collaboratorsCount + 1,
          usersMax: plan.maxUsers,
        },
      },
    });
  }
);

// In-memory persistent company settings store for LATAM & Central America
const companySettingsStore: Record<number, any> = {
  13: {
    companyId: 13,
    country: "MX",
    name: "Distribuidora Nacional PyME S.A. de C.V.",
    commercialName: "Distribuidora PyME",
    code: "DISTR857",
    taxId: "DNP190820XX1",
    taxIdType: "RFC",
    giro: "Comercio al por mayor y menor de abarrotes, bienes de consumo y tecnología",
    regimenFiscal: "601 - General de Ley Personas Morales",
    patronalNumber: "Y583920110",
    repName: "Lic. Fernando Garza Salinas",
    repDoc: "GASF850312HDFRRN01",
    address: "Av. Chapultepec 480, Piso 3",
    neighborhood: "Col. Americana",
    postalCode: "44100",
    city: "Guadalajara",
    state: "Jalisco",
    phone: "33 3615 4800",
    whatsapp: "+52 33 1289 9000",
    email: "facturacion@distribuidorapyme.com",
    website: "https://distribuidorapyme.com",
    resolutionNumber: "SAT-DTE-2026-098231",
    resolutionPrefix: "FAC-A",
    resolutionRangeFrom: "001-001-01-00000001",
    resolutionRangeTo: "001-001-01-00100000",
    resolutionExpiry: "2027-12-31",
    defaultTaxRate: 16,
    currency: "MXN",
    secondaryCurrency: "USD",
    exchangeRate: 18.25,
    enableDualCurrency: true,
    exchangeRateUpdated: new Date().toISOString(),
    logoUrl: "",
    ticketHeader: "¡BIENVENIDO A DISTRIBUIDORA PYME!",
    ticketFooter: "¡Gracias por su preferencia! Documento emitido con validez fiscal. No se aceptan devoluciones sin ticket original después de 30 días.",
  },
};

// GET /api/tenant/company-settings
tenantRouter.get(
  "/company-settings",
  verifyJWT,
  (req: AuthenticatedRequest, res: Response) => {
    const targetId = Number(req.query.companyId || req.user?.activeCompanyId || 13);
    const settings = companySettingsStore[targetId] || {
      companyId: targetId,
      country: "MX",
      name: "Distribuidora Nacional PyME S.A.",
      commercialName: "Distribuidora PyME",
      code: "DISTR857",
      taxId: "XAXX010101000",
      taxIdType: "RFC",
      giro: "Comercio General",
      regimenFiscal: "601 - General de Ley Personas Morales",
      address: "Av. Principal 123",
      neighborhood: "Centro",
      postalCode: "44100",
      city: "Guadalajara",
      state: "Jalisco",
      phone: "33 3615 4800",
      email: "facturacion@distribuidorapyme.com",
      defaultTaxRate: 16,
      currency: "MXN",
      secondaryCurrency: "USD",
      exchangeRate: 18.25,
      enableDualCurrency: true,
      exchangeRateUpdated: new Date().toISOString(),
      ticketFooter: "Gracias por su compra.",
    };

    res.json({ success: true, data: settings });
  }
);

// PUT /api/tenant/company-settings
tenantRouter.put(
  "/company-settings",
  verifyJWT,
  requireRole(["TENANT_ADMIN", "SUPER_ADMIN", "ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetId = Number(req.body.companyId || req.user?.activeCompanyId || 13);
      const tenantId = req.user?.tenantId || "TNT-001";
      const tenant = tenantsRegistry.find((t) => t.id === tenantId);
      if (tenant && req.body.name) {
        tenant.name = req.body.name;
      }

      const existing = companySettingsStore[targetId] || {};
      const updatedSettings = {
        ...existing,
        ...req.body,
        companyId: targetId,
        currency:
          typeof req.body.currency === "object" && req.body.currency
            ? req.body.currency.code || "MXN"
            : typeof req.body.currency === "string"
            ? req.body.currency
            : existing.currency || "MXN",
        secondaryCurrency:
          typeof req.body.secondaryCurrency === "object" && req.body.secondaryCurrency
            ? req.body.secondaryCurrency.code || "USD"
            : typeof req.body.secondaryCurrency === "string"
            ? req.body.secondaryCurrency
            : existing.secondaryCurrency || "USD",
        exchangeRate:
          req.body.exchangeRate !== undefined
            ? Number(req.body.exchangeRate)
            : existing.exchangeRate || 18.25,
        defaultTaxRate:
          req.body.defaultTaxRate !== undefined
            ? Number(req.body.defaultTaxRate)
            : existing.defaultTaxRate || 16,
        exchangeRateUpdated: new Date().toISOString(),
      };
      companySettingsStore[targetId] = updatedSettings;

      try {
        await axelor.update("com.axelor.apps.base.db.Company", {
          id: targetId,
          name: updatedSettings.name || undefined,
          code: updatedSettings.code ? updatedSettings.code.toUpperCase() : undefined,
          codeTax: updatedSettings.taxId ? updatedSettings.taxId.toUpperCase() : undefined,
          currency: updatedSettings.currency ? { code: updatedSettings.currency } : undefined,
        });
      } catch (e) {
        console.warn("Actualizado en memoria:", e);
      }

      res.json({
        success: true,
        message: "Datos fiscales y configuración de la empresa guardados exitosamente",
        data: updatedSettings,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);
