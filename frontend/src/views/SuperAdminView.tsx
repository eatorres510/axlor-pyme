import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  DollarSign,
  Plus,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Edit2,
  Trash2,
  Lock,
  Search,
  Check,
  Ban,
  Globe,
  Sliders,
  Sparkles,
} from "lucide-react";
import { saasApi, TenantRecord, SaaSPlan, SaaSMetrics } from "../api/saasApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

export type SaaSTab = "TENANTS" | "PLANS";

interface SuperAdminViewProps {
  initialTab?: SaaSTab;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ initialTab = "TENANTS" }) => {
  const [activeTab, setActiveTab] = useState<SaaSTab>(initialTab);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [metrics, setMetrics] = useState<SaaSMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync initialTab when sidebar selection changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modal 1: Aprovisionar Tenant
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [planCode, setPlanCode] = useState("PYME_PRO");
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<any>(null);

  // Modal 2: Editar Tenant
  const [editTenantModalOpen, setEditTenantModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: "",
    planCode: "PYME_PRO",
    adminName: "",
    adminEmail: "",
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED" | "TRIAL",
  });

  // Modal 3: Reset Password
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTenant, setPasswordTenant] = useState<TenantRecord | null>(null);
  const [newPassword, setNewPassword] = useState("admin123");

  // Modal 4: Plan CRUD
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanCode, setEditingPlanCode] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    code: "",
    name: "",
    priceMonthly: 999,
    maxCompanies: 2,
    maxUsers: 5,
    maxPos: 2,
    currency: "MXN",
    featuresText: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, plansData, metricsData] = await Promise.all([
        saasApi.listTenants(),
        saasApi.listPlans(),
        saasApi.getMetrics(),
      ]);
      setTenants(tenantsData || []);
      setPlans(plansData || []);
      setMetrics(metricsData);
    } catch (err) {
      console.error("Error al cargar datos SaaS:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Provision Handlers ---
  const handleOpenProvision = () => {
    setTenantName("");
    setTenantCode(`TNT_${Math.floor(Math.random() * 899) + 100}`);
    setTaxId("");
    setPlanCode("PYME_PRO");
    setAdminName("");
    setAdminUsername("");
    setAdminEmail("");
    setAdminPassword("admin123");
    setProvisionResult(null);
    setProvisionModalOpen(true);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantCode || !taxId || !adminUsername || !adminPassword) return;

    try {
      setProvisioning(true);
      const result = await saasApi.provisionTenant({
        tenantName,
        tenantCode,
        planCode,
        taxId,
        adminName: adminName || tenantName,
        adminUsername,
        adminEmail: adminEmail || `${adminUsername}@pyme.com`,
        adminPassword,
      });
      setProvisionResult(result);
      loadData();
    } catch (err: any) {
      alert(`Error al aprovisionar tenant: ${err.message}`);
    } finally {
      setProvisioning(false);
    }
  };

  // --- Tenant CRUD Handlers ---
  const handleOpenEditTenant = (t: TenantRecord) => {
    setEditingTenantId(t.id);
    setTenantForm({
      name: t.name,
      planCode: t.planCode,
      adminName: t.adminName,
      adminEmail: t.adminEmail,
      status: t.status,
    });
    setEditTenantModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenantId) return;
    try {
      await saasApi.updateTenant(editingTenantId, tenantForm as any);
      alert("¡Tenant actualizado exitosamente!");
      setEditTenantModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error al actualizar tenant: ${err.message}`);
    }
  };

  const handleToggleTenantStatus = async (t: TenantRecord) => {
    try {
      const updated = await saasApi.toggleTenantStatus(t.id);
      alert(`Estado de "${t.name}" cambiado a ${updated.status}`);
      loadData();
    } catch (err: any) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  const handleOpenPasswordModal = (t: TenantRecord) => {
    setPasswordTenant(t);
    setNewPassword("admin123");
    setPasswordModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTenant) return;
    try {
      const res = await saasApi.resetTenantPassword(passwordTenant.id, newPassword);
      alert(res.message);
      setPasswordModalOpen(false);
    } catch (err: any) {
      alert(`Error al resetear contraseña: ${err.message}`);
    }
  };

  const handleDeleteTenant = async (t: TenantRecord) => {
    if (!confirm(`¿Está seguro de eliminar el tenant "${t.name}" (${t.code}) y su acceso?`)) return;
    try {
      await saasApi.deleteTenant(t.id);
      alert("Tenant eliminado.");
      loadData();
    } catch (err: any) {
      alert(`Error al eliminar tenant: ${err.message}`);
    }
  };

  // --- Plan CRUD Handlers ---
  const handleOpenCreatePlan = () => {
    setEditingPlanCode(null);
    setPlanForm({
      code: "",
      name: "",
      priceMonthly: 999,
      maxCompanies: 2,
      maxUsers: 5,
      maxPos: 2,
      currency: "MXN",
      featuresText: "Hasta 2 Sucursales\nHasta 2 Cajas POS\nHasta 5 Colaboradores\nFacturación Electrónica",
    });
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (p: SaaSPlan) => {
    setEditingPlanCode(p.code);
    setPlanForm({
      code: p.code,
      name: p.name,
      priceMonthly: p.priceMonthly,
      maxCompanies: p.maxCompanies,
      maxUsers: p.maxUsers,
      maxPos: p.maxPos,
      currency: p.currency || "MXN",
      featuresText: (p.features || []).join("\n"),
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const features = planForm.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingPlanCode) {
        await saasApi.updatePlan(editingPlanCode, {
          name: planForm.name,
          priceMonthly: planForm.priceMonthly,
          maxCompanies: planForm.maxCompanies,
          maxUsers: planForm.maxUsers,
          maxPos: planForm.maxPos,
          features,
        });
        alert("¡Plan SaaS actualizado!");
      } else {
        if (!planForm.code.trim()) {
          alert("Ingrese el código del plan");
          return;
        }
        await saasApi.createPlan({
          code: planForm.code as any,
          name: planForm.name,
          priceMonthly: planForm.priceMonthly,
          maxCompanies: planForm.maxCompanies,
          maxUsers: planForm.maxUsers,
          maxPos: planForm.maxPos,
          currency: planForm.currency,
          features,
        });
        alert("¡Nuevo plan SaaS creado exitosamente!");
      }
      setPlanModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error al guardar plan: ${err.message}`);
    }
  };

  const handleDeletePlan = async (p: SaaSPlan) => {
    if (["STARTER", "PYME_PRO", "ENTERPRISE"].includes(p.code)) {
      alert("Los planes estándar del sistema no pueden eliminarse.");
      return;
    }
    if (!confirm(`¿Está seguro de eliminar el plan "${p.name}"?`)) return;
    try {
      await saasApi.deletePlan(p.code);
      alert("Plan eliminado.");
      loadData();
    } catch (err: any) {
      alert(`Error al eliminar plan: ${err.message}`);
    }
  };

  const planBadgeVariants: Record<string, "primary" | "warning" | "success" | "neutral"> = {
    STARTER: "warning",
    PYME_PRO: "primary",
    ENTERPRISE: "success",
  };

  // Standalone View Configurations
  const TAB_CONFIGS: Record<
    SaaSTab,
    {
      title: string;
      subtitle: string;
      badge: string;
      badgeVariant: "primary" | "warning" | "success" | "neutral";
      actionLabel: string;
      searchPlaceholder: string;
      onAction: () => void;
    }
  > = {
    TENANTS: {
      title: "Directorio & Gestión de Tenants SaaS",
      subtitle: "Administración integral de empresas clientes, control de acceso, cambio de plan y aprovisionamiento 1-Click",
      badge: "Super Admin Master",
      badgeVariant: "primary",
      actionLabel: "Aprovisionar Nuevo Tenant",
      searchPlaceholder: "Buscar tenant por nombre, código o admin...",
      onAction: handleOpenProvision,
    },
    PLANS: {
      title: "Catálogo de Planes & Suscripciones SaaS",
      subtitle: "Estructura de precios recurrentes, límites de sucursales, cajas POS, colaboradores y características por plan",
      badge: "Suscripciones Recurrentes",
      badgeVariant: "warning",
      actionLabel: "Crear Nuevo Plan SaaS",
      searchPlaceholder: "Buscar plan SaaS...",
      onAction: handleOpenCreatePlan,
    },
  };

  const currentConfig = TAB_CONFIGS[activeTab] || TAB_CONFIGS.TENANTS;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              {currentConfig.title}
            </h2>
            <Badge variant={currentConfig.badgeVariant}>{currentConfig.badge}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentConfig.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} loading={loading} className="gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={currentConfig.onAction}
            className="gap-1.5 text-xs font-semibold"
            glow
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{currentConfig.actionLabel}</span>
          </Button>
        </div>
      </div>

      {/* PAGE 1: TENANTS DIRECTORY & MANAGEMENT */}
      {activeTab === "TENANTS" && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tenants Registrados
                </span>
                <Building2 className="w-4 h-4 text-etiserv-blue" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
                  {metrics?.totalTenants || tenants.length}
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="success" dot>
                    {metrics?.activeTenants || tenants.length} Activos
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  MRR Estimado (Mensual)
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
                  ${metrics?.estimatedMRR?.toLocaleString("es-MX") || "1,798"} {metrics?.currency || "MXN"}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Suscripciones recurrentes</p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Distribución de Planes
                </span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {plans.map((p) => {
                  const count = tenants.filter((t) => t.planCode === p.code).length;
                  return (
                    <Badge key={p.code} variant={planBadgeVariants[p.code] || "neutral"}>
                      {p.name.replace("Plan ", "")}: {count}
                    </Badge>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Motor Transaccional
                </span>
                <ShieldCheck className="w-4 h-4 text-etiserv-blue" />
              </div>
              <div className="mt-3">
                <span className="text-sm font-heading font-bold text-slate-900 dark:text-white block">
                  Axelor Suite 8.5
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Zero-Leak Multi-Tenant OK
                </span>
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tenant por nombre, código o admin..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-etiserv-blue"
            />
          </div>

          {/* Tenants Table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Directorio de Clientes / Tenants
                </h3>
                <p className="text-[11px] text-slate-400">Empresas clientes alojadas en la plataforma</p>
              </div>
              <Badge variant="primary">{tenants.length} Clientes</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
                  <tr>
                    <th className="py-2.5 px-5">ID / Código</th>
                    <th className="py-2.5 px-5">Empresa Cliente</th>
                    <th className="py-2.5 px-5">Plan Suscrito</th>
                    <th className="py-2.5 px-5">Admin de Tenant</th>
                    <th className="py-2.5 px-5">Empresas</th>
                    <th className="py-2.5 px-5 text-center">Estado</th>
                    <th className="py-2.5 px-5 text-right">Acciones de Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {tenants
                    .filter(
                      (t) =>
                        (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.adminName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.adminUsername || "").toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-5 font-mono text-xs font-bold text-etiserv-blue">
                          {t.id} <span className="text-slate-400 font-normal">({t.code})</span>
                        </td>
                        <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                          {t.name}
                        </td>
                        <td className="py-3 px-5">
                          <Badge variant={planBadgeVariants[t.planCode] || "neutral"}>
                            {t.planCode}
                          </Badge>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {t.adminName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              @{t.adminUsername} ({t.adminEmail})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-slate-500 font-medium">
                          {t.companyIds?.length || 1} sucursal(es)
                        </td>
                        <td className="py-3 px-5 text-center">
                          <Badge variant={t.status === "ACTIVE" ? "success" : "danger"} dot>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTenant(t)}
                              className="p-1.5 text-slate-400 hover:text-etiserv-blue hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                              title="Editar Tenant & Plan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPasswordModal(t)}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded transition-colors"
                              title="Resetear Contraseña Master"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleTenantStatus(t)}
                              className={`p-1.5 rounded transition-colors ${
                                t.status === "ACTIVE"
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              }`}
                              title={t.status === "ACTIVE" ? "Suspender Tenant" : "Reactivar Tenant"}
                            >
                              {t.status === "ACTIVE" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTenant(t)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                              title="Eliminar Tenant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* PAGE 2: PLANS & SUBSCRIPTIONS */}
      {activeTab === "PLANS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const subscribedCount = tenants.filter((t) => t.planCode === p.code).length;
              return (
                <Card key={p.code} className="p-6 flex flex-col justify-between hover:border-etiserv-blue/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={planBadgeVariants[p.code] || "primary"}>
                        {p.code}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPlan(p)}
                          className="p-1 text-slate-400 hover:text-etiserv-blue hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                          title="Editar Plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!["STARTER", "PYME_PRO", "ENTERPRISE"].includes(p.code) && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(p)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                            title="Eliminar Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                      {p.name}
                    </h4>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
                        ${p.priceMonthly}
                      </span>
                      <span className="text-xs text-slate-400">/{p.currency || "mes"}</span>
                    </div>

                    {/* Limits Overview */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Empresas / Sucursales:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{p.maxCompanies >= 999 ? "Ilimitadas" : p.maxCompanies}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cajas POS de Cobro:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{p.maxPos >= 999 ? "Ilimitadas" : p.maxPos}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Colaboradores / Usuarios:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{p.maxUsers >= 999 ? "Ilimitados" : p.maxUsers}</strong>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Características Incluidas
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {p.features?.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tenants suscritos:</span>
                    <Badge variant={subscribedCount > 0 ? "success" : "neutral"}>
                      {subscribedCount} {subscribedCount === 1 ? "Cliente" : "Clientes"}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: PROVISION NEW TENANT */}
      <Modal
        isOpen={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        title="Aprovisionar Nuevo Tenant / Cliente SaaS"
        maxWidth="lg"
      >
        {!provisionResult ? (
          <form onSubmit={handleProvisionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Razón Social del Tenant"
                placeholder="ej. Grupo Comercial del Norte S.A."
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
              <Input
                label="Código Único de Tenant"
                placeholder="ej. GCN001"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="RFC / Tax ID Fiscal"
                placeholder="ej. GCN200101XYZ"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                required
              />
              <Select
                label="Plan de Suscripción"
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
              >
                {plans.map((pl) => (
                  <option key={pl.code} value={pl.code}>
                    {pl.name} (${pl.priceMonthly}/mes)
                  </option>
                ))}
              </Select>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Credenciales del Administrador Principal
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nombre del Administrador"
                  placeholder="ej. Lic. Roberto Gómez"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
                <Input
                  label="Usuario de Acceso"
                  placeholder="ej. rgomez_admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="rgomez@empresa.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
                <Input
                  label="Contraseña Temporal"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
              <Button type="button" variant="outline" size="sm" onClick={() => setProvisionModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={provisioning} glow>
                <Zap className="w-3.5 h-3.5" /> Aprovisionar 1-Click
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              ¡Tenant Aprovisionado Exitosamente!
            </h3>
            <p className="text-xs text-slate-500">
              La empresa, plan contable PyME y usuario administrador fueron configurados en Axelor Open Suite.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 text-left text-xs font-mono space-y-1.5">
              <div><strong>Tenant ID:</strong> {provisionResult.tenant.id}</div>
              <div><strong>Empresa Primaria:</strong> ID #{provisionResult.companyId}</div>
              <div><strong>Admin Username:</strong> {provisionResult.adminCredentials.username}</div>
              <div><strong>Contraseña:</strong> {provisionResult.adminCredentials.temporaryPassword}</div>
            </div>
            <Button variant="primary" size="sm" onClick={() => setProvisionModalOpen(false)} className="w-full">
              Entendido
            </Button>
          </div>
        )}
      </Modal>

      {/* MODAL 2: EDIT TENANT */}
      <Modal
        isOpen={editTenantModalOpen}
        onClose={() => setEditTenantModalOpen(false)}
        title="Editar Tenant & Plan Suscrito"
        maxWidth="md"
      >
        <form onSubmit={handleSaveTenant} className="space-y-4">
          <Input
            label="Razón Social / Nombre Comercial"
            value={tenantForm.name}
            onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Plan Suscrito"
              value={tenantForm.planCode}
              onChange={(e) => setTenantForm({ ...tenantForm, planCode: e.target.value })}
            >
              {plans.map((pl) => (
                <option key={pl.code} value={pl.code}>
                  {pl.name} (${pl.priceMonthly}/mes)
                </option>
              ))}
            </Select>

            <Select
              label="Estado del Tenant"
              value={tenantForm.status}
              onChange={(e) => setTenantForm({ ...tenantForm, status: e.target.value as any })}
            >
              <option value="ACTIVE">ACTIVE (Activo)</option>
              <option value="SUSPENDED">SUSPENDED (Suspendido)</option>
              <option value="TRIAL">TRIAL (Prueba)</option>
            </Select>
          </div>

          <Input
            label="Nombre del Administrador"
            value={tenantForm.adminName}
            onChange={(e) => setTenantForm({ ...tenantForm, adminName: e.target.value })}
          />

          <Input
            label="Correo de Notificaciones"
            type="email"
            value={tenantForm.adminEmail}
            onChange={(e) => setTenantForm({ ...tenantForm, adminEmail: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditTenantModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" glow>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: RESET PASSWORD */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Resetear Contraseña de ${passwordTenant?.name || ""}`}
        maxWidth="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-500">
            Se actualizará la contraseña de acceso para el usuario administrador{" "}
            <strong className="text-slate-800 dark:text-slate-200">@{passwordTenant?.adminUsername}</strong>.
          </p>

          <Input
            label="Nueva Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Ingrese nueva clave..."
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <Button type="button" variant="outline" size="sm" onClick={() => setPasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" glow>
              Actualizar Clave
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CREATE / EDIT SAAS PLAN */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlanCode ? `Editar Plan SaaS: ${planForm.name}` : "Crear Nuevo Plan de Suscripción SaaS"}
        maxWidth="md"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código del Plan"
              placeholder="ej. GROWTH, CUSTOM_VIP"
              value={planForm.code}
              onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
              disabled={!!editingPlanCode}
              required
            />
            <Input
              label="Precio Mensual (MXN)"
              type="number"
              min="0"
              value={planForm.priceMonthly}
              onChange={(e) => setPlanForm({ ...planForm, priceMonthly: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <Input
            label="Nombre Comercial del Plan"
            placeholder="ej. Plan Growth Empresarial"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Máx Empresas"
              type="number"
              min="1"
              value={planForm.maxCompanies}
              onChange={(e) => setPlanForm({ ...planForm, maxCompanies: parseInt(e.target.value, 10) || 1 })}
              required
            />
            <Input
              label="Máx Cajas POS"
              type="number"
              min="1"
              value={planForm.maxPos}
              onChange={(e) => setPlanForm({ ...planForm, maxPos: parseInt(e.target.value, 10) || 1 })}
              required
            />
            <Input
              label="Máx Usuarios"
              type="number"
              min="1"
              value={planForm.maxUsers}
              onChange={(e) => setPlanForm({ ...planForm, maxUsers: parseInt(e.target.value, 10) || 1 })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Características Incluidas (Una por línea)
            </label>
            <textarea
              rows={4}
              value={planForm.featuresText}
              onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
              placeholder="1 Empresa / Sucursal&#10;1 Caja POS de Cobro&#10;Soporte Estándar..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue font-mono"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button type="button" variant="outline" size="sm" onClick={() => setPlanModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" glow>
              Guardar Plan SaaS
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuperAdminView;
