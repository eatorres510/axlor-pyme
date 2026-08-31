import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Building2,
  ShoppingCart,
  User,
  LogOut,
  Globe,
  Zap,
  Search,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { ExpressInvoiceModal } from "../modals/ExpressInvoiceModal";
import { CommandPalette } from "./CommandPalette";
import { NavView } from "./Sidebar";

interface TopbarProps {
  onOpenPOS: () => void;
  onNavigate: (view: NavView, tab?: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenPOS, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, switchCompany, logout } = useAuth();
  const [expressModalOpen, setExpressModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global F4 and Ctrl+K shortcut listeners across the entire app
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F4") {
        e.preventDefault();
        setExpressModalOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = parseInt(e.target.value, 10);
    if (!isNaN(targetId) && targetId !== user?.activeCompanyId) {
      try {
        await switchCompany(targetId);
      } catch (err: any) {
        alert(err.message || "No se pudo cambiar de empresa");
      }
    }
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", color: "text-purple-700 bg-purple-50 dark:bg-purple-950/40" },
    TENANT_ADMIN: { label: "Tenant Admin", color: "text-etiserv-blue bg-blue-50 dark:bg-blue-950/40" },
    ADMIN: { label: "Admin", color: "text-etiserv-blue bg-blue-50 dark:bg-blue-950/40" },
    CASHIER: { label: "Cajero", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40" },
    ACCOUNTANT: { label: "Contador", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40" },
    WAREHOUSE: { label: "Almacén", color: "text-slate-700 bg-slate-100 dark:bg-slate-800" },
  };

  const currentRole = user?.role ? roleLabels[user.role] : { label: "Usuario", color: "text-slate-600 bg-slate-100" };

  return (
    <header className="h-16 bg-white dark:bg-[#071C33] border-b border-slate-200 dark:border-white/10 sticky top-0 z-30 px-6 flex items-center justify-between transition-colors">
      {/* Company Selector */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
          {user?.role === "SUPER_ADMIN" ? <Globe className="w-4 h-4 text-purple-600" /> : <Building2 className="w-4 h-4" />}
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block leading-none">
            {user?.role === "SUPER_ADMIN" ? "Modo Super Admin (Global)" : `Empresa Activa (${user?.allowedCompanies?.length || 1})`}
          </span>
          <select
            value={user?.activeCompanyId || ""}
            onChange={handleCompanyChange}
            disabled={(user?.allowedCompanies?.length || 0) <= 1 && user?.role !== "SUPER_ADMIN"}
            className="bg-transparent font-heading font-bold text-xs text-slate-800 dark:text-white cursor-pointer focus:outline-none border-none p-0 pr-4 mt-0.5 disabled:cursor-default"
          >
            {user?.allowedCompanies?.map((comp) => (
              <option
                key={comp.id}
                value={comp.id}
                className="text-slate-900 bg-white dark:bg-[#071C33] dark:text-white"
              >
                {comp.name} ({comp.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Search Bar (Axelor Fast Finder) */}
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all w-64 lg:w-96 text-xs text-left shadow-sm group"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-etiserv-blue transition-colors shrink-0" />
        <span className="flex-1 truncate text-[11px] font-medium">Buscar módulo, catálogo o acción...</span>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 shrink-0">
          Ctrl K
        </span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Buscar (Ctrl + K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Fast Invoicing Button with F4 Shortcut */}
        {(user?.role === "SUPER_ADMIN" || user?.role === "TENANT_ADMIN" || user?.role === "ADMIN" || user?.role === "ACCOUNTANT") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpressModalOpen(true)}
            className="gap-1.5 font-semibold text-xs px-3 py-1.5 border-etiserv-blue/30 text-etiserv-blue hover:bg-etiserv-blue/5"
            title="Presiona F4 desde cualquier pantalla"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Facturar Express</span>
            <span className="text-[9px] font-mono font-bold px-1 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
              F4
            </span>
          </Button>
        )}

        {/* Fast POS Button */}
        {(user?.role === "SUPER_ADMIN" || user?.role === "TENANT_ADMIN" || user?.role === "CASHIER" || user?.role === "ADMIN") && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenPOS}
            className="gap-2 font-semibold text-xs px-3.5 py-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Punto de Venta</span>
          </Button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile & Role Chip */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs">
            <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="hidden md:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-white block leading-tight truncate max-w-[120px]">
                {user?.name || user?.username}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${currentRole.color}`}>
                {currentRole.label}
              </span>
            </div>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
              En Línea
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(view, tab) => onNavigate(view, tab)}
        onAction={(actionKey) => {
          if (actionKey === "express_invoice") {
            setExpressModalOpen(true);
          } else if (actionKey === "open_pos") {
            onOpenPOS();
          }
        }}
      />

      {/* Express Invoicing Modal (F4) */}
      <ExpressInvoiceModal
        isOpen={expressModalOpen}
        onClose={() => setExpressModalOpen(false)}
      />
    </header>
  );
};
