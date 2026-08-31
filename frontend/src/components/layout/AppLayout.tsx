import React, { useState } from "react";
import { Sidebar, NavView } from "./Sidebar";
import { Topbar } from "./Topbar";
import { clsx } from "clsx";

interface AppLayoutProps {
  currentView: NavView;
  activeSubTab?: string;
  onSelectView: (view: NavView, tab?: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  activeSubTab,
  onSelectView,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#061527] text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        activeSubTab={activeSubTab}
        onSelectView={onSelectView}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Workspace */}
      <div
        className={clsx(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          collapsed ? "ml-20" : "ml-64"
        )}
      >
        <Topbar
          onOpenPOS={() => onSelectView("pos")}
          onNavigate={(view, tab) => onSelectView(view, tab)}
        />
        <main className="flex-1 p-6 sm:p-7 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
