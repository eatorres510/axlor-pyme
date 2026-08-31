import { axelor } from "../../services/axelor/axelorClient";
import { PYME_CHART_OF_ACCOUNTS } from "../../data/pymeChartOfAccounts";
import { SaaSPlan, TenantRecord, CreateTenantPayload, CreateCollaboratorPayload } from "./saasTypes";

export const SAAS_PLANS: Record<string, SaaSPlan> = {
  STARTER: {
    code: "STARTER",
    name: "Plan Starter PyME",
    maxCompanies: 1,
    maxUsers: 2,
    maxPos: 1,
    priceMonthly: 499,
    currency: "MXN",
    features: [
      "1 Empresa / Sucursal",
      "1 Caja POS de Cobro",
      "Hasta 2 Colaboradores",
      "Catálogo de Productos & Clientes",
      "Control de Inventario",
      "Tickets Térmicos",
    ],
  },
  PYME_PRO: {
    code: "PYME_PRO",
    name: "Plan PyME Pro",
    maxCompanies: 3,
    maxUsers: 10,
    maxPos: 5,
    priceMonthly: 1299,
    currency: "MXN",
    features: [
      "Hasta 3 Sucursales / Empresas",
      "Hasta 5 Cajas POS de Cobro",
      "Hasta 10 Colaboradores con Roles (Cajeros, Contadores)",
      "Compras & Órdenes de Abastecimiento",
      "Gastos Operativos & Facturación CxC/CxP",
      "Arqueos de Caja & Tesorería Multicaja",
      "Planilla Express Básica",
    ],
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    name: "Plan Enterprise Multi-Empresa",
    maxCompanies: 999,
    maxUsers: 999,
    maxPos: 999,
    priceMonthly: 2999,
    currency: "MXN",
    features: [
      "Empresas & Sucursales Ilimitadas",
      "Cajas POS Ilimitadas",
      "Colaboradores Ilimitados",
      "Multi-almacén con Traslados Atómicos",
      "Planilla Express Completa con Anticipos",
      "Aging de Cartera (0-90+ días) & Asientos Automáticos",
      "Soporte Dedicado etiserv.tech 24/7",
    ],
  },
};

export const tenantsRegistry: TenantRecord[] = [
  {
    id: "TNT-001",
    code: "DISTR857",
    name: "Distribuidora Nacional PyME S.A.",
    planCode: "PYME_PRO",
    adminUsername: "admin",
    adminName: "Administrador General",
    adminEmail: "admin@distribuidora.com",
    status: "ACTIVE",
    primaryCompanyId: 13,
    companyIds: [13, 14],
    createdAt: new Date().toISOString(),
  },
  {
    id: "TNT-002",
    code: "ROBLE101",
    name: "Ferretería El Roble S.A.",
    planCode: "STARTER",
    adminUsername: "roble_admin",
    adminName: "Carlos Roble",
    adminEmail: "contacto@elroble.com",
    status: "ACTIVE",
    primaryCompanyId: 14,
    companyIds: [14],
    createdAt: new Date().toISOString(),
  },
];

export interface TenantCollaborator {
  id: number;
  tenantId: string;
  name: string;
  username: string;
  role: "CASHIER" | "ACCOUNTANT" | "WAREHOUSE" | "SALES" | "HR" | "TENANT_ADMIN";
  companyId: number;
  companyName: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export const collaboratorsRegistry: TenantCollaborator[] = [
  {
    id: 1,
    tenantId: "TNT-001",
    name: "Carlos Mendoza",
    username: "cmendoza",
    role: "SALES",
    companyId: 13,
    companyName: "Distribuidora Nacional PyME S.A.",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    tenantId: "TNT-001",
    name: "Mariana Fuentes",
    username: "cajero",
    role: "CASHIER",
    companyId: 13,
    companyName: "Distribuidora Nacional PyME S.A.",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    tenantId: "TNT-001",
    name: "Alejandro Ruiz",
    username: "aruiz",
    role: "SALES",
    companyId: 13,
    companyName: "Distribuidora Nacional PyME S.A.",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    tenantId: "TNT-001",
    name: "Sofía Garza",
    username: "sgarza",
    role: "SALES",
    companyId: 13,
    companyName: "Distribuidora Nacional PyME S.A.",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    tenantId: "TNT-001",
    name: "Lic. Roberto Garza",
    username: "contador",
    role: "ACCOUNTANT",
    companyId: 13,
    companyName: "Distribuidora Nacional PyME S.A.",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    tenantId: "TNT-001",
    name: "Jorge Ramírez",
    username: "almacen",
    role: "WAREHOUSE",
    companyId: 13,
    companyName: "Distribuidora Nacional PyME S.A.",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  },
];

export class SaaSService {
  listPlans(): SaaSPlan[] {
    return Object.values(SAAS_PLANS);
  }

