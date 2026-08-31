import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  FileText,
  Users,
  Tags,
  ShoppingBag,
  Package,
  Layers,
  Ruler,
  Truck,
  CreditCard,
  Landmark,
  FileSpreadsheet,
  Receipt,
  PieChart,
  Building2,
  Globe,
  Zap,
  Coins,
  ArrowRight,
  Command,
} from "lucide-react";
import { NavView } from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

export interface SearchItem {
  id: string;
  title: string;
  category:
    | "Vistas & Módulos"
    | "Catálogos Maestros"
    | "Finanzas & Reportes"
    | "Nómina & RH"
    | "Acciones Rápidas";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: NavView;
  tab?: string;
  actionKey?: string;
  shortcut?: string;
  keywords: string;
  roles?: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  // Acciones Rápidas
  {
    id: "act-express-invoice",
    title: "Facturar Express",
    category: "Acciones Rápidas",
    description: "Emisión ágil de CFDI / Comprobante de Venta",
    icon: Zap,
    actionKey: "express_invoice",
    shortcut: "F4",
    keywords: "facturar express factura venta rapida cfdi cobrar pos",
  },
  {
    id: "act-open-pos",
    title: "Punto de Venta (POS & Caja)",
    category: "Acciones Rápidas",
    description: "Apertura rápida del mostrador de venta",
    icon: ShoppingCart,
    view: "pos",
    keywords: "punto de venta pos mostrador caja cobrar ticket escanear",
  },

  // Ventas
  {
    id: "mod-sales-b2b",
    title: "Cotizaciones & Pedidos de Venta",
    category: "Vistas & Módulos",
    description: "Ventas corporativas B2B, pedidos y cotizaciones con límite de crédito",
    icon: FileText,
    view: "sales-b2b",
    keywords: "cotizaciones pedidos ventas b2b remisiones ordenes de venta",
  },
  {
    id: "cat-customers",
    title: "Clientes & Directorio Comercial",
    category: "Catálogos Maestros",
    description: "Directorio de clientes, RFC, límites de crédito, días y tarifas asignadas",
    icon: Users,
    view: "catalog",
    tab: "CUSTOMERS",
    keywords: "clientes directorio rfc saldo limite dias credito cobranza comercial",
  },
  {
    id: "cat-pricelists",
    title: "Listas de Precios & Tarifas",
    category: "Catálogos Maestros",
    description: "Listas de precios: General, Mayoreo, Distribuidores",
    icon: Tags,
    view: "catalog",
    tab: "PRICELISTS",
    keywords: "listas de precios tarifas mayoreo distribuidor descuentos precios",
  },

  // Compras
  {
    id: "mod-purchasing",
    title: "Compras & Órdenes de Compra",
    category: "Vistas & Módulos",
    description: "Gestión de órdenes de compra, recepción de mercancía y devoluciones a proveedor",
    icon: ShoppingBag,
    view: "purchases",
    keywords: "compras ordenes de compra devolucion a proveedor abastecimiento recepcion",
  },
  {
    id: "cat-suppliers",
    title: "Proveedores & Cuentas por Pagar",
    category: "Catálogos Maestros",
    description: "Padrón de proveedores, RFC, condiciones de pago y créditos",
    icon: Building2,
    view: "catalog",
    tab: "SUPPLIERS",
    keywords: "proveedores cuentas por pagar cxp compras abastecimiento suministros",
  },

  // Inventario
  {
    id: "mod-inventory",
    title: "Existencias, Stock & Valorización",
    category: "Vistas & Módulos",
    description: "Control de existencias en almacén, kardex y valorización de inventario",
    icon: Package,
    view: "inventory",
    keywords: "inventario stock existencias kardex valorizacion almacenes bodegas",
  },
  {
    id: "cat-products",
    title: "Catálogo Maestro de Productos",
    category: "Catálogos Maestros",
    description: "Alta y edición de productos, códigos de barra, precios y costos",
    icon: Package,
    view: "catalog",
    tab: "PRODUCTS",
    keywords: "productos articulos codigo barras sku precios costo mercancia catalogo",
  },
  {
    id: "cat-categories",
    title: "Familias & Categorías de Producto",
    category: "Catálogos Maestros",
    description: "Clasificación de productos por familia y sub-categorías",
    icon: Layers,
    view: "catalog",
    tab: "CATEGORIES",
    keywords: "familias categorias lineas clasificacion productos",
  },
  {
    id: "cat-uom",
    title: "Unidades de Medida (UoM)",
    category: "Catálogos Maestros",
    description: "Catálogo de unidades de medida (Pieza, Kilogramo, Litro, Caja)",
    icon: Ruler,
    view: "catalog",
    tab: "UOM",
    keywords: "unidades de medida uom pieza kilogramo litro metro caja sat",
  },
  {
    id: "mod-logistics",
    title: "Logística, Despachos & Lotes",
    category: "Vistas & Módulos",
    description: "Trazabilidad por número de lote, caducidades y despachos",
    icon: Truck,
    view: "logistics",
    keywords: "logistica despachos envios lotes caducidad trazabilidad paquetes",
  },

