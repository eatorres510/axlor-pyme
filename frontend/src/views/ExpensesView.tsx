import React, { useEffect, useState, useMemo } from "react";
import {
  Receipt,
  Plus,
  TrendingDown,
  RefreshCw,
  Building2,
  Users,
  Search,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { expensesApi } from "../api/expensesApi";
import { catalogApi, PartnerRecord } from "../api/catalogApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Autocomplete, AutocompleteItem } from "../components/ui/Autocomplete";

export const ExpensesView: React.FC = () => {
  const { activeCompany } = useCompany();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<PartnerRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<string>("RENT");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | string>("");
  const [customCreditorName, setCustomCreditorName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [taxAmount, setTaxAmount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH");
  const [createLoading, setCreateLoading] = useState(false);

  const loadExpenses = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [expData, sumData, suppData] = await Promise.all([
        expensesApi.listExpenses(activeCompany.id),
        expensesApi.getSummary(activeCompany.id),
        catalogApi.listPartners(activeCompany.id, undefined, true).catch(() => []),
      ]);
      setExpenses(expData?.expenses || expData || []);
      setSummary(sumData);

      const seen = new Set<string>();
      const uniqueSuppliers = (suppData || []).filter((s: any) => {
        const key = s.id ? String(s.id) : `${s.name}-${s.taxNbr}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setSuppliers(uniqueSuppliers);
    } catch (err) {
      console.error("Error al cargar gastos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeCompany]);

  const supplierItems: AutocompleteItem[] = useMemo(() => {
    return suppliers.map((s) => ({
      id: s.id,
      title: s.name || (s as any).fullName || `Proveedor #${s.id}`,
      subtitle: `RFC: ${s.taxNbr || "Sin RFC"} • Tel: ${s.phone || (s as any).fixedPhone || "Sin teléfono"}`,
      badge: s.taxNbr ? "RFC Válido" : undefined,
      icon: "building" as const,
    }));
  }, [suppliers]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !description || !amount) return;

    const chosenPartner = suppliers.find((s) => String(s.id) === String(selectedSupplierId));
    const finalCreditorName = customCreditorName.trim() || chosenPartner?.name || "Acreedor General";

    try {
      setCreateLoading(true);
      await expensesApi.createExpense({
        companyId: activeCompany.id,
        category,
        description,
        amount: parseFloat(amount),
        taxAmount: parseFloat(taxAmount) || 0,
        paymentMethod,
        supplierId: selectedSupplierId ? Number(selectedSupplierId) : undefined,
        creditorName: finalCreditorName,
      });
      setModalOpen(false);
      setDescription("");
      setAmount("");
      setTaxAmount("0");
      setSelectedSupplierId("");
      setCustomCreditorName("");
      loadExpenses();
    } catch (err: any) {
      alert(`Error al registrar gasto: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    RENT: "Renta de Local",
    UTILITIES: "Servicios (Luz/Agua/Net)",
    MARKETING: "Publicidad & Marketing",
    MAINTENANCE: "Mantenimiento",
    SOFTWARE: "SaaS / Software",
    LOGISTICS: "Fletes & Logística",
    OTHER: "Otros Egresos",
  };

  const filteredExpenses = expenses.filter((exp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const origin = (exp.origin || "").toLowerCase();
    const desc = (exp.description || "").toLowerCase();
    return origin.includes(q) || desc.includes(q) || String(exp.id).includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Gastos Operativos & Acreedores
            </h2>
            <Badge variant="primary">Egresos 601.01</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro de egresos asociados a Acreedores y afectación contable automática en cuenta 601.01 vs 205.01 / 201.01
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadExpenses} loading={loading} className="gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          <Button variant="primary" glow size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" /> Registrar Gasto
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Egresos Periodo
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums font-mono">
              ${summary?.totalSpent?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || "0.00"}
            </span>
          </div>
        </Card>

        <Card className="p-5 sm:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Desglose por Rubro Operativo
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(summary?.byCategory || {}).map(([cat, amt]: [string, any]) => (
              <div key={cat} className="p-2 rounded-lg bg-slate-50 dark:bg-[#061527] border border-slate-100 dark:border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block truncate font-medium">{categoryLabels[cat] || cat}</span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 tabular-nums font-mono">
                  ${Number(amt || 0).toFixed(2)}
                </span>
              </div>
            ))}
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
          placeholder="Buscar por acreedor, concepto o folio..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-etiserv-blue"
        />
      </div>

      {/* Expenses Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-etiserv-blue" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Asientos Contables de Gastos & Acreedores
            </h3>
          </div>
          <Badge variant="primary">{filteredExpenses.length} Registros</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#061527] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-5">Asiento / Folio</th>
                <th className="py-2.5 px-5">Acreedor / Proveedor</th>
                <th className="py-2.5 px-5">Concepto del Gasto</th>
                <th className="py-2.5 px-5">Fecha</th>
                <th className="py-2.5 px-5">Medio</th>
                <th className="py-2.5 px-5 text-right">Importe Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    Sin gastos registrados que coincidan con la búsqueda
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => {
                  const rawOrigin = exp.origin || exp.description || "Gasto Operativo";
                  const origin = typeof rawOrigin === 'string' ? rawOrigin : (rawOrigin?.name || "Gasto Operativo");
                  // Extract creditor if stored in [Creditor] or fallback
                  const creditorMatch = origin.match(/-\s*\[(.*?)\]:/) || origin.match(/Acreedor:\s*\[(.*?)\]/);
                  const rawCreditor = exp.creditorName || exp.supplierName || (creditorMatch ? creditorMatch[1] : (exp.partner?.name || (typeof exp.partner === 'string' ? exp.partner : "Acreedor General")));
                  const creditor = typeof rawCreditor === 'string' ? rawCreditor : (rawCreditor?.name || "Acreedor General");
                  const amountMatch = origin.match(/\$([0-9.]+)/);
                  const amountVal = amountMatch ? amountMatch[1] : "0.00";

                  return (
                    <tr key={exp.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5 font-mono text-xs font-bold text-etiserv-blue">
                        MOVE #{exp.id}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {creditor}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 font-medium text-slate-700 dark:text-slate-300">
                        {origin}
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-500 dark:text-slate-400">
                        {exp.date || exp.createdOn?.slice(0, 10) || "2026-08-29"}
                      </td>
                      <td className="py-3 px-5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                          {exp.paymentMethod || "Efectivo / Banco"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums text-rose-600 dark:text-rose-400 font-mono">
                        ${Number(amountVal).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Gasto Operativo"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-3.5">
          <Select
            label="Categoría del Gasto"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="RENT">Renta de Local Comercial</option>
            <option value="UTILITIES">Servicios Públicos (Luz / Agua / Internet / CFE)</option>
            <option value="MARKETING">Publicidad & Redes Sociales</option>
            <option value="MAINTENANCE">Mantenimiento & Reparaciones</option>
            <option value="SOFTWARE">Licencias & Software SaaS</option>
            <option value="LOGISTICS">Fletes & Envíos</option>
            <option value="OTHER">Otros Gastos Generales</option>
          </Select>

          {/* Acreedor / Proveedor de Servicios */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Acreedor / Proveedor del Servicio *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Cuenta 205.01 / 201.01</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Autocomplete
                placeholder="Buscar proveedor o empresa..."
                searchPlaceholder="Escribe para buscar proveedor..."
                items={supplierItems}
                value={selectedSupplierId}
                onChange={(item) => {
                  setSelectedSupplierId(item.id);
                  setCustomCreditorName("");
                }}
              />
              <Input
                placeholder="O escribir acreedor (ej: CFE, Gasolinera)..."
                value={customCreditorName}
                onChange={(e) => {
                  setCustomCreditorName(e.target.value);
                  if (e.target.value) setSelectedSupplierId("");
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Los gastos se asocian a un <strong>Acreedor</strong> y afectan la cuenta de pasivo correspondiente contra la cuenta de gasto operativo 601.01.
            </p>
          </div>

          <Input
            label="Descripción del Concepto *"
            placeholder="Ej: Pago de recibo de luz CFE periodo agosto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Subtotal *"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              label="IVA (Opcional)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
            />
          </div>

          <Select
            label="Forma de Pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
          >
            <option value="CASH">Efectivo (Caja Chica 101.01)</option>
            <option value="BANK">Transferencia / Banco (102.01)</option>
          </Select>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit" loading={createLoading}>
              Registrar Gasto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