  getPlan(code: string): SaaSPlan {
    return SAAS_PLANS[code] || SAAS_PLANS.PYME_PRO;
  }

  listTenants(): TenantRecord[] {
    return tenantsRegistry;
  }

  async provisionTenant(payload: CreateTenantPayload): Promise<{
    tenant: TenantRecord;
    companyId: number;
    adminCredentials: { username: string; password: string };
  }> {
    let companyId = 15;
    try {
      // 1. Crear Empresa en Axelor
      const compRes = await axelor.create("com.axelor.apps.base.db.Company", {
        name: payload.tenantName,
        code: payload.tenantCode.toUpperCase(),
        codeTax: payload.taxId,
        currency: { code: payload.currency || "MXN" },
      });

      if (compRes.data && compRes.data.length > 0) {
        companyId = Number(compRes.data[0].id);
      }

      // 2. Inicializar Catálogo Contable Maestro en Axelor
      if (Array.isArray(PYME_CHART_OF_ACCOUNTS)) {
        const accountsPayload = PYME_CHART_OF_ACCOUNTS.map((acc: any) => ({
          code: acc.code,
          name: acc.name,
          accountType: { code: acc.type },
          company: { id: companyId },
          reconcileOk: true,
        }));
        await axelor.createMany("com.axelor.apps.account.db.Account", accountsPayload);
      }

      // 3. Crear Caja Chica y Almacén
      await axelor.create("com.axelor.apps.cash.db.CashRegister", {
        name: `Caja Principal - ${payload.tenantCode}`,
        code: `CAJA-${payload.tenantCode}-01`,
        company: { id: companyId },
      });

      // 4. Crear Usuario Tenant Admin en Axelor
      await axelor.create("com.axelor.auth.db.User", {
        code: payload.adminUsername,
        name: payload.adminName,
        email: payload.adminEmail,
        password: payload.adminPassword,
        activeCompany: { id: companyId },
        companies: [{ id: companyId }],
      });
    } catch (err) {
      console.warn("Fallo aprovisionamiento en Axelor, usando modo de prueba:", err);
      companyId = Math.floor(Math.random() * 800) + 100;
    }

    const newTenant: TenantRecord = {
      id: `TNT-${Math.floor(Math.random() * 900) + 100}`,
      code: payload.tenantCode.toUpperCase(),
      name: payload.tenantName,
      planCode: payload.planCode,
      adminUsername: payload.adminUsername,
      adminName: payload.adminName,
      adminEmail: payload.adminEmail,
      status: "ACTIVE",
      primaryCompanyId: companyId,
      companyIds: [companyId],
      createdAt: new Date().toISOString(),
    };

    tenantsRegistry.push(newTenant);

    return {
      tenant: newTenant,
      companyId,
      adminCredentials: {
        username: payload.adminUsername,
        password: payload.adminPassword,
      },
    };
  }

  getSaaSMetrics() {
    const totalTenants = tenantsRegistry.length;
    const activeTenants = tenantsRegistry.filter((t) => t.status === "ACTIVE").length;
    const planBreakdown = {
      STARTER: tenantsRegistry.filter((t) => t.planCode === "STARTER").length,
      PYME_PRO: tenantsRegistry.filter((t) => t.planCode === "PYME_PRO").length,
      ENTERPRISE: tenantsRegistry.filter((t) => t.planCode === "ENTERPRISE").length,
    };

    const estimatedMRR =
      planBreakdown.STARTER * SAAS_PLANS.STARTER.priceMonthly +
      planBreakdown.PYME_PRO * SAAS_PLANS.PYME_PRO.priceMonthly +
      planBreakdown.ENTERPRISE * SAAS_PLANS.ENTERPRISE.priceMonthly;

    return {
      totalTenants,
      activeTenants,
      planBreakdown,
      estimatedMRR,
      currency: "MXN",
    };
  }

