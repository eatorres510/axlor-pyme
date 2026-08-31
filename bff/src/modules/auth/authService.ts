import jwt from "jsonwebtoken";
import { axelor } from "../../services/axelor/axelorClient";
import { AuthUserToken, LoginPayload, RegisterUserPayload } from "./authTypes";
import { tenantsRegistry, collaboratorsRegistry } from "../saas/saasService";

const JWT_SECRET = process.env.JWT_SECRET || "axelor-pyme-erp-secret-key-2026";
const JWT_EXPIRES_IN = "24h";

export class AuthService {
  async login(payload: LoginPayload): Promise<{ token: string; user: AuthUserToken }> {
    const { username, password } = payload;

    // Obtener catálogo de empresas desde Axelor
    let companies: Array<{ id: number; name: string; code: string }> = [];
    try {
      const compRes = await axelor.search("com.axelor.apps.base.db.Company", {
        fields: ["id", "name", "code"],
        limit: 20,
      });
      if (compRes.data && Array.isArray(compRes.data) && compRes.data.length > 0) {
        companies = compRes.data.map((c: any) => ({
          id: Number(c.id),
          name: c.name || "Empresa PyME",
          code: c.code || `EMP-${c.id}`,
        }));
      }
    } catch (e) {
      console.warn("No se pudieron cargar empresas de Axelor, usando fallback:", e);
    }

    if (companies.length === 0) {
      companies = [
        { id: 13, name: "Distribuidora Nacional PyME S.A.", code: "DISTR857" },
        { id: 14, name: "Ferretería El Roble S.A.", code: "ROBLE101" },
      ];
    }

    let userToken: AuthUserToken;

    // 1. Super Admin (Platform Master)
    if (username === "superadmin" && (password === "superadmin" || password === "superadmin123")) {
      userToken = {
        userId: 0,
        username: "superadmin",
        name: "Super Admin (Platform Master)",
        email: "superadmin@etiserv.tech",
        role: "SUPER_ADMIN",
        planCode: "ENTERPRISE",
        activeCompanyId: companies[0].id,
        activeCompanyName: companies[0].name,
        allowedCompanies: companies,
        allowedCompanyIds: companies.map((c) => Number(c.id)),
      };
    }
    // 2. Tenant Admin (PyME Owner - Distribuidora Nacional)
    else if (username === "admin" && (password === "admin" || password === "admin123")) {
      const tenant = tenantsRegistry.find((t) => t.id === "TNT-001") || tenantsRegistry[0];
      const tenantCompanies = companies.filter((c) => tenant.companyIds.includes(Number(c.id)));
      const activeComp = tenantCompanies[0] || companies[0];

      userToken = {
        userId: 1,
        username: "admin",
        name: "Lic. Fernando Garza (Tenant Admin)",
        email: "admin@distribuidora.com",
        role: "TENANT_ADMIN",
        tenantId: tenant.id,
        planCode: tenant.planCode,
        activeCompanyId: Number(activeComp.id),
        activeCompanyName: activeComp.name,
        allowedCompanies: tenantCompanies.length > 0 ? tenantCompanies : [activeComp],
        allowedCompanyIds: tenantCompanies.length > 0 ? tenantCompanies.map((c) => Number(c.id)) : [Number(activeComp.id)],
      };
    }
    // 3. Cajero POS
    else if (username === "cajero" && password === "cajero123") {
      const cashierComp = companies.find((c) => Number(c.id) === 13) || companies[0];
      userToken = {
        userId: 2,
        username: "cajero",
        name: "Mariana Valenzuela (Cajero 01)",
        email: "caja01@distribuidora.com",
        role: "CASHIER",
        tenantId: "TNT-001",
        planCode: "PYME_PRO",
        activeCompanyId: Number(cashierComp.id),
        activeCompanyName: cashierComp.name,
        allowedCompanies: [cashierComp],
        allowedCompanyIds: [Number(cashierComp.id)],
      };
    }
    // 4. Contador
    else if (username === "contador" && password === "contador123") {
      const contComp = companies.find((c) => Number(c.id) === 13) || companies[0];
      userToken = {
        userId: 3,
        username: "contador",
        name: "Lic. Roberto Garza (Contador)",
        email: "contabilidad@distribuidora.com",
        role: "ACCOUNTANT",
        tenantId: "TNT-001",
        planCode: "PYME_PRO",
        activeCompanyId: Number(contComp.id),
        activeCompanyName: contComp.name,
        allowedCompanies: [contComp],
        allowedCompanyIds: [Number(contComp.id)],
      };
    }
    // 5. Almacén
    else if (username === "almacen" && password === "almacen123") {
      const almComp = companies.find((c) => Number(c.id) === 13) || companies[0];
      userToken = {
        userId: 4,
        username: "almacen",
        name: "Jorge Ramírez (Almacén)",
        email: "almacen@distribuidora.com",
        role: "WAREHOUSE",
        tenantId: "TNT-001",
        planCode: "PYME_PRO",
        activeCompanyId: Number(almComp.id),
        activeCompanyName: almComp.name,
        allowedCompanies: [almComp],
        allowedCompanyIds: [Number(almComp.id)],
      };
    }
    // 6. Verificar en registro dinámico de Tenants aprovisionados
    else {
      const dynamicTenant = tenantsRegistry.find((t) => t.adminUsername === username);
      if (dynamicTenant && password === "admin123") {
        const tenantCompanies = companies.filter((c) => dynamicTenant.companyIds.includes(Number(c.id)));
        const activeComp = tenantCompanies[0] || companies[0];

        userToken = {
          userId: Math.floor(Math.random() * 800) + 10,
          username: dynamicTenant.adminUsername,
          name: dynamicTenant.adminName,
          email: dynamicTenant.adminEmail,
          role: "TENANT_ADMIN",
          tenantId: dynamicTenant.id,
          planCode: dynamicTenant.planCode,
          activeCompanyId: Number(activeComp.id),
          activeCompanyName: activeComp.name,
          allowedCompanies: tenantCompanies.length > 0 ? tenantCompanies : [activeComp],
          allowedCompanyIds: tenantCompanies.length > 0 ? tenantCompanies.map((c) => Number(c.id)) : [Number(activeComp.id)],
        };
      } else {
        // Verificar en registro dinámico de Colaboradores
        const dynamicCollab = collaboratorsRegistry.find((c) => c.username === username);
        if (dynamicCollab && password === "123456") {
          const comp = companies.find((c) => Number(c.id) === dynamicCollab.companyId) || companies[0];
          userToken = {
            userId: dynamicCollab.id,
            username: dynamicCollab.username,
            name: dynamicCollab.name,
            email: `${dynamicCollab.username}@pyme.com`,
            role: dynamicCollab.role,
            tenantId: dynamicCollab.tenantId,
            activeCompanyId: Number(comp.id),
            activeCompanyName: comp.name,
            allowedCompanies: [comp],
            allowedCompanyIds: [Number(comp.id)],
          };
        } else {
          throw new Error("Usuario o contraseña incorrectos");
        }
      }
    }

    const token = jwt.sign(userToken, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { token, user: userToken };
  }

  async switchCompany(currentUser: AuthUserToken, newCompanyId: number): Promise<{ token: string; user: AuthUserToken }> {
    const targetId = Number(newCompanyId);

    // Super Admin puede alternar a cualquier empresa
    if (currentUser.role !== "SUPER_ADMIN") {
      const isAllowed = currentUser.allowedCompanyIds.some((id) => Number(id) === targetId);
      if (!isAllowed) {
        throw new Error(`Acceso denegado: El usuario no tiene permisos sobre la empresa ID ${targetId}`);
      }
    }

    const targetCompany = currentUser.allowedCompanies.find((c) => Number(c.id) === targetId);
    const targetName = targetCompany ? targetCompany.name : `Empresa #${targetId}`;

    const { exp, iat, ...baseUser } = currentUser as any;

    const updatedUser: AuthUserToken = {
      ...baseUser,
      activeCompanyId: targetId,
      activeCompanyName: targetName,
    };

    const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { token, user: updatedUser };
  }

  async registerUser(payload: RegisterUserPayload) {
    const res = await axelor.create("com.axelor.auth.db.User", {
      code: payload.username,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      activeCompany: { id: payload.companyId },
      companies: (payload.allowedCompanyIds || [payload.companyId]).map((id) => ({ id })),
    });

    return res.data?.[0];
  }
}

export const authService = new AuthService();
