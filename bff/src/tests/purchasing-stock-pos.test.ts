import { describe, it, expect, beforeAll } from "vitest";
import { axelor } from "../services/axelor/axelorClient.js";
import { onboardingService } from "../modules/onboarding/onboardingService.js";
import { catalogService } from "../modules/catalog/catalogService.js";
import { purchasingService } from "../modules/purchasing/purchasingService.js";
import { stockService } from "../modules/stock/stockService.js";
import { posService } from "../modules/pos/posService.js";

describe("Fase 3: Compras, Almacén, Traslados y POS con Descarga Atómica E2E Tests", () => {
  let companyId: number;
  let supplierId: number;
  let productId: number;
  let mainWarehouseId: number;
  let secondaryWarehouseId: number;
  let purchaseOrderId: number;
  let saleOrderId: number;

  beforeAll(async () => {
    await axelor.authenticate();

    // 1. Onboard Company
    const randomSuffix = Math.floor(Math.random() * 10000);
    const onboard = await onboardingService.onboardCompany({
      name: `Empresa Fase 3 PyME ${randomSuffix}`,
      taxId: `F3${randomSuffix}RFC`,
      currencyCode: "MXN",
    });
    companyId = onboard.company.id;
    mainWarehouseId = onboard.warehouse.id;

    // 2. Register Supplier
    const supplier = await catalogService.createPartner({
      name: `Distribuidora Mayorista Dulces ${randomSuffix}`,
      taxNbr: `DMD${randomSuffix}ABC`,
      isCustomer: false,
      isSupplier: true,
      companyId: companyId,
      phone: "5551112233",
    });
    supplierId = supplier.id;

    // 3. Register Product
    const barcode = `750999${Math.floor(100000 + Math.random() * 900000)}`;
    const product = await catalogService.createProduct({
      name: "Galletas de Chocolate 100g",
      code: barcode,
      barCode: barcode,
      salePrice: 25.0,
      costPrice: 12.0,
      minStock: 10,
      maxStock: 200,
      stockManaged: true,
      productTypeSelect: "standard",
      companyId: companyId,
    });
    productId = product.id;
  });

  // --- 1. COMPRAS A PROVEEDORES ---
  it("Debe crear una orden de compra en estado borrador con líneas de producto", async () => {
    const order = await purchasingService.createOrder({
      supplierId,
      companyId,
      items: [
        {
          productId,
          productName: "Galletas de Chocolate 100g",
          qty: 100,
          unitPrice: 11.5,
        },
      ],
      notes: "Pedido inicial de apertura de tienda",
    });

    expect(order).toBeDefined();
    expect(order.id).toBeGreaterThan(0);
    expect(order.statusSelect).toBe(1); // Draft
    purchaseOrderId = order.id;
  });

  it("Debe confirmar la orden de compra", async () => {
    const confirmed = await purchasingService.confirmOrder(purchaseOrderId);
    expect(confirmed).toBeDefined();
    expect(confirmed.statusSelect).toBe(2); // Confirmed
  });

  // --- 2. RECEPCIÓN EN ALMACÉN ---
  it("Debe recibir la mercancía en el almacén principal e incrementar existencias", async () => {
    const reception = await purchasingService.receiveOrder(purchaseOrderId, {
      warehouseId: mainWarehouseId,
    });

    expect(reception.success).toBe(true);
    expect(reception.stockMoveId).toBeGreaterThan(0);
    expect(reception.receivedItems).toBe(1);

    // Verify product cost update
    const updatedProd = await catalogService.getProduct(productId);
    expect(updatedProd.costPrice).toBe(11.5);
  });

  // --- 3. NIVELES DE EXISTENCIAS & ALERTAS ---
  it("Debe consultar existencias y calcular 100 piezas disponibles en inventario", async () => {
    const stock = await stockService.getStockLevels({ companyId });
    expect(stock.items.length).toBeGreaterThan(0);

    const prodStock = stock.items.find((i) => i.productId === productId);
    expect(prodStock).toBeDefined();
    expect(prodStock?.currentStock).toBe(100);
    expect(prodStock?.isLowStock).toBe(false);
  });

  // --- 4. TRASLADOS ENTRE ALMACENES ---
  it("Debe crear un almacén secundario y realizar un traslado interno de mercancía", async () => {
    // Create secondary location
    const secWarehouse = await stockService.createLocation({
      name: "Bodega Sucursal Norte",
      companyId,
    });
    expect(secWarehouse.id).toBeGreaterThan(0);
    secondaryWarehouseId = secWarehouse.id;

    // Transfer 30 units
    const transfer = await stockService.transferStock({
      companyId,
      fromWarehouseId: mainWarehouseId,
      toWarehouseId: secondaryWarehouseId,
      items: [
        {
          productId,
          productName: "Galletas de Chocolate 100g",
          qty: 30,
          unitPrice: 11.5,
        },
      ],
      notes: "Suministro semanal para sucursal Norte",
    });

    expect(transfer.success).toBe(true);
    expect(transfer.stockMoveId).toBeGreaterThan(0);
  });

  // --- 5. CHECKOUT POS CON DESCARGA ATÓMICA ---
  it("Debe realizar checkout POS en 1 paso: Venta + Descarga Atómica de Stock + Ticket de Caja", async () => {
    const checkoutRes = await posService.checkout({
      companyId,
      warehouseId: mainWarehouseId,
      items: [
        {
          productId,
          productName: "Galletas de Chocolate 100g",
          qty: 4,
          unitPrice: 25.0,
        },
      ],
      payment: {
        method: "CASH",
        amountPaid: 200.0,
      },
    });

    expect(checkoutRes).toBeDefined();
    expect(checkoutRes.folio).toMatch(/^TKT-\d{6}$/);
    expect(checkoutRes.subtotal).toBe(100.0);
    expect(checkoutRes.tax).toBe(16.0);
    expect(checkoutRes.total).toBe(116.0);
    expect(checkoutRes.payment.change).toBe(84.0); // 200 - 116 = 84
    expect(checkoutRes.saleOrderId).toBeGreaterThan(0);
    expect(checkoutRes.stockMoveId).toBeGreaterThan(0);

    saleOrderId = checkoutRes.saleOrderId;
  });

  // --- 6. VALIDACIÓN DE DESCARGA DE STOCK POST-VENTA ---
  it("Debe reflejar la reducción de stock físico en inventario tras la venta POS", async () => {
    const stock = await stockService.getStockLevels({ companyId });
    const prodStock = stock.items.find((i) => i.productId === productId);

    expect(prodStock).toBeDefined();
    // 100 received - 4 sold = 96 remaining
    expect(prodStock?.currentStock).toBe(96);
  });

  // --- 7. REIMPRESIÓN / CONSULTA DE TICKET POS ---
  it("Debe consultar el ticket emitido para reimpresión en impresora térmica", async () => {
    const ticket = await posService.getTicket(saleOrderId);

    expect(ticket).toBeDefined();
    expect(ticket?.saleOrderId).toBe(saleOrderId);
    expect(ticket?.items.length).toBe(1);
    expect(ticket?.items[0].qty).toBe(4);
    expect(ticket?.total).toBe(116.0);
  });
});
