/**
 * Dynamic Seed Sales Database & Real-Time Aggregator
 * Provides realistic historical and live sales records tied to real collaborators,
 * product families (BEB, SNK, EMP, SRV), and customer accounts.
 */

export interface SeedSeller {
  id: number;
  name: string;
  username: string;
  role: string;
  zone: string;
  quotaTarget: number;
  commissionRate: number;
  companyId: number;
}

export interface SeedSaleLine {
  productId: number;
  productName: string;
  category: "BEB" | "SNK" | "EMP" | "SRV";
  qty: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export interface SeedSaleRecord {
  id: number;
  orderNumber: string;
  companyId: number;
  sellerId: number;
  sellerName: string;
  customerName: string;
  channel: "POS" | "B2B" | "MAYOREO";
  date: string; // ISO string YYYY-MM-DDTHH:mm:ss
  lines: SeedSaleLine[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  totalCost: number;
  status: "CONFIRMED" | "PAID";
}

export const SEED_SELLERS: SeedSeller[] = [
  {
    id: 101,
    name: "Carlos Mendoza",
    username: "cmendoza",
    role: "Ejecutivo B2B Senior",
    zone: "Zona Norte / Corporativo",
    quotaTarget: 40000.0,
    commissionRate: 0.05,
    companyId: 13,
  },
  {
    id: 102,
    name: "Mariana Fuentes",
    username: "cajero",
    role: "Cajera & Vendedora Mostrador",
    zone: "Sucursal Matriz / POS",
    quotaTarget: 35000.0,
    commissionRate: 0.04,
    companyId: 13,
  },
  {
    id: 103,
    name: "Alejandro Ruiz",
    username: "aruiz",
    role: "Ejecutivo Cuentas Clave",
    zone: "Zona Centro / Mayoreo",
    quotaTarget: 30000.0,
    commissionRate: 0.04,
    companyId: 13,
  },
  {
    id: 104,
    name: "Sofía Garza",
    username: "sgarza",
    role: "Asesora Comercial Junior",
    zone: "Zona Occidente",
    quotaTarget: 25000.0,
    commissionRate: 0.03,
    companyId: 13,
  },
];

const SEED_CUSTOMERS = [
  "Supermercados La Central S.A.",
  "Abarrotes Los Pinos",
  "Tiendas OXXO / Extra",
  "Distribuciones del Norte",
  "Restaurante El Portal",
  "Comercializadora San Juan",
  "Mini Súper La Esquina",
  "Cliente Mostrador / General",
  "Cafetería Gourmet Express",
  "Bodega Mayorista Don Pepe",
];

const SAMPLE_PRODUCTS = [
  // BEB
  { id: 1, name: "Refresco Cola 600ml", category: "BEB" as const, unitPrice: 17.5, costPrice: 10.5 },
  { id: 2, name: "Agua Mineral 600ml", category: "BEB" as const, unitPrice: 15.0, costPrice: 8.0 },
  { id: 3, name: "Jugo Naranja 1L", category: "BEB" as const, unitPrice: 25.0, costPrice: 14.0 },
  { id: 4, name: "Bebida Energética 473ml", category: "BEB" as const, unitPrice: 38.0, costPrice: 22.0 },
  { id: 5, name: "Té Helado Limón 500ml", category: "BEB" as const, unitPrice: 19.5, costPrice: 11.0 },

  // SNK
  { id: 6, name: "Papas Fritas Sal 45g", category: "SNK" as const, unitPrice: 18.0, costPrice: 10.0 },
  { id: 7, name: "Galletas Chocolate 100g", category: "SNK" as const, unitPrice: 18.0, costPrice: 9.5 },
  { id: 8, name: "Cacahuates Enchilados 70g", category: "SNK" as const, unitPrice: 14.0, costPrice: 7.5 },
  { id: 9, name: "Barra de Cereal 40g", category: "SNK" as const, unitPrice: 12.0, costPrice: 6.0 },
  { id: 10, name: "Chocolates Surtidos 150g", category: "SNK" as const, unitPrice: 32.0, costPrice: 18.0 },

  // EMP
  { id: 11, name: "Caja Cartón 40x30x20", category: "EMP" as const, unitPrice: 22.0, costPrice: 11.0 },
  { id: 12, name: "Rollo Cinta Canela 150m", category: "EMP" as const, unitPrice: 35.0, costPrice: 18.0 },
  { id: 13, name: "Rollo Plástico Burbuja 50m", category: "EMP" as const, unitPrice: 120.0, costPrice: 65.0 },
  { id: 14, name: "Bolsa Kraft c/Asa", category: "EMP" as const, unitPrice: 8.5, costPrice: 4.0 },

  // SRV
  { id: 15, name: "Flete y Despacho Local", category: "SRV" as const, unitPrice: 150.0, costPrice: 60.0 },
  { id: 16, name: "Servicio Embalaje Especial", category: "SRV" as const, unitPrice: 80.0, costPrice: 25.0 },
];

/**
 * Generate 160 realistic, timestamped historical sales records across the past 60 days.
 */
function generateSeedSales(): SeedSaleRecord[] {
  const records: SeedSaleRecord[] = [];
  const now = new Date();
  let nextId = 1001;

  // Distribute over last 60 days
  for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - dayOffset);

    // 2 to 5 sales per day
    const daySalesCount = 2 + ((dayOffset * 7 + 3) % 4);

    for (let s = 0; s < daySalesCount; s++) {
      const hour = 9 + ((s * 3 + dayOffset) % 10);
      const minute = (s * 17 + dayOffset * 11) % 60;
      saleDate.setHours(hour, minute, 0, 0);

      // Pick seller with weighted distribution
      // Carlos Mendoza ~35%, Mariana Fuentes ~30%, Alejandro Ruiz ~22%, Sofía Garza ~13%
      const sellerPick = (dayOffset * 3 + s * 7) % 100;
      let seller = SEED_SELLERS[0]; // Carlos
      if (sellerPick < 35) seller = SEED_SELLERS[0];
      else if (sellerPick < 65) seller = SEED_SELLERS[1]; // Mariana
      else if (sellerPick < 87) seller = SEED_SELLERS[2]; // Alejandro
      else seller = SEED_SELLERS[3]; // Sofía

      const customer = SEED_CUSTOMERS[(dayOffset + s) % SEED_CUSTOMERS.length];
      const channel = seller.role.includes("Cajera") ? ("POS" as const) : ("B2B" as const);

      // Generate 1 to 4 lines
      const lineCount = 1 + ((dayOffset + s) % 4);
      const lines: SeedSaleLine[] = [];
      let subtotal = 0;
      let totalCost = 0;

      for (let l = 0; l < lineCount; l++) {
        const prodIndex = (dayOffset * 3 + s * 2 + l * 5) % SAMPLE_PRODUCTS.length;
        const prod = SAMPLE_PRODUCTS[prodIndex];
        const qtyMultiplier = channel === "B2B" ? 5 + ((s + l) % 15) : 1 + ((s + l) % 4);
        const qty = qtyMultiplier;
        const lineTotal = Number((qty * prod.unitPrice).toFixed(2));
        const lineCost = Number((qty * prod.costPrice).toFixed(2));

        subtotal += lineTotal;
        totalCost += lineCost;

        lines.push({
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          qty,
          unitPrice: prod.unitPrice,
          costPrice: prod.costPrice,
          total: lineTotal,
        });
      }

      const tax = Number((subtotal * 0.16).toFixed(2));
      const totalAmount = Number((subtotal + tax).toFixed(2));

      records.push({
        id: nextId++,
        orderNumber: channel === "POS" ? `TKT-${nextId}` : `SO-2026-${nextId}`,
        companyId: 13,
        sellerId: seller.id,
        sellerName: seller.name,
        customerName: customer,
        channel,
        date: saleDate.toISOString(),
        lines,
        subtotal: Number(subtotal.toFixed(2)),
        tax,
        totalAmount,
        totalCost: Number(totalCost.toFixed(2)),
        status: "CONFIRMED",
      });
    }
  }

