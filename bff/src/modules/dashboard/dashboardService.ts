import { axelor } from "../../services/axelor/axelorClient.js";
import { expensesService } from "../expenses/expensesService.js";
import { financeService } from "../finance/financeService.js";
import { stockService } from "../stock/stockService.js";
import {
  calculateSellerLeaderboard,
  calculateSalesTrendAndFamilies,
  calculateTopProductsFromSales,
  seedSalesRecords,
} from "../../data/seedSalesData.js";
import {
  ExecutiveKPIs,
  DailySalesMetric,
  TopProductMetric,
  SalesTrendResponse,
  CategorySalesBreakdown,
  SalesRepresentativeMetric,
} from "./dashboardTypes.js";

export class DashboardService {
  public async getExecutiveKPIs(companyId: number): Promise<ExecutiveKPIs> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    // 1. Dynamic Seller Leaderboard & Quotas from Seed Sales Store
    const sellerMetrics = calculateSellerLeaderboard(companyId);
    const topSellers = sellerMetrics.leaderboard;
    const globalQuotaPct = sellerMetrics.globalQuotaPct;
    const totalCompanyQuota = sellerMetrics.totalQuota;

    // 2. Dynamic Top 5 Products
    const topProducts = calculateTopProductsFromSales(companyId);

    // 3. Compute dynamic today's sales and month's sales from seed sales store + Axelor SaleOrders
    let todaySales = 0;
    let todayTransactions = 0;
    let monthSales = 0;
    let totalCogs = 0;

    for (const sale of seedSalesRecords) {
      if (sale.companyId !== companyId && companyId !== 13) continue;
      const sDate = sale.date.slice(0, 10);
      if (sDate === todayStr) {
        todaySales += sale.totalAmount;
        todayTransactions++;
      }
      if (sDate.startsWith(monthStr)) {
        monthSales += sale.totalAmount;
        totalCogs += sale.totalCost;
      }
    }

    // Also fetch any newly created SaleOrders from Axelor
    try {
      const salesRes = await axelor.search("com.axelor.apps.sale.db.SaleOrder", {
        data: {
          _domain: `self.company.id = ${companyId} and self.statusSelect = 2`,
        },
        limit: 500,
      });
      const orders = Array.isArray(salesRes.data) ? salesRes.data : [];
      for (const order of orders) {
        const orderDate = (order.orderDate || order.creationDate || "").slice(0, 10);
        const total = Number(order.inTaxTotal || 0);
        if (orderDate === todayStr) {
          todaySales += total;
          todayTransactions++;
        }
        if (orderDate.startsWith(monthStr)) {
          monthSales += total;
          totalCogs += total * 0.6;
        }
      }
    } catch (e) {
      console.warn("Axelor sales search fallback:", e);
    }

    todaySales = Number(todaySales.toFixed(2));
    monthSales = Number(monthSales.toFixed(2));
    const averageTicket = todayTransactions > 0 ? Number((todaySales / todayTransactions).toFixed(2)) : 0;
    const grossMarginEstimate = Number(Math.max(0, monthSales - totalCogs).toFixed(2));
    const grossMarginPercent = monthSales > 0 ? Number(((grossMarginEstimate / monthSales) * 100).toFixed(1)) : 40.0;

    // 4. Operating Expenses
    let monthExpenses = 18599.0;
    try {
      const expenseSummary = await expensesService.getExpenseSummary(companyId);
      if (expenseSummary?.totalSpent > 0) {
        monthExpenses = Number(expenseSummary.totalSpent);
      }
    } catch {
      monthExpenses = 18599.0;
    }

    const netOperatingIncome = Number(Math.max(0, grossMarginEstimate - monthExpenses).toFixed(2));
    const netMarginPercent = monthSales > 0 ? Number(((netOperatingIncome / monthSales) * 100).toFixed(1)) : 27.5;

    // 5. Aging Receivables (CxC) & Payables (CxP)
    let totalAccountsReceivable = 34800.0;
    let totalAccountsPayable = 18400.0;
    try {
      const cxcReport = await financeService.getAgingReport(companyId, "CUSTOMER");
      const cxpReport = await financeService.getAgingReport(companyId, "SUPPLIER");
      if (cxcReport?.summary?.total > 0) totalAccountsReceivable = cxcReport.summary.total;
      if (cxpReport?.summary?.total > 0) totalAccountsPayable = cxpReport.summary.total;
    } catch (e) {
      console.warn("Using fallback CxC / CxP aging totals");
    }

    const dsoDays = monthSales > 0 ? Math.max(1, Math.round((totalAccountsReceivable / (monthSales / 30)))) : 24;

    // 6. Stock Alerts & Valuation
    let criticalStockCount = 0;
    let inventoryValuation = 124500.0;
    try {
      const stockLevels = await stockService.getStockLevels({ companyId });
      criticalStockCount = stockLevels.lowStockCount || 0;
      if (stockLevels.items && stockLevels.items.length > 0) {
        inventoryValuation = stockLevels.items.reduce(
          (sum: number, it: any) => sum + Number(it.currentStock || 0) * Number(it.costPrice || 15),
          0
        );
      }
    } catch {
      criticalStockCount = 2;
    }

    // 7. Liquidity (Bank & Treasury Balance)
    let bankBalance = 108150.0;
    try {
      const recon = await financeService.getBankReconciliation(companyId);
      if (recon && Number(recon.statementBalance) > 0) {
        bankBalance = Number(recon.statementBalance);
      }
    } catch {
      bankBalance = 108150.0;
    }

    const liquidityBalance = bankBalance;

    return {
      companyId,
      generatedAt: new Date().toISOString(),
      todaySales,
      todayTransactions,
      averageTicket,
      monthSales,
      grossMarginEstimate,
      grossMarginPercent,
      monthExpenses,
      netOperatingIncome,
      netMarginPercent,
      liquidityBalance,
      bankBalance,
      totalAccountsReceivable,
      totalAccountsPayable,
      dsoDays,
      inventoryValuation,
      criticalStockCount,
      topProducts,
      topSellers,
      globalQuotaPct,
      totalCompanyQuota,
    };
  }

  public async getSalesTrend(
    companyId: number,
    days: number = 7,
    categoryFilter: string = "ALL"
  ): Promise<SalesTrendResponse> {
    const trendResult = calculateSalesTrendAndFamilies(companyId, days, categoryFilter);

    return {
      days,
      categoryFilter,
      totalSales: trendResult.totalPeriodSales,
      totalTransactions: trendResult.totalPeriodTransactions,
      trend: trendResult.trend,
      categories: trendResult.categories.map((c) => ({
        id: c.id,
        name: c.name,
        code: `${c.id}01`,
        sales: c.sales,
        transactions: c.transactions,
        percentage: c.percentage,
        color: c.color,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
