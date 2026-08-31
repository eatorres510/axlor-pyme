import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../index";

describe("Módulo de Autenticación y Aislamiento Multi-Tenant", () => {
  let adminToken = "";
  let cashierToken = "";
  let allowedIds: number[] = [];

  beforeAll(async () => {
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });
    adminToken = adminRes.body.data.token;
    allowedIds = adminRes.body.data.user.allowedCompanyIds;

    const cashierRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "cajero", password: "cajero123" });
    cashierToken = cashierRes.body.data.token;
  });

  it("1. Debe iniciar sesión exitosamente como Tenant Admin con múltiples empresas", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("TENANT_ADMIN");
    expect(res.body.data.user.allowedCompanyIds.length).toBeGreaterThanOrEqual(1);
  });

  it("2. Debe iniciar sesión como Cajero y restringir a una sola empresa asignada", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "cajero", password: "cajero123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("CASHIER");
    expect(res.body.data.user.allowedCompanyIds).toEqual([13]);
  });

  it("3. Debe rechazar login con credenciales incorrectas", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "usuario_fantasma", password: "password_invalido" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("4. Debe consultar el perfil del usuario autenticado vía GET /api/auth/me", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe("admin");
  });

  it("5. Debe rechazar petición GET /api/auth/me sin Bearer token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("6. Admin puede cambiar de empresa activa entre las autorizadas", async () => {
    const targetCompId = allowedIds[0] || 13;
    const res = await request(app)
      .post("/api/auth/switch-company")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ companyId: targetCompId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.activeCompanyId).toBe(targetCompId);
  });

  it("7. Cajero es bloqueado con 403 al intentar cambiar a una empresa no autorizada", async () => {
    const res = await request(app)
      .post("/api/auth/switch-company")
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({ companyId: 9999 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
