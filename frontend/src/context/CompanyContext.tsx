import React, { createContext, useContext, useState, useEffect } from "react";
import { companyApi } from "../api/companyApi";
import { tenantApi } from "../api/tenantApi";
import { useAuth } from "./AuthContext";

export interface Company {
  id: number;
  name: string;
  code: string;
  taxId?: string;
  currency?: string;
  chartOfAccountsPreset?: string;
}

export const CURRENCY_CONFIGS: Record<
  string,
  { name: string; symbol: string; decimals: number; denominations: number[]; flag: string }
> = {
  MXN: { name: "Peso Mexicano", symbol: "$", decimals: 2, denominations: [50, 100, 200, 500], flag: "🇲🇽" },
  USD: { name: "Dólar Estadounidense", symbol: "$", decimals: 2, denominations: [5, 10, 20, 50, 100], flag: "🇺🇸" },
  EUR: { name: "Euro", symbol: "€", decimals: 2, denominations: [5, 10, 20, 50, 100], flag: "🇪🇺" },
  COP: { name: "Peso Colombiano", symbol: "$", decimals: 0, denominations: [5000, 10000, 20000, 50000, 100000], flag: "🇨🇴" },
  PEN: { name: "Sol Peruano", symbol: "S/", decimals: 2, denominations: [10, 20, 50, 100, 200], flag: "🇵🇪" },
  GTQ: { name: "Quetzal Guatemalteco", symbol: "Q", decimals: 2, denominations: [10, 20, 50, 100, 200], flag: "🇬🇹" },
  CLP: { name: "Peso Chileno", symbol: "$", decimals: 0, denominations: [1000, 2000, 5000, 10000, 20000], flag: "🇨🇱" },
};

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  currencyCode: string;
  currencySymbol: string;
  denominations: number[];
  formatCurrency: (amount: number) => string;
  setCompanyCurrency: (currencyCode: string) => Promise<void>;
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const extractCurrencyCode = (val: any): string => {
  if (!val) return "MXN";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.code) return String(val.code);
  return "MXN";
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>("MXN");
  const [loading, setLoading] = useState<boolean>(false);

  const loadCompanies = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await companyApi.listCompanies();
      const sanitizedData = data.map((c: any) => ({
        ...c,
        currency: extractCurrencyCode(c.currency),
      }));
      const allowed = sanitizedData.filter((c: any) => user.allowedCompanyIds.includes(c.id));
      setCompanies(allowed.length > 0 ? allowed : sanitizedData);

      const active = allowed.find((c: any) => c.id === user.activeCompanyId) || allowed[0];
      if (active) {
        setActiveCompany(active);
        setCurrencyCode(extractCurrencyCode(active.currency));
      }
    } catch (err) {
      console.error("Error al cargar empresas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user?.activeCompanyId, user?.userId]);

  const safeCurrencyCode = extractCurrencyCode(currencyCode);
  const currencyConfig = CURRENCY_CONFIGS[safeCurrencyCode] || CURRENCY_CONFIGS.MXN;

  const formatCurrency = (amount: number): string => {
    const safeAmount = isNaN(amount) ? 0 : amount;
    return `${currencyConfig.symbol}${safeAmount.toLocaleString("es-MX", {
      minimumFractionDigits: currencyConfig.decimals,
      maximumFractionDigits: currencyConfig.decimals,
    })} ${safeCurrencyCode}`;
  };

  const setCompanyCurrency = async (newCode: string) => {
    if (!activeCompany) return;
    const safeCode = extractCurrencyCode(newCode);
    setCurrencyCode(safeCode);
    setActiveCompany((prev) => (prev ? { ...prev, currency: safeCode } : prev));
    try {
      await tenantApi.updateCompanySettings({
        companyId: activeCompany.id,
        currency: safeCode,
      });
    } catch (e) {
      console.warn("Moneda actualizada localmente:", e);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompany,
        currencyCode: safeCurrencyCode,
        currencySymbol: currencyConfig.symbol,
        denominations: currencyConfig.denominations,
        formatCurrency,
        setCompanyCurrency,
        loading,
        refreshCompanies: loadCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany debe usarse dentro de CompanyProvider");
  }
  return context;
};
