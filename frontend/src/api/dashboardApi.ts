import { api } from "./client";

export const dashboardApi = {
  getKPIs: async (companyId: number) => {
    const res = await api.get(`/dashboard/kpis?companyId=${companyId}`);
    return res.data.data;
  },
  getSalesTrend: async (companyId: number, days = 7, category?: string) => {
    let url = `/dashboard/sales-trend?companyId=${companyId}&days=${days}`;
    if (category && category !== "ALL") {
      url += `&category=${encodeURIComponent(category)}`;
    }
    const res = await api.get(url);
    return res.data.data;
  },
};
