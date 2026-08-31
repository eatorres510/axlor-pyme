import React, { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  ShoppingCart,
  Receipt,
  Package,
  Coins,
  Check,
  Building2,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  Briefcase,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCompany, CURRENCY_CONFIGS } from "../context/CompanyContext";
import { tenantApi, TenantCollaborator, PlanUsageResponse } from "../api/tenantApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

export const TenantTeamView: React.FC = () => {
  const { user } = useAuth();
  const {
    companies,
    activeCompany,
    currencyCode,
    setCompanyCurrency,
    setActiveCompany,
    refreshCompanies,
  } = useCompany();

  const [collaborators, setCollaborators] = useState<TenantCollaborator[]>([]);
  const [usage, setUsage] = useState<PlanUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Moneda Global del Tenant
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currencyCode);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencySavedToast, setCurrencySavedToast] = useState(false);

  // Modal Colaborador (Crear / Editar)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollabId, setEditingCollabId] = useState<number | null>(null);
  const [collabName, setCollabName] = useState("");
  const [collabUsername, setCollabUsername] = useState("");
  const [collabPassword, setCollabPassword] = useState("");
  const [collabRole, setCollabRole] = useState<
    "CASHIER" | "ACCOUNTANT" | "WAREHOUSE" | "SALES" | "HR" | "TENANT_ADMIN"
  >("CASHIER");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(
    user?.activeCompanyId || 13
  );
  const [submitting, setSubmitting] = useState(false);

  // Modal Sucursal (Crear / Editar)
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchTaxId, setBranchTaxId] = useState("");
  const [submittingBranch, setSubmittingBranch] = useState(false);

  // Modal Matriz de Roles
  const [rolesModalOpen, setRolesModalOpen] = useState(false);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const [collabData, usageData] = await Promise.all([
        tenantApi.listCollaborators(),
        tenantApi.getPlanUsage(),
      ]);
      setCollaborators(collabData || []);
      setUsage(usageData);
    } catch (err) {
      console.error("Error al cargar equipo del tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
    setSelectedCurrency(currencyCode);
  }, [currencyCode]);

  const handleSaveCurrency = async () => {
    try {
      setSavingCurrency(true);
      await setCompanyCurrency(selectedCurrency);
      setCurrencySavedToast(true);
      setTimeout(() => setCurrencySavedToast(false), 3000);
      alert(`Moneda oficial del Tenant actualizada a ${selectedCurrency} para todas las sucursales.`);
    } catch (err: any) {
      alert(`Error al guardar moneda: ${err.message}`);
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleOpenCreateCollaborator = () => {
    setEditingCollabId(null);
    setCollabName("");
    setCollabUsername("");
    setCollabPassword("");
    setCollabRole("CASHIER");
    setSelectedCompanyId(activeCompany?.id || 13);
    setModalOpen(true);
  };

  const handleOpenEditCollaborator = (c: TenantCollaborator) => {
    setEditingCollabId(c.id);
    setCollabName(c.name);
    setCollabUsername(c.username);
    setCollabPassword("");
    setCollabRole(c.role);
    setSelectedCompanyId(c.companyId);
    setModalOpen(true);
  };

  const handleSaveCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabName || !collabUsername) return;

    try {
      setSubmitting(true);
      const company = companies.find((c) => c.id === Number(selectedCompanyId));
      const companyName = company?.name || activeCompany?.name || "Empresa PyME";

      if (editingCollabId) {
        await tenantApi.updateCollaborator(editingCollabId, {
          name: collabName,
          role: collabRole,
          companyId: Number(selectedCompanyId),
          companyName,
        });
        alert(`¡Colaborador ${collabName} actualizado exitosamente!`);
      } else {
        if (!collabPassword) {
          alert("Por favor ingresa una contraseña para el nuevo usuario.");
          setSubmitting(false);
          return;
        }
        await tenantApi.createCollaborator({
          name: collabName,
          username: collabUsername,
          password: collabPassword,
          role: collabRole,
          companyId: Number(selectedCompanyId),
        });
        alert(`¡Colaborador ${collabName} registrado exitosamente!`);
      }
      setModalOpen(false);
      loadTeam();
    } catch (err: any) {
      alert(`Error al guardar colaborador: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (c: TenantCollaborator) => {
    const isCurrentlyActive = c.status !== "INACTIVE";
    const promptMessage = isCurrentlyActive
      ? `¿Estás seguro de dar de baja a ${c.name} (@${c.username})?\n\nSu acceso al sistema será revocado de inmediato, pero todos sus registros históricos (tickets, facturas y traspasos de almacén) quedarán protegidos para trazabilidad y auditoría.`
      : `¿Deseas reactivar el acceso al sistema para ${c.name} (@${c.username})?`;

    if (!confirm(promptMessage)) return;

    try {
      await tenantApi.toggleCollaboratorStatus(c.id);
      loadTeam();
    } catch (err: any) {
      alert(`Error al actualizar estado del colaborador: ${err.message}`);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !branchCode) return;

    try {
      setSubmittingBranch(true);
      await tenantApi.createBranch({
        name: branchName,
        code: branchCode,
        taxId: branchTaxId || activeCompany?.taxId,
        currency: currencyCode,
      });
      setBranchModalOpen(false);
      setBranchName("");
      setBranchCode("");
      setBranchTaxId("");
      await refreshCompanies();
      loadTeam();
      alert(`¡Sucursal ${branchName} creada e inicializada con Caja y Almacén!`);
    } catch (err: any) {
      alert(`Error al crear sucursal: ${err.message}`);
    } finally {
      setSubmittingBranch(false);
    }
  };

  const roleMeta: Record<
    string,
    {
      label: string;
      desc: string;
      icon: any;
      variant: "success" | "warning" | "primary" | "neutral" | "danger";
    }
  > = {
    TENANT_ADMIN: {
      label: "Tenant Admin",
      desc: "Acceso total a todos los módulos, sucursales, finanzas, nómina y configuración.",
      icon: ShieldCheck,
      variant: "primary",
    },
    SALES: {
      label: "Vendedor / Comercial",
      desc: "Cotizaciones B2B, Clientes, Catálogo de Precios y Punto de Venta (POS).",
      icon: TrendingUp,
      variant: "success",
    },
    CASHIER: {
      label: "Cajero POS",
      desc: "Punto de Venta (POS), Arqueos de Caja y Emisión de Tickets Térmicos.",
      icon: ShoppingCart,
      variant: "success",
    },
    ACCOUNTANT: {
      label: "Contador / Finanzas",
      desc: "Cuentas por Cobrar (CxC), Cuentas por Pagar (CxP), Bancos, Gastos y P&L.",
      icon: Receipt,
      variant: "warning",
    },
    WAREHOUSE: {
      label: "Almacenista / Logística",
      desc: "Existencias & Stock, Traslados entre Almacenes, Lotes y Despachos.",
      icon: Package,
      variant: "neutral",
    },
    HR: {
      label: "Recursos Humanos & Nómina",
      desc: "Directorio de Empleados, Anticipos de Sueldo y Dispersión de Nómina.",
      icon: Users,
      variant: "primary",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Mi Organización: Sucursales, Equipo & Configuración
            </h2>
            <Badge variant="primary">{usage?.plan?.name || "Plan PyME Pro"}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administración centralizada de sucursales multi-empresa, roles y colaboradores del Tenant
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTeam}
            loading={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRolesModalOpen(true)}
            className="gap-1.5 text-xs text-etiserv-blue border-etiserv-blue/30"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Matriz de Roles
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBranchModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Building2 className="w-3.5 h-3.5" /> Nueva Sucursal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateCollaborator}
            className="gap-1.5 text-xs"
            glow
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Colaborador
          </Button>
        </div>
      </div>

      {/* Plan Quota Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Colaboradores en Uso
            </span>
            <div className="text-lg font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {usage?.usage.usersUsed || collaborators.length + 1} de{" "}
              {usage?.usage.usersMax || 10}
            </div>
          </div>
          <Users className="w-5 h-5 text-etiserv-blue" />
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sucursales Asignadas
            </span>
            <div className="text-lg font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {usage?.usage.companiesUsed || companies.length} de{" "}
              {usage?.usage.companiesMax || 3}
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Estado del Tenant SaaS
            </span>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="success" dot>
                Suscripción Activa
              </Badge>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {usage?.tenant?.id || "TNT-001"}
              </span>
            </div>
          </div>
          <Building2 className="w-5 h-5 text-slate-400" />
        </Card>
      </div>

      {/* 1. MONEDA OFICIAL DEL TENANT (GLOBAL SAAS) */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-etiserv-blue/10 text-etiserv-blue">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Moneda Oficial del Tenant (Configuración Global SaaS)
                </h3>
                <Badge variant="primary">Aplica a todas las sucursales</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define la divisa contable unificada para el Punto de Venta, facturación, precios y reportes financieros de toda la organización.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-etiserv-blue"
            >
              {Object.entries(CURRENCY_CONFIGS).map(([code, conf]) => (
                <option key={code} value={code}>
                  {conf.flag} {code} - {conf.name} ({conf.symbol})
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCurrency}
              loading={savingCurrency}
              className="text-xs gap-1.5"
              glow
            >
              {currencySavedToast ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
              <span>{currencySavedToast ? "¡Guardada!" : "Guardar Moneda Global"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. SUCURSALES & EMPRESAS DEL TENANT */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-etiserv-blue" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Sucursales & Unidades de Negocio del Tenant
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Empresas activas con sus respectivas cajas registradoras y almacenes de stock
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBranchModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Sucursal
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-4"># ID</th>
                <th className="py-2.5 px-4">Razón Social / Nombre de Sucursal</th>
                <th className="py-2.5 px-4">Código / SKU</th>
                <th className="py-2.5 px-4">RFC / Tax ID</th>
                <th className="py-2.5 px-4">Moneda</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {companies.map((c) => {
                const isActiveBranch = activeCompany?.id === c.id;
                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      isActiveBranch
                        ? "bg-blue-50/40 dark:bg-blue-950/20"
                        : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      {c.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        {isActiveBranch && (
                          <Badge variant="primary" className="text-[9px] py-0">
                            Sucursal Activa
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {c.code || `SUC-${c.id}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {c.taxId || "XAXX010101000"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {currencyCode}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success" dot>
                        Operando
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isActiveBranch ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveCompany(c)}
                            className="text-[11px] py-1 px-2 gap-1"
                          >
                            <ArrowRight className="w-3 h-3 text-etiserv-blue" />
                            <span>Cambiar aquí</span>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-md">
                            ✓ En uso
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. LISTADO DE COLABORADORES & ROLES (CON TRAZABILIDAD Y BAJA SEGURA) */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-etiserv-blue" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Colaboradores & Usuarios del Tenant
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal autorizado, asignación de sucursal, activación y baja de usuarios
            </p>
          </div>
          <Badge variant="neutral">
            {collaborators.filter((c) => c.status !== "INACTIVE").length + 1} Usuarios Activos
          </Badge>
        </div>

        {/* Traceability & Audit Policy Banner */}
        <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-etiserv-blue shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-white">
              🔒 Política de Integridad & Trazabilidad de Auditoría:
            </span>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Para garantizar el cumplimiento contable y no perder la trazabilidad de tickets, facturas y movimientos de almacén, <strong>los usuarios no se eliminan de la base de datos</strong>. Se utiliza la acción <strong>Dar de Baja / Suspender</strong> para bloquear el acceso de inmediato preservando su autoría histórica.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-4">Nombre del Colaborador</th>
                <th className="py-2.5 px-4">Usuario de Acceso</th>
                <th className="py-2.5 px-4">Rol Operativo</th>
                <th className="py-2.5 px-4">Sucursal Asignada</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {/* Tenant Admin Row */}
              <tr className="bg-slate-50/40 dark:bg-white/[0.01]">
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-etiserv-blue text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user?.name?.slice(0, 2).toUpperCase() || "AD"}
                    </div>
                    <div>
                      <span>{user?.name}</span>
                      <span className="text-[10px] text-etiserv-blue font-bold ml-1.5">
                        (Tú - Super/Tenant Admin)
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500">
                  @{user?.username}
                </td>
                <td className="py-3 px-4">
                  <Badge variant="primary" dot>
                    Tenant Admin
                  </Badge>
                </td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                  Todas las sucursales del Tenant
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge variant="success" dot>
                    Activo
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right text-slate-400 text-[10px]">
                  Administrador Principal
                </td>
              </tr>

              {/* Collaborators Rows */}
              {collaborators.map((c) => {
                const meta = roleMeta[c.role] || {
                  label: c.role,
                  variant: "neutral",
                };
                const isActive = c.status !== "INACTIVE";

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      !isActive
                        ? "opacity-70 bg-rose-50/20 dark:bg-rose-950/10"
                        : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                            isActive ? "bg-slate-700" : "bg-rose-600"
                          }`}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {c.name}
                          </span>
                          {!isActive && (
                            <span className="text-[10px] text-rose-600 font-semibold">
                              Acceso bloqueado (Historial preservado)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      @{c.username}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {c.companyName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isActive ? (
                        <Badge variant="success" dot>
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="danger" dot>
                          Inactivo / Baja
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditCollaborator(c)}
                          className="p-1.5 text-slate-600 hover:text-etiserv-blue"
                          title="Editar rol y sucursal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(c)}
                          className={`gap-1 text-xs px-2.5 py-1 font-semibold ${
                            isActive
                              ? "text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                              : "text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                          }`}
                          title={
                            isActive
                              ? "Dar de baja / Suspender usuario"
                              : "Reactivar acceso del colaborador"
                          }
                        >
                          {isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Dar de Baja</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. MATRIZ DE ROLES & PERMISOS DE ACCESO (CARD INFORMATIVA) */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-etiserv-blue" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Matriz de Roles & Permisos de Acceso del Sistema
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Control de acceso basado en roles (RBAC)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(roleMeta).map(([code, meta]) => {
            const Icon = meta.icon;
            return (
              <div
                key={code}
                className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-[#071C33] border border-slate-200/60 dark:border-white/10 text-etiserv-blue shadow-xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {meta.label}
                      </span>
                    </div>
                    <Badge variant={meta.variant}>{code}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {meta.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* MODALS */}
      {/* 1. Modal Colaborador (Crear / Editar) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCollabId
            ? "Editar Colaborador & Rol"
            : "Dar de Alta Nuevo Colaborador"
        }
        maxWidth="md"
      >
        <form onSubmit={handleSaveCollaborator} className="space-y-4">
          <Input
            label="Nombre Completo"
            placeholder="Ej: Daniel Hernández"
            value={collabName}
            onChange={(e) => setCollabName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Usuario de Acceso"
              placeholder="dhernandez"
              value={collabUsername}
              onChange={(e) => setCollabUsername(e.target.value)}
              required
              disabled={!!editingCollabId}
            />
            <Input
              label={
                editingCollabId
                  ? "Nueva Contraseña (Opcional)"
                  : "Contraseña de Acceso"
              }
              type="password"
              placeholder={editingCollabId ? "Dejar en blanco para conservar" : "••••••••"}
              value={collabPassword}
              onChange={(e) => setCollabPassword(e.target.value)}
              required={!editingCollabId}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Rol Operativo Asignado"
              value={collabRole}
              onChange={(e) => setCollabRole(e.target.value as any)}
            >
              <option value="CASHIER">Cajero (POS y Arqueo)</option>
              <option value="SALES">Vendedor (B2B, POS y Cotizaciones)</option>
              <option value="ACCOUNTANT">Contador (Finanzas y CxC/CxP)</option>
              <option value="WAREHOUSE">Almacenista (Stock y Traslados)</option>
              <option value="HR">Recursos Humanos (Nómina)</option>
              <option value="TENANT_ADMIN">Tenant Admin (Acceso Total)</option>
            </Select>

            <Select
              label="Sucursal / Empresa Asignada"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code || `SUC-${c.id}`})
                </option>
              ))}
            </Select>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-[11px] text-blue-800 dark:text-blue-300">
            🔒 <strong>Control de Acceso</strong>: El colaborador iniciará sesión con su usuario y contraseña, y solo tendrá acceso a los módulos asignados a su rol en su sucursal.
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              glow
              className="flex-1"
              type="submit"
              loading={submitting}
            >
              {editingCollabId ? "Actualizar Colaborador" : "Crear Colaborador"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Nueva Sucursal */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title="Dar de Alta Nueva Sucursal / Unidad de Negocio"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <Input
            label="Nombre de la Sucursal"
            placeholder="Ej: Sucursal Guadalajara Centro"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código de Sucursal"
              placeholder="SUC-GDL"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
              required
            />
            <Input
              label="RFC / Tax ID (Opcional)"
              placeholder="XAXX010101000"
              value={branchTaxId}
              onChange={(e) => setBranchTaxId(e.target.value.toUpperCase())}
            />
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-[11px] text-emerald-800 dark:text-emerald-300">
            🏢 <strong>Aprovisionamiento Automático</strong>: Al crear la sucursal, el sistema creará automáticamente su <strong>Caja de Cobro POS</strong> y su <strong>Almacén Principal</strong> con la moneda oficial del Tenant (<code>{currencyCode}</code>).
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setBranchModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              glow
              className="flex-1"
              type="submit"
              loading={submittingBranch}
            >
              Crear Sucursal
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal Matriz de Roles */}
      <Modal
        isOpen={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
        title="Matriz de Roles & Permisos del Tenant"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            A continuación se describen los accesos y restricciones de cada rol operativo disponible en el sistema:
          </p>

          <div className="space-y-3">
            {Object.entries(roleMeta).map(([code, meta]) => {
              const Icon = meta.icon;
              return (
                <div
                  key={code}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-[#071C33] border border-slate-200/60 dark:border-white/10 text-etiserv-blue shadow-xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {meta.label}
                      </h4>
                    </div>
                    <Badge variant={meta.variant}>{code}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {meta.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex justify-end">
            <Button variant="primary" onClick={() => setRolesModalOpen(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TenantTeamView;
