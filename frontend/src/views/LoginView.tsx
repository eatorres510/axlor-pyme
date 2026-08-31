import React, { useState } from "react";
import {
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  Building2,
  ShoppingCart,
  Receipt,
  Globe,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Usuario o contraseña inválidos"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#071C33] flex flex-col justify-center items-center p-4 selection:bg-etiserv-blue selection:text-white">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-etiserv-blue text-white shadow-glow mb-1 font-heading font-bold text-xl">
            Ax
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            Axelor PyME Platform
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Jerarquía SaaS de 2 Niveles & Motor Transaccional Axelor
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-7 bg-white dark:bg-[#0B2B4C] border border-slate-200 dark:border-white/10 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario o Identificador"
              icon={<User className="w-4 h-4" />}
              placeholder="Ej: superadmin, admin o cajero"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Contraseña"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold text-xs tracking-wide bg-etiserv-blue hover:bg-etiserv-blueHover"
              loading={loading}
              glow
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Iniciar Sesión Segura
            </Button>
          </form>

          {/* Quick Demo Access (2-Level SaaS Hierarchy) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
              Perfiles Rápidos de Prueba (Jerarquía SaaS)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("superadmin", "superadmin123")}
                className="p-2 rounded-lg border border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-500 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                  <Globe className="w-3 h-3 text-purple-600" />
                  <span>Super Admin</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">SaaS & Planes Master</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "admin123")}
                className="p-2 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20 hover:border-etiserv-blue text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-etiserv-blue dark:text-blue-300 font-bold text-[11px]">
                  <Building2 className="w-3 h-3 text-etiserv-blue" />
                  <span>Tenant Admin</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">Dueño de la PyME</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("cajero", "cajero123")}
                className="p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                  <ShoppingCart className="w-3 h-3 text-emerald-600" />
                  <span>Cajero POS</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">Solo POS y Arqueo</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("contador", "contador123")}
                className="p-2 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                  <Receipt className="w-3 h-3 text-amber-600" />
                  <span>Contador</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5">Finanzas y Gastos</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          Powered by Axelor Open Suite Engine & etiserv.tech
        </p>
      </div>
    </div>
  );
};
