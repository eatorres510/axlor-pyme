import { describe, it, expect, beforeAll } from "vitest";
import { axelor } from "../services/axelor/axelorClient.js";
import { catalogService } from "../modules/catalog/catalogService.js";
import { treasuryService } from "../modules/treasury/treasuryService.js";
import { onboardingService } from "../modules/onboarding/onboardingService.js";

describe("Fase 2: Catálogos, Familias, Contactos & Tesorería E2E Tests", () => {
  let companyId: number;

  beforeAll(async () => {
    await axelor.authenticate();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const onboardRes = await onboardingService.onboardCompany({
      name: `Empresa Fase 2 PyME ${randomSuffix}`,
      taxId: `F2${randomSuffix}RFC`,
      currencyCode: "MXN",
    });
    companyId = onboardRes.company.id;
  });

  // --- CATÁLOGOS & PRODUCTOS ---
  it("Debe crear una categoría de producto", async () => {
    const randomCode = `CAT${Math.floor(1000 + Math.random() * 9000)}`;
    const category = await catalogService.createCategory({
      name: "Bebidas y Refrescos Test",
      code: randomCode,
    });
    expect(category).toBeDefined();
    expect(category.id).toBeGreaterThan(0);
  });

  it("Debe crear un producto con precios y buscarlo por código de barras para el POS", async () => {
    const randomBarcode = `7501055${Math.floor(100000 + Math.random() * 900000)}`;
    const product = await catalogService.createProduct({
      name: "Agua Mineral Gasificada 600ml",
      code: randomBarcode,
      barCode: randomBarcode,
      salePrice: 18.5,
      costPrice: 9.25,
      minStock: 10,
      maxStock: 100,
      stockManaged: true,
      productTypeSelect: "standard",
      companyId: companyId,
      unit: "PZA",
    });

    expect(product).toBeDefined();
    expect(product.id).toBeGreaterThan(0);
    expect(product.salePrice).toBe(18.5);

    // Instant Barcode Scan Lookup
    const scanned = await catalogService.getProductByBarcode(randomBarcode, companyId);
    expect(scanned).toBeDefined();
    expect(scanned.name).toBe("Agua Mineral Gasificada 600ml");
    expect(scanned.salePrice).toBe(18.5);
  });

  it("Debe listar productos con filtro de búsqueda", async () => {
    const res = await catalogService.listProducts({
      companyId,
      query: "Agua",
    });
    expect(Array.isArray(res.products)).toBe(true);
    expect(res.products.length).toBeGreaterThan(0);
  });

  // --- CONTACTOS (CLIENTES & PROVEEDORES) ---
  it("Debe registrar un cliente mayorista y un proveedor", async () => {
    const client = await catalogService.createPartner({
      name: "Abarrotes y Minisúper Central",
      taxNbr: "AMC900101XYZ",
      isCustomer: true,
      isSupplier: false,
      companyId: companyId,
      phone: "5551234567",
    });
    expect(client.id).toBeGreaterThan(0);
    expect(client.isCustomer).toBe(true);

    const supplier = await catalogService.createPartner({
      name: "Distribuidora Embotelladora Nacional",
      taxNbr: "DEN850505ABC",
      isCustomer: false,
      isSupplier: true,
      companyId: companyId,
      phone: "5559876543",
    });
    expect(supplier.id).toBeGreaterThan(0);
    expect(supplier.isSupplier).toBe(true);

    // List and filter
    const customers = await catalogService.listPartners({ companyId, isCustomer: true });
    expect(customers.partners.length).toBeGreaterThan(0);
  });

  // --- TESORERÍA (CAJAS Y BANCOS SIN IBAN) ---
  it("Debe crear una caja de efectivo y ejecutar un arqueo de turno", async () => {
    const cashRegister = await treasuryService.createCashRegister({
      name: "Caja Mostrador Turno Matutino",
      branchName: "Sucursal Norte",
      companyId: companyId,
    });
    expect(cashRegister.id).toBeGreaterThan(0);

    // Arqueo de caja
    const audit = await treasuryService.auditCashRegister({
      cashRegisterId: cashRegister.id,
      physicalAmount: 4950.0,
      auditorName: "Cajero 01",
      notes: "Cierre de turno matutino",
    });

    expect(audit.cashRegisterId).toBe(cashRegister.id);
    expect(audit.physicalAmount).toBe(4950.0);
    expect(audit.status).toBeDefined();
  });

  it("Debe dar de alta una cuenta bancaria sin validación IBAN", async () => {
    const bankAccount = await treasuryService.createBankAccount({
      bankName: "BBVA Bancomer",
      accountNumber: `0123456789${Math.floor(1000 + Math.random() * 9000)}`,
      currencyCode: "MXN",
      companyId: companyId,
      label: "Cuenta BBVA Pagos Operativos",
    });
    expect(bankAccount.id).toBeGreaterThan(0);

    const accounts = await treasuryService.listBankAccounts(companyId);
    expect(accounts.length).toBeGreaterThan(0);
  });

  it("Debe registrar un traspaso interno de tesorería", async () => {
    const transfer = await treasuryService.createTransfer({
      companyId,
      fromType: "CASH",
      fromId: 1,
      toType: "BANK",
      toId: 1,
      amount: 2500.0,
      notes: "Depósito de efectivo del día en cuenta bancaria",
    });
    expect(transfer.success).toBe(true);
    expect(transfer.amount).toBe(2500.0);
  });
});
