import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Truck,
  Layers,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Edit3,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { catalogApi } from "../api/catalogApi";
import { logisticsApi, BatchLotRecord, DeliveryNoteRecord, InventoryAdjustmentRecord } from "../api/logisticsApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

const SearchableProductSelect: React.FC<{
  label: string;
  selectedId: number;
  products: any[];
  onSelect: (product: any) => void;
  required?: boolean;
}> = ({ label, selectedId, products, onSelect, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedId);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 15);
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q) ||
        (p.barCode || "").toLowerCase().includes(q) ||
        (p.categoryName || "").toLowerCase().includes(q)
      );
    }).slice(0, 15);
  }, [search, products]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {selectedProduct ? (
          <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-2.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                {selectedProduct.code || `SKU-${selectedProduct.id}`}
              </span>
              <div className="min-w-0 flex-1 truncate font-bold text-xs text-slate-900 dark:text-white">
                {selectedProduct.name}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setSearch("");
              }}
              className="text-[11px] font-semibold text-etiserv-blue hover:underline px-2 py-1 rounded bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/30 flex items-center gap-1 shrink-0"
            >
              <Edit3 className="w-3 h-3" />
              <span>Cambiar</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="🔍 Escribe para buscar por código SKU, código de barras o nombre..."
              className="w-full bg-slate-50 dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-etiserv-blue font-medium"
            />
          </div>
        )}

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No se encontraron productos coincidentes con "{search}"
              </div>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left p-2.5 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                        {p.code || `SKU-${p.id}`}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-etiserv-blue truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-2">
                      <span>{p.categoryName || "General"}</span>
                      {p.barCode && <span>• CB: {p.barCode}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const LogisticsView: React.FC = () => {
  const { activeCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<"LOTS" | "DELIVERIES" | "ADJUSTMENTS">("LOTS");
  const [lots, setLots] = useState<BatchLotRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryNoteRecord[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustmentRecord[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nuevo Lote
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [lotProdId, setLotProdId] = useState<number>(0);
  const [lotNumber, setLotNumber] = useState("");
  const [lotQty, setLotQty] = useState("");
  const [lotExpiry, setLotExpiry] = useState("");

  // Modal Nueva Remisión
  const [delModalOpen, setDelModalOpen] = useState(false);
  const [delPartnerId, setDelPartnerId] = useState<number>(0);
  const [delDriver, setDelDriver] = useState("");
  const [delPlates, setDelPlates] = useState("");
  const [delAddress, setDelAddress] = useState("");
  const [delProdId, setDelProdId] = useState<number>(0);
  const [delQty, setDelQty] = useState("50");

  // Modal Ajuste Merma
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjProdId, setAdjProdId] = useState<number>(0);
  const [adjBeforeQty, setAdjBeforeQty] = useState("100");
  const [adjCountedQty, setAdjCountedQty] = useState("95");
  const [adjReason, setAdjReason] = useState<"ROTURA" | "MERMA" | "CONTEO_FISICO" | "CADUCIDAD">("ROTURA");
  const [adjNotes, setAdjNotes] = useState("");

  const loadData = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [lotsData, delData, adjData, prodData, partData] = await Promise.all([
        logisticsApi.listLots(activeCompany.id),
        logisticsApi.listDeliveries(activeCompany.id),
        logisticsApi.listAdjustments(activeCompany.id),
        catalogApi.listProducts(activeCompany.id),
        catalogApi.listPartners(activeCompany.id),
      ]);
      setLots(lotsData || []);
      setDeliveries(delData || []);
      setAdjustments(adjData || []);
      setProducts(prodData || []);
      setPartners(partData || []);
      if (prodData && prodData.length > 0) {
        setLotProdId(prodData[0].id);
        setDelProdId(prodData[0].id);
        setAdjProdId(prodData[0].id);
      }
      if (partData && partData.length > 0) {
        setDelPartnerId(partData[0].id);
      }
    } catch (err) {
      console.error("Error al cargar logística:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany]);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !lotProdId || !lotNumber || !lotQty || !lotExpiry) return;
    const prod = products.find((p) => p.id === Number(lotProdId));
    try {
      await logisticsApi.createLot({
        companyId: activeCompany.id,
        productId: Number(lotProdId),
        productName: prod?.name || "Producto",
        lotNumber,
        stockQty: parseFloat(lotQty),
        expiryDate: lotExpiry,
      });
      setLotModalOpen(false);
      setLotNumber("");
      setLotQty("");
      setLotExpiry("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !delPartnerId || !delDriver || !delPlates || !delAddress) return;
    const partner = partners.find((p) => p.id === Number(delPartnerId));
    const prod = products.find((p) => p.id === Number(delProdId));
    try {
      await logisticsApi.createDelivery({
        companyId: activeCompany.id,
        partnerId: Number(delPartnerId),
        partnerName: partner?.name || partner?.fullName || "Cliente",
        driverName: delDriver,
        licensePlates: delPlates,
        destinationAddress: delAddress,
        items: [{ productId: Number(delProdId), productName: prod?.name || "Producto", qty: parseFloat(delQty) }],
      });
      setDelModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !adjProdId) return;
    const prod = products.find((p) => p.id === Number(adjProdId));
    try {
      await logisticsApi.createAdjustment({
        companyId: activeCompany.id,
        productId: Number(adjProdId),
        productName: prod?.name || "Producto",
        beforeQty: parseFloat(adjBeforeQty),
        countedQty: parseFloat(adjCountedQty),
        reason: adjReason,
        notes: adjNotes,
      });
      setAdjModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Logística, Lotes & Despachos
            </h2>
            <Badge variant="primary">Fulfillment Mid-Market</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trazabilidad por lote/caducidad, remisiones de salida para choferes y auditorías de inventario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} loading={loading} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          {activeTab === "LOTS" && (
            <Button variant="primary" size="sm" onClick={() => setLotModalOpen(true)} className="gap-1.5 text-xs" glow>
              <Plus className="w-3.5 h-3.5" /> Registrar Lote & Caducidad
            </Button>
          )}
          {activeTab === "DELIVERIES" && (
            <Button variant="primary" size="sm" onClick={() => setDelModalOpen(true)} className="gap-1.5 text-xs" glow>
              <Plus className="w-3.5 h-3.5" /> Nueva Remisión de Salida
            </Button>
          )}
          {activeTab === "ADJUSTMENTS" && (
            <Button variant="primary" size="sm" onClick={() => setAdjModalOpen(true)} className="gap-1.5 text-xs" glow>
              <Plus className="w-3.5 h-3.5" /> Registrar Ajuste / Merma
            </Button>
          )}
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          onClick={() => setActiveTab("LOTS")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "LOTS"
              ? "border-etiserv-blue text-etiserv-blue font-bold"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Lotes & Caducidades ({lots.length})
        </button>
        <button
          onClick={() => setActiveTab("DELIVERIES")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "DELIVERIES"
              ? "border-etiserv-blue text-etiserv-blue font-bold"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> Remisiones de Salida ({deliveries.length})
        </button>
        <button
          onClick={() => setActiveTab("ADJUSTMENTS")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "ADJUSTMENTS"
              ? "border-etiserv-blue text-etiserv-blue font-bold"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Ajustes de Merma & Conteo ({adjustments.length})
        </button>
      </div>

      {/* Tab: Lots & Expiry */}
      {activeTab === "LOTS" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Número de Lote</th>
                  <th className="py-2.5 px-5">Producto</th>
                  <th className="py-2.5 px-5 text-right">Existencia</th>
                  <th className="py-2.5 px-5">Fecha Caducidad</th>
                  <th className="py-2.5 px-5">Días Restantes</th>
                  <th className="py-2.5 px-5 text-center">Semáforo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {lots.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-etiserv-blue">
                      {l.lotNumber}
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                      {l.productName}
                    </td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      {l.stockQty} pzas
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-slate-500">
                      {l.expiryDate}
                    </td>
                    <td className="py-3 px-5 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {l.daysRemaining} días
                    </td>
                    <td className="py-3 px-5 text-center">
                      <Badge
                        variant={l.status === "GOOD" ? "success" : l.status === "NEAR_EXPIRY" ? "warning" : "danger"}
                        dot
                      >
                        {l.status === "GOOD" ? "Vigente" : l.status === "NEAR_EXPIRY" ? "Próximo a Vencer" : "Caducado"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Deliveries */}
      {activeTab === "DELIVERIES" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Folio Remisión</th>
                  <th className="py-2.5 px-5">Destino / Cliente</th>
                  <th className="py-2.5 px-5">Chofer & Placas</th>
                  <th className="py-2.5 px-5">Fecha Salida</th>
                  <th className="py-2.5 px-5">Dirección de Entrega</th>
                  <th className="py-2.5 px-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-etiserv-blue">
                      {d.deliverySeq}
                    </td>
                    <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                      {d.partnerName}
                    </td>
                    <td className="py-3 px-5 text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{d.driverName}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{d.licensePlates}</span>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-slate-500">
                      {d.departureDate}
                    </td>
                    <td className="py-3 px-5 text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={d.destinationAddress}>
                      {d.destinationAddress}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <Badge variant={d.status === "DELIVERED" ? "success" : "warning"} dot>
                        {d.status === "DELIVERED" ? "Entregado" : "En Tránsito"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Adjustments */}
      {activeTab === "ADJUSTMENTS" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Fecha</th>
                  <th className="py-2.5 px-5">Producto</th>
                  <th className="py-2.5 px-5">Motivo</th>
                  <th className="py-2.5 px-5 text-right">Físico Contado</th>
                  <th className="py-2.5 px-5 text-right">Diferencia</th>
                  <th className="py-2.5 px-5">Cuenta Contable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-slate-500">{a.date}</td>
                    <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">{a.productName}</td>
                    <td className="py-3 px-5">
                      <Badge variant="warning">{a.reason}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      {a.countedQty}
                    </td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-rose-600">
                      {a.difference}
                    </td>
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-etiserv-blue">
                      {a.accountCode} (Mermas)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: New Lot */}
      <Modal isOpen={lotModalOpen} onClose={() => setLotModalOpen(false)} title="Registrar Lote & Fecha de Caducidad" maxWidth="md">
        <form onSubmit={handleCreateLot} className="space-y-3.5">
          <SearchableProductSelect
            label="Producto para Asignar Lote"
            selectedId={lotProdId}
            products={products}
            onSelect={(p) => setLotProdId(p.id)}
            required
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Código / Número de Lote" placeholder="LOTE-2026-B44" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} required />
            <Input label="Cantidad de Entrada" type="number" placeholder="100" value={lotQty} onChange={(e) => setLotQty(e.target.value)} required />
          </div>
          <Input label="Fecha de Caducidad / Vencimiento" type="date" value={lotExpiry} onChange={(e) => setLotExpiry(e.target.value)} required />

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setLotModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" glow className="flex-1" type="submit">Guardar Lote</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Delivery */}
      <Modal isOpen={delModalOpen} onClose={() => setDelModalOpen(false)} title="Generar Remisión de Salida (Despacho)" maxWidth="md">
        <form onSubmit={handleCreateDelivery} className="space-y-3.5">
          <Select label="Cliente / Destinatario" value={delPartnerId} onChange={(e) => setDelPartnerId(Number(e.target.value))} required>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name || p.fullName}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Nombre del Chofer" placeholder="Armando Paredes" value={delDriver} onChange={(e) => setDelDriver(e.target.value)} required />
            <Input label="Placas del Vehículo" placeholder="NKL-4589" value={delPlates} onChange={(e) => setDelPlates(e.target.value)} required />
          </div>
          <Input label="Dirección de Entrega" placeholder="Av. Central 890, Bodega 4" value={delAddress} onChange={(e) => setDelAddress(e.target.value)} required />
          <div className="space-y-2.5">
            <SearchableProductSelect
              label="Producto a Despachar"
              selectedId={delProdId}
              products={products}
              onSelect={(p) => setDelProdId(p.id)}
              required
            />
            <Input label="Cantidad a Despachar" type="number" value={delQty} onChange={(e) => setDelQty(e.target.value)} required />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setDelModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" glow className="flex-1" type="submit">Emitir Guía de Remisión</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Adjustment */}
      <Modal isOpen={adjModalOpen} onClose={() => setAdjModalOpen(false)} title="Registrar Ajuste Físico de Inventario / Merma" maxWidth="md">
        <form onSubmit={handleCreateAdjustment} className="space-y-3.5">
          <SearchableProductSelect
            label="Producto a Ajustar"
            selectedId={adjProdId}
            products={products}
            onSelect={(p) => setAdjProdId(p.id)}
            required
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Stock Teórico Actual" type="number" value={adjBeforeQty} onChange={(e) => setAdjBeforeQty(e.target.value)} required />
            <Input label="Físico Contado Real" type="number" value={adjCountedQty} onChange={(e) => setAdjCountedQty(e.target.value)} required />
          </div>
          <Select label="Motivo de Ajuste" value={adjReason} onChange={(e) => setAdjReason(e.target.value as any)}>
            <option value="ROTURA">Rotura / Daño en Almacén</option>
            <option value="MERMA">Merma Operativa</option>
            <option value="CADUCIDAD">Producto Caducado</option>
            <option value="CONTEO_FISICO">Diferencia de Conteo Cíclico</option>
          </Select>
          <Input label="Observaciones" placeholder="Justificación para auditoría contable" value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} />

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setAdjModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" glow className="flex-1" type="submit">Aplicar Asiento de Ajuste</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
