import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CompanyProvider } from "./context/CompanyContext";
import { AppLayout } from "./components/layout/AppLayout";
import { NavView } from "./components/layout/Sidebar";
import { DashboardView } from "./views/DashboardView";
import { POSView } from "./views/POSView";
import { SalesB2BView } from "./views/SalesB2BView";
import { InventoryView } from "./views/InventoryView";
import { LogisticsView } from "./views/LogisticsView";
import { PurchasingView } from "./views/PurchasingView";
import { ExpensesView } from "./views/ExpensesView";
import { PayrollView } from "./views/PayrollView";
import { FinanceView } from "./views/FinanceView";
import { TreasuryView } from "./views/TreasuryView";
import { CatalogView } from "./views/CatalogView";
import { SuperAdminView } from "./views/SuperAdminView";
import { TenantTeamView } from "./views/TenantTeamView";
import { LoginView } from "./views/LoginView";

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const getDefaultView = (): NavView => {
    if (user?.role === "SUPER_ADMIN") return "saas-admin";
    if (user?.role === "CASHIER") return "pos";
    return "dashboard";
  };

  const [currentView, setCurrentView] = useState<NavView>(getDefaultView());
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);

  const handleSelectView = (view: NavView, tab?: string) => {
    setCurrentView(view);
    setActiveSubTab(tab);
  };

  React.useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      setCurrentView("saas-admin");
    } else if (user?.role === "CASHIER") {
      setCurrentView("pos");
    } else {
      setCurrentView("dashboard");
    }
  }, [user?.role, user?.userId]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (currentView) {
      case "saas-admin":
        return <SuperAdminView initialTab={activeSubTab as any} />;
      case "tenant-team":
        return <TenantTeamView />;
      case "dashboard":
        return <DashboardView onNavigate={(view) => handleSelectView(view)} />;
      case "pos":
        return <POSView />;
      case "sales-b2b":
        return <SalesB2BView initialTab={activeSubTab as any} />;
      case "inventory":
        return <InventoryView initialTab={activeSubTab as any} />;
      case "logistics":
        return <LogisticsView />;
      case "purchases":
        return <PurchasingView initialTab={activeSubTab as any} />;
      case "expenses":
        return <ExpensesView />;
      case "payroll":
        return <PayrollView initialTab={activeSubTab as any} />;
      case "finance":
        return <FinanceView initialTab={activeSubTab as any} />;
      case "treasury":
        return <TreasuryView />;
      case "catalog":
        return <CatalogView initialTab={activeSubTab as any} />;
      default:
        return <DashboardView onNavigate={(view) => handleSelectView(view)} />;
    }
  };

  return (
    <AppLayout
      currentView={currentView}
      activeSubTab={activeSubTab}
      onSelectView={handleSelectView}
    >
      {renderView()}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <MainApp />
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
