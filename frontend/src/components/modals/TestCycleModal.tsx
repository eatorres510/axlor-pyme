import React, { useState } from "react";
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Boxes,
  Truck,
  FileText,
  RotateCcw,
  PlusCircle,
  Users,
  Landmark,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface StepItem {
  step: number;
  name: string;
  category: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  details: string;
  durationMs: number;
}

interface TestReport {
  executionId: string;
  timestamp: string;
  totalDurationMs: number;
  overallStatus: "SUCCESS" | "WARNING" | "FAILED";
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  steps: StepItem[];
  summary: {
    purchaseOrderSeq?: string;
    transferSeq?: string;
    quoteSeq?: string;
    invoiceSeq?: string;
    creditNoteSeq?: string;
    debitNoteSeq?: string;
    payrollPeriod?: string;
    treasuryBalanceTotal?: number;
  };
}

interface TestCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestCycleModal: React.FC<TestCycleModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.post<{ success: boolean; data: TestReport }>("/test/run-full-cycle", {
        companyId: user?.activeCompanyId || 13,
      });
      if (res.data?.data) {
        setReport(res.data.data);
      }
    } catch (err: any) {
      setError(err.message || "Error al ejecutar el ciclo de prueba");
    } finally {
      setRunning(false);
    }
  };

  const getStepIcon = (category: string) => {
    switch (category) {
      case "COMPRAS":
        return <Boxes className="w-4 h-4 text-amber-500" />;
      case "INVENTARIO":
        return <Boxes className="w-4 h-4 text-emerald-500" />;
      case "TRASLADOS":
        return <Truck className="w-4 h-4 text-blue-500" />;
      case "VENTAS":
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case "DEVOLUCIONES":
        return <RotateCcw className="w-4 h-4 text-rose-500" />;
      case "NOTAS_DEBITO":
        return <PlusCircle className="w-4 h-4 text-purple-500" />;
      case "NOMINA":
        return <Users className="w-4 h-4 text-cyan-500" />;
      case "TESORERIA":
        return <Landmark className="w-4 h-4 text-emerald-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Ciclo de Prueba Integral End-to-End
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  8 Fases
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoría en tiempo real: Compras → Inventario → Traslados → Ventas → Devoluciones → Notas Crédito/Débito → Nómina → Tesorería
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Trigger Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/40 dark:from-[#0B2B4C] dark:to-[#071C33] border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                {report ? "Volver a Ejecutar Ciclo Completo" : "Iniciar Validación del Circuito"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Genera transacciones reales conectadas con cálculo de saldos y asientos sin datos en duro.
              </p>
            </div>

            <Button
              onClick={handleRunTest}
              disabled={running}
              variant="primary"
              className="gap-2 px-5 py-2.5 shadow-md shadow-etiserv-blue/20 flex-shrink-0"
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ejecutando 8 Fases...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{report ? "Re-ejecutar Ciclo" : "Ejecutar Ciclo 360°"}</span>
                </>
              )}
            </Button>
          </div>

          {/* Execution Results */}
          {report && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Global</span>
                  <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{report.overallStatus} (100%)</span>
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tiempo Total</span>
                  <strong className="text-sm font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{report.totalDurationMs} ms</span>
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pasos Exitosos</span>
                  <strong className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {report.passedSteps} de {report.totalSteps}
                  </strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Tesorería</span>
                  <strong className="text-sm font-mono font-bold text-etiserv-blue mt-0.5 block">
                    ${(report.summary.treasuryBalanceTotal || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Step By Step List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Trazabilidad Detallada de las 8 Fases
                </h4>

                <div className="space-y-2">
                  {report.steps.map((st) => (
                    <div
                      key={st.step}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#06172A] flex items-start gap-3.5 shadow-sm"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 flex-shrink-0 mt-0.5">
                        {getStepIcon(st.category)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                            {st.name}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-400">
                            {st.durationMs} ms
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {st.details}
                        </p>
                      </div>

                      <div className="flex-shrink-0 pt-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          OK
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {report ? `Última ejecución: ${new Date(report.timestamp).toLocaleTimeString()}` : "Listo para iniciar ciclo"}
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
