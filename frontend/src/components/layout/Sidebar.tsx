import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Receipt,
  Users,
  CreditCard,
  Landmark,
  Tags,
  Globe,
  FileText,
  Truck,
  Building2,
  Layers,
  Ruler,
  FileSpreadsheet,
  PieChart,
  Boxes,
  Coins,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  PackageCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../../context/AuthContext";

export type NavView =
  | "dashboard"
  | "pos"
  | "sales-b2b"
  | "inventory"
  | "logistics"
  | "purchases"
  | "expenses"
  | "payroll"
  | "finance"
  | "treasury"
  | "catalog"
  | "saas-admin"
  | "tenant-team";

export interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tab?: string;
  badge?: string;
  roles: string[];
}

export interface NavSection {
  title: string;
  roles: string[];
  items: NavItem[];
}

interface SidebarProps {
  currentView: NavView;
  activeSubTab?: string;
  onSelectView: (view: NavView, tab?: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeSubTab,
  onSelectView,
  collapsed,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const [menuFilter, setMenuFilter] = useState("");
  const role = user?.role || "TENANT_ADMIN";

  const allSections: NavSection[] = [
    {
      title: "Plataforma SaaS (Master)",
      roles: ["SUPER_ADMIN"],
      items: [
        { id: "saas-admin", label: "Tenants & Clientes SaaS", icon: Building2, tab: "TENANTS", badge: "Master", roles: ["SUPER_ADMIN"] },
        { id: "saas-admin", label: "Planes & Suscripciones", icon: Zap, tab: "PLANS", badge: "Tarifas", roles: ["SUPER_ADMIN"] },
      ],
    },
    {
      title: "Resumen",
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT", "WAREHOUSE"],
      items: [
        { id: "dashboard", label: "Dashboard General", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT", "WAREHOUSE"] },
      ],
    },
    {
      title: "Comercial & Ventas",
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "CASHIER"],
      items: [
        { id: "pos", label: "Punto de Venta (POS)", icon: ShoppingCart, badge: "Caja", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "CASHIER"] },
        { id: "sales-b2b", label: "Cotizaciones Comerciales", icon: FileText, tab: "QUOTES", badge: "B2B", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"] },
        { id: "sales-b2b", label: "Pedidos de Venta B2B", icon: ShoppingBag, tab: "ORDERS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"] },
        { id: "sales-b2b", label: "Facturas de Venta (CxC)", icon: Receipt, tab: "INVOICES", badge: "Fiscal", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "CASHIER", "ACCOUNTANT"] },
        { id: "catalog", label: "Clientes & Directorio", icon: Users, tab: "CUSTOMERS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "CASHIER"] },
        { id: "sales-b2b", label: "Listas de Precios & Tarifas", icon: Tags, tab: "PRICE_LISTS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"] },
      ],
    },
    {
      title: "Compras & Abastecimiento",
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"],
      items: [
        { id: "purchases", label: "Órdenes de Compra", icon: ShoppingBag, tab: "ORDERS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "purchases", label: "Recepciones de Almacén", icon: PackageCheck, tab: "RECEIPTS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "purchases", label: "Facturas de Compra (CxP)", icon: Receipt, tab: "INVOICES", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "catalog", label: "Proveedores (CxP)", icon: Building2, tab: "SUPPLIERS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
      ],
    },
    {
      title: "Inventario & Almacén",
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"],
      items: [
        { id: "inventory", label: "Existencias & Stock", icon: Package, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "catalog", label: "Catálogo de Productos", icon: Boxes, tab: "PRODUCTS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "catalog", label: "Familias & Categorías", icon: Layers, tab: "CATEGORIES", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "catalog", label: "Unidades de Medida", icon: Ruler, tab: "UOM", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "catalog", label: "Listas de Precios & Tarifas", icon: Tags, tab: "PRICELISTS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
        { id: "logistics", label: "Logística & Despachos", icon: Truck, badge: "Lotes", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "WAREHOUSE"] },
      ],
    },
    {
      title: "Finanzas & Contabilidad",
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT", "CASHIER"],
      items: [
        { id: "finance", label: "Cuentas por Cobrar (CxC)", icon: CreditCard, tab: "AGING", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
        { id: "finance", label: "Estado de Cuenta por Socio", icon: FileSpreadsheet, tab: "STATEMENT", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
        { id: "treasury", label: "Cajas & Cuentas Bancarias", icon: Landmark, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT", "CASHIER"] },
        { id: "finance", label: "Conciliación Bancaria", icon: Landmark, tab: "RECONCILIATION", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
        { id: "expenses", label: "Gastos Operativos", icon: Receipt, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
        { id: "finance", label: "Estado de Resultados (P&L)", icon: PieChart, tab: "PNL", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
      ],
    },
    {
      title: "Nómina & RH",
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"],
      items: [
        { id: "payroll", label: "Directorio de Empleados", icon: Users, tab: "EMPLOYEES", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
        { id: "payroll", label: "Anticipos de Sueldo", icon: Coins, tab: "ADVANCES", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
        { id: "payroll", label: "Planilla & Dispersión", icon: Receipt, tab: "RUNS", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN", "ACCOUNTANT"] },
      ],
    },
    {
      title: "Configuración & Empresa",
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"],
      items: [
        { id: "catalog", label: "Datos Fiscales & Moneda", icon: Building2, tab: "COMPANY", roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"] },
        { id: "tenant-team", label: "Mi Equipo & Suscripción", icon: Users, roles: ["SUPER_ADMIN", "TENANT_ADMIN", "ADMIN"] },
      ],
    },
  ];

  const q = menuFilter.toLowerCase().trim();

  const visibleSections = allSections
    .filter((sec) => sec.roles.includes(role))
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => {
        if (!item.roles.includes(role)) return false;
        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          sec.title.toLowerCase().includes(q) ||
          (item.tab && item.tab.toLowerCase().includes(q))
        );
      }),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 bottom-0 z-40 bg-[#071C33] text-slate-300 border-r border-white/10 flex flex-col transition-all duration-200 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header with Collapse Button */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-white/10 shrink-0">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-etiserv-blue flex items-center justify-center font-bold text-white text-sm tracking-tight font-heading shadow-md shadow-etiserv-blue/20 shrink-0">
                  Ax
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading font-bold text-sm tracking-tight text-white leading-none truncate">
                    Axelor PyME
                  </h1>
                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block mt-1 truncate">
                    etiserv.tech
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Colapsar Menú Lateral"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg bg-etiserv-blue flex items-center justify-center font-bold text-white text-sm tracking-tight font-heading shadow-md shadow-etiserv-blue/20 hover:ring-2 hover:ring-white/40 transition-all group"
                title="Expandir Menú Lateral"
              >
                <span className="group-hover:hidden">Ax</span>
                <ChevronRight className="w-4 h-4 hidden group-hover:block text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Input */}
        {!collapsed && (
          <div className="px-3 pt-3 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={menuFilter}
                onChange={(e) => setMenuFilter(e.target.value)}
                placeholder="Filtrar menú..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-etiserv-blue transition-colors"
              />
            </div>
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {visibleSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {!collapsed && (
                <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  {section.title}
                </span>
              )}
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isViewMatch = currentView === item.id;
                const isTabMatch = item.tab ? activeSubTab === item.tab : !activeSubTab;
                const isActive = item.tab ? isViewMatch && isTabMatch : isViewMatch;

                return (
                  <button
                    key={`${item.id}-${item.tab || iIdx}`}
                    onClick={() => onSelectView(item.id, item.tab)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative group",
                      isActive
                        ? "bg-etiserv-blue text-white font-semibold shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={clsx(
                        "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={clsx(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded leading-none",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-white/10 text-slate-400"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
