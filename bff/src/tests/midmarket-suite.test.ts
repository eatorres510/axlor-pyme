import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../index";

describe("Suite Mid-Market: Ciclo B2B Flexible, Logística y Finanzas Avanzadas", () => {
  let adminToken = "";
  let quoteId = "";

  beforeAll(async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });
    adminToken = loginRes.body.data.token;
  });

  // ==========================================
  // FASE A: CICLO COMERCIAL B2B FLEXIBLE
  // ==========================================
  describe("Fase A: Ciclo Comercial B2B & Listas de Precios", () => {
    it("1. Debe listar las listas de precios (Público, Mayoreo 10%, Distribuidor 20%)", async () => {
      const res = await request(app)
        .get("/api/sales/price-lists")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data.map((p: any) => p.code)).toContain("WHOLESALE");
    });

    it("2. Debe crear una cotización B2B con precio de mayoreo y descuento manual", async () => {
      const res = await request(app)
        .post("/api/sales/quotes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          companyId: 13,
          partnerId: 10,
          partnerName: "Constructora del Bajío S.A.",
          priceListCode: "WHOLESALE",
          items: [
            {
              productId: 1,
              productName: "Agua Mineral 600ml",
              productCode: "7501055512345",
              qty: 50,
              unitPrice: 16.5,
              discountPct: 5,
            },
          ],
          notes: "Cotización especial para obra",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.quoteSeq).toBeDefined();
      expect(res.body.data.status).toBe("DRAFT");

      quoteId = res.body.data.id;
    });

    it("3. Debe convertir la cotización a Pedido B2B en 1-click", async () => {
      const res = await request(app)
        .post(`/api/sales/quotes/${quoteId}/convert-to-order`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderSeq).toBeDefined();
      expect(res.body.data.status).toBe("CONFIRMED");
    });

    it("4. Debe convertir la cotización directamente a Factura", async () => {
      const res = await request(app)
        .post(`/api/sales/quotes/${quoteId}/convert-to-invoice`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoiceSeq).toBeDefined();
    });
  });

  // ==========================================
  // FASE B: LOGÍSTICA, LOTES Y DESPACHOS
  // ==========================================
  describe("Fase B: Logística Avanzada, Lotes y Despachos", () => {
    let deliveryId = "";

    it("5. Debe registrar un lote de producto con fecha de caducidad y semáforo", async () => {
      const futureDate = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const res = await request(app)
        .post("/api/logistics/lots")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          companyId: 13,
          productId: 1,
          productName: "Agua Mineral 600ml",
          lotNumber: "LOTE-2026-X99",
          stockQty: 200,
          expiryDate: futureDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("GOOD");
      expect(res.body.data.daysRemaining).toBeGreaterThan(60);
    });

    it("6. Debe generar una Remisión de Salida (Despacho) con chofer y placas", async () => {
      const res = await request(app)
        .post("/api/logistics/deliveries")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          companyId: 13,
          partnerId: 10,
          partnerName: "Constructora del Bajío S.A.",
          driverName: "Martín Rivas",
          licensePlates: "TRK-9012",
          destinationAddress: "Parque Industrial Nave 8",
          items: [{ productId: 1, productName: "Agua Mineral 600ml", qty: 50 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.deliverySeq).toBeDefined();
      expect(res.body.data.status).toBe("IN_TRANSIT");

      deliveryId = res.body.data.id;
    });

    it("7. Debe marcar la remisión como entregada con acuse", async () => {
      const res = await request(app)
        .post(`/api/logistics/deliveries/${deliveryId}/delivered`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("DELIVERED");
    });

    it("8. Debe registrar un ajuste de inventario por merma con cuenta contable 609.01", async () => {
      const res = await request(app)
        .post("/api/logistics/adjustments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          companyId: 13,
          productId: 1,
          productName: "Agua Mineral 600ml",
          beforeQty: 100,
          countedQty: 95,
          reason: "ROTURA",
          notes: "5 piezas dañadas en tarima",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.difference).toBe(-5);
      expect(res.body.data.accountCode).toBe("609.01");
    });
  });

  // ==========================================
  // FASE C: FINANZAS AVANZADAS & P&L
  // ==========================================
  describe("Fase C: Finanzas Avanzadas & P&L", () => {
    it("9. Debe generar el Estado de Resultados (P&L) con desglose de márgenes", async () => {
      const res = await request(app)
        .get("/api/finance/pnl?companyId=13")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.revenue.totalRevenue).toBeGreaterThan(0);
      expect(res.body.data.grossProfit).toBeDefined();
      expect(res.body.data.netProfit).toBeDefined();
    });

    it("10. Debe generar el reporte de conciliación bancaria con partidas cruzadas", async () => {
      const res = await request(app)
        .get("/api/finance/bank-reconciliation?companyId=13")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.matchedCount).toBeGreaterThanOrEqual(1);
    });

    it("11. Debe aplicar cobranza multi-factura con dispersión de pago", async () => {
      const res = await request(app)
        .post("/api/finance/multi-payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          companyId: 13,
          partnerId: 10,
          totalAmount: 5000,
          paymentMethod: "BANK_TRANSFER",
          allocations: [
            { invoiceId: 1, amount: 2500 },
            { invoiceId: 2, amount: 2500 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalAmountPaid).toBe(5000);
    });
  });
});