  return records;
}

// In-memory persistent seed sales database
export const seedSalesRecords: SeedSaleRecord[] = generateSeedSales();

/**
 * Record a new sale in real time (e.g. from POS checkout or B2B confirmed order)
 */
export function recordNewSale(payload: {
  companyId: number;
  sellerId?: number;
  sellerName?: string;
  customerName?: string;
  channel?: "POS" | "B2B" | "MAYOREO";
  items: Array<{
    productId: number;
    productName: string;
    category?: "BEB" | "SNK" | "EMP" | "SRV";
    qty: number;
    unitPrice: number;
    costPrice?: number;
  }>;
  totalAmount: number;
}): SeedSaleRecord {
  const seller =
    SEED_SELLERS.find((s) => s.id === payload.sellerId) ||
    SEED_SELLERS.find((s) => s.name === payload.sellerName) ||
    SEED_SELLERS[1]; // Default to Mariana Fuentes (POS)

  let subtotal = 0;
  let totalCost = 0;

  const lines: SeedSaleLine[] = payload.items.map((it) => {
    const lineTotal = Number((it.qty * it.unitPrice).toFixed(2));
    const cost = it.costPrice || it.unitPrice * 0.6;
    const lineCost = Number((it.qty * cost).toFixed(2));
    subtotal += lineTotal;
    totalCost += lineCost;

    // Detect category if not provided
    let cat: "BEB" | "SNK" | "EMP" | "SRV" = it.category || "BEB";
    const nameLower = it.productName.toLowerCase();
    if (nameLower.includes("papa") || nameLower.includes("galleta") || nameLower.includes("snack") || nameLower.includes("choc")) {
      cat = "SNK";
    } else if (nameLower.includes("caja") || nameLower.includes("cinta") || nameLower.includes("bolsa") || nameLower.includes("empaque")) {
      cat = "EMP";
    } else if (nameLower.includes("flete") || nameLower.includes("servicio") || nameLower.includes("garant")) {
      cat = "SRV";
    }

    return {
      productId: it.productId,
      productName: it.productName,
      category: cat,
      qty: it.qty,
      unitPrice: it.unitPrice,
      costPrice: cost,
      total: lineTotal,
    };
  });

  const tax = Number((subtotal * 0.16).toFixed(2));
  const newRecord: SeedSaleRecord = {
    id: seedSalesRecords.length + 2000,
    orderNumber: payload.channel === "B2B" ? `SO-2026-${Date.now().toString().slice(-4)}` : `TKT-${Date.now().toString().slice(-4)}`,
    companyId: payload.companyId || 13,
    sellerId: seller.id,
    sellerName: seller.name,
    customerName: payload.customerName || "Cliente General Mostrador",
    channel: payload.channel || "POS",
    date: new Date().toISOString(),
    lines,
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    totalAmount: Number(payload.totalAmount.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    status: "CONFIRMED",
  };

  seedSalesRecords.push(newRecord);
  return newRecord;
}

/**
 * Dynamically calculates sellers leaderboard and quota attainment from real sales records.
 */
export function calculateSellerLeaderboard(companyId: number) {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  const sellerMetrics: Record<
    number,
    {
      seller: SeedSeller;
      monthSales: number;
      ordersCount: number;
      totalItemsSold: number;
    }
  > = {};

  for (const s of SEED_SELLERS) {
    if (s.companyId === companyId || companyId === 13) {
      sellerMetrics[s.id] = {
        seller: s,
        monthSales: 0,
        ordersCount: 0,
        totalItemsSold: 0,
      };
    }
  }

  // Aggregate monthly sales for each seller
  for (const sale of seedSalesRecords) {
    if (sale.companyId !== companyId && companyId !== 13) continue;
    if (sale.date.startsWith(currentMonthStr)) {
      if (sellerMetrics[sale.sellerId]) {
        sellerMetrics[sale.sellerId].monthSales += sale.totalAmount;
        sellerMetrics[sale.sellerId].ordersCount++;
        sellerMetrics[sale.sellerId].totalItemsSold += sale.lines.reduce((acc, l) => acc + l.qty, 0);
      }
    }
  }

  let totalCompanyMonthSales = 0;
  let totalCompanyQuota = 0;

  const leaderboard = Object.values(sellerMetrics).map(({ seller, monthSales, ordersCount }) => {
    const safeMonthSales = Number(monthSales.toFixed(2));
    const attainment = seller.quotaTarget > 0 ? Number(((safeMonthSales / seller.quotaTarget) * 100).toFixed(1)) : 100;
    const avgTicket = ordersCount > 0 ? Number((safeMonthSales / ordersCount).toFixed(2)) : 0;
    const commission = Number((safeMonthSales * seller.commissionRate).toFixed(2));

    totalCompanyMonthSales += safeMonthSales;
    totalCompanyQuota += seller.quotaTarget;

    let status: "TOP_PERFORMER" | "ON_TARGET" | "NEEDS_ATTENTION" = "ON_TARGET";
    if (attainment >= 110) status = "TOP_PERFORMER";
    else if (attainment < 70) status = "NEEDS_ATTENTION";

    return {
      sellerId: seller.id,
      name: seller.name,
      username: seller.username,
      role: seller.role,
      zone: seller.zone,
      monthSales: safeMonthSales,
      quotaTarget: seller.quotaTarget,
      quotaAttainmentPct: attainment,
      ordersCount,
      averageTicket: avgTicket,
      estimatedCommission: commission,
      status,
    };
  });

  // Sort by monthSales descending
  leaderboard.sort((a, b) => b.monthSales - a.monthSales);

  const globalQuotaPct =
    totalCompanyQuota > 0 ? Number(((totalCompanyMonthSales / totalCompanyQuota) * 100).toFixed(1)) : 100;

  return {
    leaderboard,
    globalQuotaPct,
    totalMonthSales: Number(totalCompanyMonthSales.toFixed(2)),
    totalQuota: Number(totalCompanyQuota.toFixed(2)),
  };
}

/**
 * Dynamically calculates product family breakdown and sales trend from real sales records.
 */
export function calculateSalesTrendAndFamilies(
  companyId: number,
  days: number = 7,
  categoryFilter: string = "ALL"
) {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(now.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  // Group by date
  const dailyMap: Record<
    string,
    { sales: number; transactions: number; BEB: number; SNK: number; EMP: number; SRV: number }
  > = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    dailyMap[dateKey] = { sales: 0, transactions: 0, BEB: 0, SNK: 0, EMP: 0, SRV: 0 };
  }

  const categoryTotals: Record<
    string,
    { id: string; name: string; color: string; sales: number; transactions: number }
  > = {
    BEB: { id: "BEB", name: "ðŸ¥¤ Bebidas & Refrescos", color: "#0070F3", sales: 0, transactions: 0 },
    SNK: { id: "SNK", name: "ðŸª Alimentos & Snacks", color: "#F5A623", sales: 0, transactions: 0 },
    EMP: { id: "EMP", name: "📦 Empaque & Cajas", color: "#10B981", sales: 0, transactions: 0 },
    SRV: { id: "SRV", name: "âš™ï¸ Materiales & Servicios", color: "#8B5CF6", sales: 0, transactions: 0 },
  };

  let totalPeriodSales = 0;
  let totalPeriodTransactions = 0;

  for (const sale of seedSalesRecords) {
    if (sale.companyId !== companyId && companyId !== 13) continue;
    const saleDateStr = sale.date.slice(0, 10);

    if (saleDateStr >= cutoffStr && dailyMap[saleDateStr]) {
      let saleAmountForFilter = 0;
      let matchedFilter = false;

      for (const line of sale.lines) {
        const cat = line.category || "BEB";
        if (categoryTotals[cat]) {
          categoryTotals[cat].sales += line.total;
        }

        if (dailyMap[saleDateStr][cat] !== undefined) {
          dailyMap[saleDateStr][cat] += line.total;
        }

        if (categoryFilter === "ALL" || categoryFilter === cat) {
          saleAmountForFilter += line.total;
          matchedFilter = true;
        }
      }

      if (categoryFilter === "ALL") {
        dailyMap[saleDateStr].sales += sale.totalAmount;
        dailyMap[saleDateStr].transactions++;
        totalPeriodSales += sale.totalAmount;
        totalPeriodTransactions++;
      } else if (matchedFilter) {
        dailyMap[saleDateStr].sales += Number((saleAmountForFilter * 1.16).toFixed(2));
        dailyMap[saleDateStr].transactions++;
        totalPeriodSales += Number((saleAmountForFilter * 1.16).toFixed(2));
        totalPeriodTransactions++;
      }
    }
  }

  // Count category transactions
  for (const sale of seedSalesRecords) {
    if (sale.companyId !== companyId && companyId !== 13) continue;
    const saleDateStr = sale.date.slice(0, 10);
    if (saleDateStr >= cutoffStr) {
      const catsInSale = new Set(sale.lines.map((l) => l.category));
      for (const c of catsInSale) {
        if (categoryTotals[c]) categoryTotals[c].transactions++;
      }
    }
  }

  // Calculate percentage shares for categories
  const categoriesSum = Object.values(categoryTotals).reduce((sum, c) => sum + c.sales, 0);
  const categoriesList = Object.values(categoryTotals).map((cat) => ({
    ...cat,
    sales: Number(cat.sales.toFixed(2)),
    percentage: categoriesSum > 0 ? Number(((cat.sales / categoriesSum) * 100).toFixed(1)) : 25,
  }));

  const trend = Object.entries(dailyMap).map(([date, val]) => ({
    date,
    sales: Number(val.sales.toFixed(2)),
    transactions: val.transactions,
    categorySales: {
      BEB: Number(val.BEB.toFixed(2)),
      SNK: Number(val.SNK.toFixed(2)),
      EMP: Number(val.EMP.toFixed(2)),
      SRV: Number(val.SRV.toFixed(2)),
    },
  }));

  return {
    days,
    categoryFilter,
    totalPeriodSales: Number(totalPeriodSales.toFixed(2)),
    totalPeriodTransactions,
    averageDailySales: days > 0 ? Number((totalPeriodSales / days).toFixed(2)) : 0,
    categories: categoriesList,
    trend,
  };
}

/**
 * Dynamically calculates Top Products from sales records.
 */
export function calculateTopProductsFromSales(companyId: number) {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const prodMap: Record<number, { productId: number; name: string; soldQty: number; revenue: number }> = {};

  for (const sale of seedSalesRecords) {
    if (sale.companyId !== companyId && companyId !== 13) continue;
    if (sale.date.startsWith(currentMonthStr)) {
      for (const line of sale.lines) {
        if (!prodMap[line.productId]) {
          prodMap[line.productId] = {
            productId: line.productId,
            name: line.productName,
            soldQty: 0,
            revenue: 0,
          };
        }
        prodMap[line.productId].soldQty += line.qty;
        prodMap[line.productId].revenue += line.total;
      }
    }
  }

  const topProducts = Object.values(prodMap)
    .map((p) => ({
      productId: p.productId,
      name: p.name,
      soldQty: p.soldQty,
      revenue: Number(p.revenue.toFixed(2)),
      averagePrice: p.soldQty > 0 ? Number((p.revenue / p.soldQty).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return topProducts;
}
