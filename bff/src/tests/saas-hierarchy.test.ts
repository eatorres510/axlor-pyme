import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../index";

describe("Módulo SaaS Jerarquía de 2 Niveles (Super Admin & Tenant Admin)", () => {
  let superAdminToken = "";
  let tenantAdminToken = "";
  let provisionedTenantAdminUsername = "";

  beforeAll(async () => {
    // 1. Iniciar sesión como Super Admin
    const saRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "superadmin", password: "superadmin123" });
    superAdminToken = saRes.body.data.token;

    // 2. Iniciar sesión como Tenant Admin
    const taRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });
    tenantAdminToken = taRes.body.data.token;
  });

  it("1. Super Admin debe autenticarse con rol SUPER_ADMIN y bypass global", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("SUPER_ADMIN");
  });

  it("2. Debe listar el catálogo de Planes SaaS (Starter, PyME Pro, Enterprise)", async () => {
    const res = await request(app).get("/api/saas/plans");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data.map((p: any) => p.code)).toContain("PYME_PRO");
  });

  it("3. Super Admin puede consultar el directorio global de Tenants y métricas", async () => {
    const resTenants = await request(app)
      .get("/api/saas/tenants")
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(resTenants.status).toBe(200);
    expect(resTenants.body.data.length).toBeGreaterThanOrEqual(1);

    const resMetrics = await request(app)
      .get("/api/saas/metrics")
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(resMetrics.status).toBe(200);
    expect(resMetrics.body.data.totalTenants).toBeGreaterThanOrEqual(1);
  });

  it("4. Super Admin puede aprovisionar un nuevo Tenant con Plan PyME Pro", async () => {
    const uniqueSuffix = Math.floor(Math.random() * 8999) + 1000;
    provisionedTenantAdminUsername = `owner_${uniqueSuffix}`;

    const res = await request(app)
      .post("/api/saas/tenants")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        tenantName: `AutoPartes del Norte ${uniqueSuffix} S.A.`,
        tenantCode: `APN${uniqueSuffix}`,
        planCode: "PYME_PRO",
        taxId: `APN${uniqueSuffix}0101`,
        adminName: "Ing. Alejandro Morales",
        adminUsername: provisionedTenantAdminUsername,
        adminEmail: `contacto_${uniqueSuffix}@autopartes.com`,
        adminPassword: "admin123",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tenant.planCode).toBe("PYME_PRO");
    expect(res.body.data.adminCredentials.username).toBe(provisionedTenantAdminUsername);
  });

  it("5. El nuevo Tenant Admin aprovisionado puede iniciar sesión y operar", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: provisionedTenantAdminUsername, password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("TENANT_ADMIN");
    expect(res.body.data.user.planCode).toBe("PYME_PRO");
  });

  it("6. Tenant Admin puede dar de alta colaboradores (Cajeros) en su empresa", async () => {
    const res = await request(app)
      .post("/api/tenant/collaborators")
      .set("Authorization", `Bearer ${tenantAdminToken}`)
      .send({
        name: "Valeria Gómez",
        username: `cajera_${Math.floor(Math.random() * 899) + 100}`,
        password: "123456",
        role: "CASHIER",
        companyId: 13,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("CASHIER");
  });

  it("7. Tenant Admin puede consultar el estado de uso de su Plan", async () => {
    const res = await request(app)
      .get("/api/tenant/plan")
      .set("Authorization", `Bearer ${tenantAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.plan.code).toBe("PYME_PRO");
    expect(res.body.data.usage.usersUsed).toBeGreaterThanOrEqual(1);
    expect(res.body.data.usage.usersMax).toBe(10);
  });

  it("8. Tenant Admin es bloqueado con 403 si intenta acceder al panel de Super Admin", async () => {
    const res = await request(app)
      .get("/api/saas/tenants")
      .set("Authorization", `Bearer ${tenantAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