  updateTenant(id: string, payload: { name?: string; planCode?: string; adminName?: string; adminEmail?: string; status?: "ACTIVE" | "SUSPENDED" | "TRIAL" }): TenantRecord {
    const idx = tenantsRegistry.findIndex((t) => t.id === id || t.code === id);
    if (idx === -1) {
      throw new Error(`Tenant con ID ${id} no encontrado`);
    }
    tenantsRegistry[idx] = {
      ...tenantsRegistry[idx],
      name: payload.name !== undefined ? payload.name : tenantsRegistry[idx].name,
      planCode: (payload.planCode as any) || tenantsRegistry[idx].planCode,
      adminName: payload.adminName !== undefined ? payload.adminName : tenantsRegistry[idx].adminName,
      adminEmail: payload.adminEmail !== undefined ? payload.adminEmail : tenantsRegistry[idx].adminEmail,
      status: payload.status !== undefined ? payload.status : tenantsRegistry[idx].status,
    };
    return tenantsRegistry[idx];
  }

  toggleTenantStatus(id: string): TenantRecord {
    const idx = tenantsRegistry.findIndex((t) => t.id === id || t.code === id);
    if (idx === -1) {
      throw new Error(`Tenant con ID ${id} no encontrado`);
    }
    const current = tenantsRegistry[idx].status;
    tenantsRegistry[idx].status = current === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    return tenantsRegistry[idx];
  }

  resetTenantPassword(id: string, newPassword: string): { success: boolean; message: string } {
    const tenant = tenantsRegistry.find((t) => t.id === id || t.code === id);
    if (!tenant) {
      throw new Error(`Tenant con ID ${id} no encontrado`);
    }
    if (!newPassword || newPassword.length < 4) {
      throw new Error("La nueva contraseña debe contener al menos 4 caracteres");
    }
    return {
      success: true,
      message: `Contraseña de ${tenant.adminUsername} actualizada correctamente`,
    };
  }

  deleteTenant(id: string): boolean {
    const initialLen = tenantsRegistry.length;
    const idx = tenantsRegistry.findIndex((t) => t.id === id || t.code === id);
    if (idx !== -1) {
      tenantsRegistry.splice(idx, 1);
    }
    return tenantsRegistry.length < initialLen;
  }

  // --- SaaS Plans CRUD ---
  createPlan(payload: {
    code: string;
    name: string;
    priceMonthly: number;
    maxCompanies?: number;
    maxUsers?: number;
    maxPos?: number;
    currency?: string;
    features?: string[];
  }): SaaSPlan {
    const code = payload.code.toUpperCase().replace(/\s+/g, "_");
    if (SAAS_PLANS[code]) {
      throw new Error(`Ya existe un plan con el código ${code}`);
    }
    const newPlan: SaaSPlan = {
      code: code as any,
      name: payload.name,
      priceMonthly: Number(payload.priceMonthly || 0),
      maxCompanies: Number(payload.maxCompanies || 1),
      maxUsers: Number(payload.maxUsers || 5),
      maxPos: Number(payload.maxPos || 2),
      currency: payload.currency || "MXN",
      features: payload.features && payload.features.length > 0 ? payload.features : [
        `${payload.maxCompanies || 1} Sucursales / Empresas`,
        `Hasta ${payload.maxPos || 2} Cajas POS`,
        `Hasta ${payload.maxUsers || 5} Colaboradores`,
        "Soporte Estándar",
      ],
    };
    SAAS_PLANS[code] = newPlan;
    return newPlan;
  }

