export interface TopProductMetric {
  productId: number;
  name: string;
  soldQty: number;
  revenue: number;
  averagePrice?: number;
}

export interface SalesRepresentativeMetric {
  sellerId: number;
  name: string;
  avatar?: string;
  role: string;
  zone: string;
  monthSales: number;
  quotaTarget: number;
  quotaAttainmentPct: number;
  ordersCount: number;
  averageTicket: number;
  estimatedCommission: number;
  status: "TOP_PERFORMER" | "ON_TARGET" | "NEEDS_ATTENTION";
}

export interface ExecutiveKPIs {
  companyId: number;
  generatedAt: string;
  todaySales: number;
  todayTransactions: number;
  averageTicket: number;
  monthSales: number;
  grossMarginEstimate: number;
  grossMarginPercent: number;
  monthExpenses: number;
  netOperatingIncome: number;
  netMarginPercent: number;
  liquidityBalance: number;
  bankBalance: number;
  totalAccountsReceivable: number; // CxC
  totalAccountsPayable: number; // CxP
  dsoDays: number;
  inventoryValuation: number;
  criticalStockCount: number;
  topProducts: TopProductMetric[];
  topSellers?: SalesRepresentativeMetric[];
  globalQuotaPct?: number;
  totalCompanyQuota?: number;
}

export interface DailySalesMetric {
  date: string;
  sales: number;
  transactions: number;
  categorySales?: Record<string, number>;
}

export interface CategorySalesBreakdown {
  id: string;
  name: string;
  code: string;
  sales: number;
  transactions: number;
  percentage: number;
  color: string;
}

export interface SalesTrendResponse {
  days: number;
  categoryFilter?: string;
  totalSales: number;
  totalTransactions: number;
  trend: DailySalesMetric[];
  categories: CategorySalesBreakdown[];
}
