import { describe, it, expect, beforeAll } from "vitest";
import { axelor } from "../services/axelor/axelorClient.js";
import { onboardingService } from "../modules/onboarding/onboardingService.js";
import { catalogService } from "../modules/catalog/catalogService.js";
import { financeService } from "../modules/finance/financeService.js";
import { dashboardService } from "../modules/dashboard/dashboardService.js";
import { posService } from "../modules/pos/posService.js";

describe("Fase 5: Finanzas, Aging CxC/CxP & Dashboard Ejecutivo E2E Tests", () => {
  let companyId: number;
  let customerId: number;
  let supplierId: number;
  let customerInvoiceId: number;
  let supplierInvoiceId: number;

  beforeAll(async () => {
    await axelor.authenticate();

    // 1. Onboard Company for Phase 5
    const randomSuffix = Math.floor(Math.random() * 10000);
    const onboard = await onboardingService.onboardCompany({
      name: `Empresa Fase 5 PyME ${randomSuffix}`,
      taxId: `F5${randomSuffix}RFC`,
      currencyCode: "MXN",
    });
    companyId = onboard.company.id;

    // 2. Register Customer & Supplier
    const customer = await catalogService.createPartner({
      name: `Comercializadora del Centro ${randomSuffix}`,
      taxNbr: `CDC${randomSuffix}XYZ`,
      isCustomer: true,
      isSupplier: false,
      companyId,
      phone: "5553334455",
    });
    customerId = customer.id;

    const supplier = await catalogService.createPartner({
      name: `Proveedor Industrial de Empaques ${randomSuffix}`,
      taxNbr: `PIE${randomSuffix}ABC`,
      isCustomer: false,
      isSupplier: true,
      companyId,
      phone: "5557778899",
    });
    supplierId = supplier.id;

    // 3. Register Product and perform 1 POS checkout to have sales activity
    const barcode = `750888${Math.floor(100000 + Math.random() * 900000)}`;
    const product = await catalogService.createProduct({
      name: "Caja de Cartón Reforzada",
      code: barcode,
      barCode: barcode,
      salePrice: 50.0,
      costPrice: 22.0,
      stockManaged: true,
      productTypeSelect: "standard",
      companyId,
    });

    await posService.checkout({
      companyId,
      customerId,
      items: [
        {
          productId: product.id,
          productName: "Caja de Cartón Reforzada",
          qty: 2,
          unitPrice: 50.0,
        },
      ],
      payment: {
        method: "CASH",
        amountPaid: 150.0,
      },
    });
  });

  // --- 1. CUENTAS POR COBRAR (CxC) & AGING ---
  it("Debe crear una factura de venta a crédito (CxC) y clasificarla en Aging 0-30 días", async () => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 15);

    const invoice = await financeService.createInvoice({
      companyId,
      partnerId: customerId,
      type: "CUSTOMER",
      dueDate: dueDate.toISOString().slice(0, 10),
      subtotal: 10344.83,
      taxAmount: 1655.17,
      notes: "Venta a crédito 15 días plazo",
    });

    expect(invoice).toBeDefined();
    expect(invoice.id).toBeGreaterThan(0);
    expect(invoice.inTaxTotal).toBe(12000.0);
    expect(invoice.amountRemaining).toBe(12000.0);
    customerInvoiceId = invoice.id;

    // Verify in Aging Receivables
    const aging = await financeService.getAgingReport(companyId, "CUSTOMER");
    expect(aging.summary.total).toBeGreaterThanOrEqual(12000.0);
    expect(aging.summary.current).toBeGreaterThanOrEqual(12000.0);
    expect(aging.invoices.length).toBeGreaterThan(0);
  });

  it("Debe registrar un cobro parcial a cliente y actualizar saldo remanente y asiento contable", async () => {
    const payment = await financeService.registerPayment(customerInvoiceId, {
      amount: 4000.0,
      paymentMethod: "CASH",
      notes: "Primer abono en efectivo",
    });

    expect(payment.success).toBe(true);
    expect(payment.amountPaid).toBe(4000.0);
    expect(payment.totalPaid).toBe(4000.0);
    expect(payment.amountRemaining).toBe(8000.0);
    expect(payment.status).toBe("PARTIALLY_PAID");
    expect(payment.moveId).toBeGreaterThan(0);

    // Aging should reflect reduced remaining amount
    const aging = await financeService.getAgingReport(companyId, "CUSTOMER");
    const invItem = aging.invoices.find((i) => i.invoiceId === customerInvoiceId);
    expect(invItem?.amountRemaining).toBe(8000.0);
  });

  // --- 2. CUENTAS POR PAGAR (CxP) & AGING ---
  it("Debe crear una factura de proveedor vencida (CxP) y clasificarla en Aging 31-60 días", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 45); // 45 days ago

    const invoice = await financeService.createInvoice({
      companyId,
      partnerId: supplierId,
      type: "SUPPLIER",
      dueDate: pastDate.toISOString().slice(0, 10),
      subtotal: 7758.62,
      taxAmount: 1241.38,
      notes: "Compra de materia prima",
    });

    expect(invoice).toBeDefined();
    expect(invoice.id).toBeGreaterThan(0);
    expect(invoice.inTaxTotal).toBe(9000.0);
    supplierInvoiceId = invoice.id;

    // Verify in Aging Payables
    const aging = await financeService.getAgingReport(companyId, "SUPPLIER");
    expect(aging.summary.total).toBeGreaterThanOrEqual(9000.0);
    expect(aging.summary.days31to60).toBeGreaterThanOrEqual(9000.0);
  });

  it("Debe registrar el pago total de la factura de proveedor y marcarla como pagada", async () => {
    const payment = await financeService.registerPayment(supplierInvoiceId, {
      amount: 9000.0,
      paymentMethod: "BANK",
      notes: "Liquidación total vía transferencia SPEI",
    });

    expect(payment.success).toBe(true);
    expect(payment.totalPaid).toBe(9000.0);
    expect(payment.amountRemaining).toBe(0.0);
    expect(payment.status).toBe("PAID");

    // Aging payables should now be 0 for this invoice
    const aging = await financeService.getAgingReport(companyId, "SUPPLIER");
    const invItem = aging.invoices.find((i) => i.invoiceId === supplierInvoiceId);
    expect(invItem).toBeUndefined(); // Paid invoices are excluded from aging
  });

  // --- 3. DASHBOARD EJECUTIVO & KPIS ---
  it("Debe consultar los KPIs ejecutivos consolidados en tiempo real", async () => {
    const kpis = await dashboardService.getExecutiveKPIs(companyId);

    expect(kpis).toBeDefined();
    expect(kpis.companyId).toBe(companyId);
    expect(kpis.todaySales).toBeGreaterThan(0);
    expect(kpis.todayTransactions).toBeGreaterThanOrEqual(1);
    expect(kpis.averageTicket).toBeGreaterThan(0);
    expect(kpis.totalAccountsReceivable).toBeGreaterThanOrEqual(8000.0);
    expect(kpis.totalAccountsPayable).toBe(0.0); // Liquidated in previous test
    expect(Array.isArray(kpis.topProducts)).toBe(true);
  });

  it("Debe consultar la tendencia de ventas de los últimos 7 días", async () => {
    const trend = await dashboardService.getSalesTrend(companyId, 7);

    expect(Array.isArray(trend)).toBe(true);
    expect(trend.length).toBe(7);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMetric = trend.find((t) => t.date === todayStr);
    expect(todayMetric).toBeDefined();
    expect(todayMetric?.sales).toBeGreaterThan(0);
  });
});