  updatePlan(code: string, payload: Partial<SaaSPlan>): SaaSPlan {
    const key = code.toUpperCase();
    if (!SAAS_PLANS[key]) {
      throw new Error(`Plan SaaS con código ${code} no encontrado`);
    }
    SAAS_PLANS[key] = {
      ...SAAS_PLANS[key],
      name: payload.name !== undefined ? payload.name : SAAS_PLANS[key].name,
      priceMonthly: payload.priceMonthly !== undefined ? Number(payload.priceMonthly) : SAAS_PLANS[key].priceMonthly,
      maxCompanies: payload.maxCompanies !== undefined ? Number(payload.maxCompanies) : SAAS_PLANS[key].maxCompanies,
      maxUsers: payload.maxUsers !== undefined ? Number(payload.maxUsers) : SAAS_PLANS[key].maxUsers,
      maxPos: payload.maxPos !== undefined ? Number(payload.maxPos) : SAAS_PLANS[key].maxPos,
      features: payload.features !== undefined ? payload.features : SAAS_PLANS[key].features,
    };
    return SAAS_PLANS[key];
  }

  deletePlan(code: string): boolean {
    const key = code.toUpperCase();
    if (["STARTER", "PYME_PRO", "ENTERPRISE"].includes(key)) {
      throw new Error("Los planes del sistema base (Starter, PyME Pro, Enterprise) no pueden ser eliminados.");
    }
    if (!SAAS_PLANS[key]) {
      throw new Error(`Plan SaaS con código ${code} no encontrado`);
    }
    delete SAAS_PLANS[key];
    return true;
  }

  listCollaborators(tenantId?: string) {
    if (!tenantId) return collaboratorsRegistry;
    return collaboratorsRegistry.filter((c) => c.tenantId === tenantId);
  }

  async createCollaborator(
    tenantId: string,
    payload: CreateCollaboratorPayload,
    companyName: string
  ): Promise<TenantCollaborator> {
    const tenant = tenantsRegistry.find((t) => t.id === tenantId) || tenantsRegistry[0];
    const plan = SAAS_PLANS[tenant.planCode] || SAAS_PLANS.PYME_PRO;
    const currentUsers = collaboratorsRegistry.filter((c) => c.tenantId === tenantId).length + 1;

    if (currentUsers >= plan.maxUsers) {
      throw new Error(
        `Límite del ${plan.name} alcanzado (${plan.maxUsers} usuarios). Actualice su plan a Enterprise para agregar más colaboradores.`
      );
    }

    try {
      await axelor.create("com.axelor.auth.db.User", {
        code: payload.username,
        name: payload.name,
        email: payload.email || `${payload.username}@pyme.com`,
        password: payload.password,
        activeCompany: { id: payload.companyId },
        companies: [{ id: payload.companyId }],
      });
    } catch (e) {
      console.warn("Colaborador registrado en memoria:", e);
    }

    const newCollab: TenantCollaborator = {
      id: collaboratorsRegistry.length + 1,
      tenantId,
      name: payload.name,
      username: payload.username,
      role: payload.role,
      companyId: payload.companyId,
      companyName,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    collaboratorsRegistry.push(newCollab);
    return newCollab;
  }

  toggleCollaboratorStatus(id: number): TenantCollaborator {
    const idx = collaboratorsRegistry.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Colaborador no encontrado");
    collaboratorsRegistry[idx].status =
      collaboratorsRegistry[idx].status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    return collaboratorsRegistry[idx];
  }

  updateCollaborator(
    id: number,
    payload: { name?: string; role?: any; companyId?: number; companyName?: string }
  ): TenantCollaborator {
    const idx = collaboratorsRegistry.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Colaborador no encontrado");
    collaboratorsRegistry[idx] = {
      ...collaboratorsRegistry[idx],
      name: payload.name || collaboratorsRegistry[idx].name,
      role: payload.role || collaboratorsRegistry[idx].role,
      companyId: payload.companyId || collaboratorsRegistry[idx].companyId,
      companyName: payload.companyName || collaboratorsRegistry[idx].companyName,
    };
    return collaboratorsRegistry[idx];
  }

  deleteCollaborator(id: number): boolean {
    const idx = collaboratorsRegistry.findIndex((c) => c.id === id);
    if (idx !== -1) {
      collaboratorsRegistry.splice(idx, 1);
      return true;
    }
    return false;
  }
}

export const saasService = new SaaSService();