  // Finanzas & Contabilidad
  {
    id: "fin-aging",
    title: "Cuentas por Cobrar & Facturación (CxC)",
    category: "Finanzas & Reportes",
    description: "Aging de facturas, vencimientos por cubos y cobros aplicados",
    icon: CreditCard,
    view: "finance",
    tab: "AGING",
    keywords: "cxc cuentas por cobrar facturacion cobranza aging vencimiento morosidad",
  },
  {
    id: "fin-statement",
    title: "Estado de Cuenta Individual por Socio",
    category: "Finanzas & Reportes",
    description: "Libro mayor por cliente/proveedor, límite de crédito y semáforo de riesgo",
    icon: FileSpreadsheet,
    view: "finance",
    tab: "STATEMENT",
    keywords: "estado de cuenta socio cliente proveedor limite credito saldo libro mayor riesgo",
  },
  {
    id: "fin-treasury",
    title: "Cajas & Cuentas Bancarias",
    category: "Finanzas & Reportes",
    description: "Saldos bancarios, arqueos de caja y transferencias de tesorería",
    icon: Landmark,
    view: "treasury",
    keywords: "cajas bancos tesoreria transferencias spei bbva saldo cuentas dinero",
  },
  {
    id: "fin-reconciliation",
    title: "Conciliación Bancaria",
    category: "Finanzas & Reportes",
    description: "Emparejamiento de extractos bancarios contra libro contable",
    icon: Landmark,
    view: "finance",
    tab: "RECONCILIATION",
    keywords: "conciliacion bancaria extracto libro mayor bancos diferencias",
  },
  {
    id: "fin-expenses",
    title: "Gastos Operativos & Comprobantes",
    category: "Finanzas & Reportes",
    description: "Registro de gastos administrativos, servicios y comprobantes fiscales",
    icon: Receipt,
    view: "expenses",
    keywords: "gastos egresos compras menores recibos comprobantes deducibles rentas",
  },
  {
    id: "fin-pnl",
    title: "Estado de Resultados (P&L)",
    category: "Finanzas & Reportes",
    description: "Estado financiero de pérdidas y ganancias, margen bruto y neto",
    icon: PieChart,
    view: "finance",
    tab: "PNL",
    keywords: "pnl estado de resultados utilidades perdidas margen ingresos costos rentabilidad",
  },

  // Nómina & RH
  {
    id: "pay-employees",
    title: "Directorio de Empleados & Colaboradores",
    category: "Nómina & RH",
    description: "Catálogo de personal, altas, puestos, salarios base y RFC",
    icon: Users,
    view: "payroll",
    tab: "EMPLOYEES",
    keywords: "empleados colaboradores personal directorio puestos salarios rfc alta rh",
  },
  {
    id: "pay-advances",
    title: "Anticipos y Préstamos de Sueldo",
    category: "Nómina & RH",
    description: "Registro de anticipos de quincena y control de cuenta 107.01 deudores",
    icon: Coins,
    view: "payroll",
    tab: "ADVANCES",
    keywords: "anticipos prestamos sueldo quincena vales dinero colaboradores deduccion",
  },
  {
    id: "pay-runs",
    title: "Planilla & Dispersión de Nómina",
    category: "Nómina & RH",
    description: "Cálculo ágil de nómina, deducción de anticipos y asiento contable 602.01",
    icon: Receipt,
    view: "payroll",
    tab: "RUNS",
    keywords: "nomina planilla dispersion calculo quincenal sueldos asiento contable",
  },

  // Configuración & Empresa
  {
    id: "cfg-company",
    title: "Datos Fiscales de Empresa & Moneda",
    category: "Catálogos Maestros",
    description: "Razón social, RFC, régimen fiscal y moneda de operación (MXN, USD)",
    icon: Building2,
    view: "catalog",
    tab: "COMPANY",
    keywords: "empresa moneda configuracion rfc razon social fiscal mxn usd",
  },
  {
    id: "cfg-tenant-team",
    title: "Mi Equipo, Usuarios & Suscripción",
    category: "Vistas & Módulos",
    description: "Administración de usuarios, roles del tenant y plan de suscripción",
    icon: Users,
    view: "tenant-team",
    keywords: "equipo usuarios roles suscripcion plan pyme permisos administracion",
  },
  {
    id: "cfg-saas-admin",
    title: "Plataforma SaaS Master (Super Admin)",
    category: "Vistas & Módulos",
    description: "Aprovisionamiento de tenants y métricas globales de la plataforma",
    icon: Globe,
    view: "saas-admin",
    roles: ["SUPER_ADMIN"],
    keywords: "saas master tenants provision super admin empresas metricas",
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: NavView, tab?: string) => void;
  onAction: (actionKey: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onAction,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = user?.role || "TENANT_ADMIN";

  const filteredItems = SEARCH_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(role)) {
      return false;
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter" && filteredItems.length > 0) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    }
  };

  const handleSelect = (item: SearchItem) => {
    if (item.actionKey) {
      onAction(item.actionKey);
    } else if (item.view) {
      onNavigate(item.view, item.tab);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#071C33] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-white/10 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar módulo, catálogo, reporte o acción... (ej. clientes, facturas, pos, pnl)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/5">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>No se encontraron coincidencias para "{query}"</span>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-etiserv-blue/10 dark:bg-etiserv-blue/20 text-etiserv-blue"
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-etiserv-blue text-white shadow-sm"
                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/5 text-slate-400">
                          {typeof item.category === 'string' ? item.category : ((item.category as any)?.name || "Módulo")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                        {item.shortcut}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-etiserv-blue animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#061527] border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono">
                ↑
              </kbd>{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono">
                ↓
              </kbd>{" "}
              Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-mono">
                Enter
              </kbd>{" "}
              Seleccionar
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> Axelor Fast Finder
          </span>
        </div>
      </div>
    </div>
  );
};
