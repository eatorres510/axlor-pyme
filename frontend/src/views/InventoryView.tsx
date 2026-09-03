import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Package,
  ArrowLeftRight,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Zap,
  Search,
  CheckCircle2,
  Building2,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  PieChart,
  Warehouse,
  FileSpreadsheet,
  Layers,
  Edit3,
  FileText,
  Eye,
  Printer,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { stockApi } from "../api/stockApi";
import { catalogApi } from "../api/catalogApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { TransferVoucherModal, TransferVoucherData } from "../components/layout/TransferVoucherModal";
import { AdjustmentVoucherModal, AdjustmentVoucherData } from "../components/layout/AdjustmentVoucherModal";

interface TransferLineItem {
  productId: number;
  productName: string;
  productCode: string;
  qty: number;
  uomCode?: string;
  availableStock?: number;
}

// Modal Explorador & Buscador de Catálogo de Productos para Traslados
const CatalogBrowserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  fromWarehouseId: number;
  getStockInLocation: (prodId: number, locId: number) => number;
  onAddProduct: (product: any, qty: number) => void;
  formatCurrency: (val: number) => string;
}> = ({ isOpen, onClose, products, fromWarehouseId, getStockInLocation, onAddProduct, formatCurrency }) => {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) cats.add(p.categoryName);
    });
    return Array.from(cats);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCat !== "ALL") {
      list = list.filter((p) => p.categoryName === selectedCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.barCode && p.barCode.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, search, selectedCat]);

  const handleAdd = (prod: any) => {
    const qty = quantities[prod.id] || 5;
    onAddProduct(prod, qty);
    setAddedIds((prev) => new Set(prev).add(prod.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(prod.id);
        return next;
      });
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Explorador & Buscador de Catálogo de Productos"
      maxWidth="xl"
    >
      <div className="space-y-3.5">
        {/* Search & Filter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código SKU, código de barras o categoría..."
            className="w-full bg-slate-50 dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-etiserv-blue font-medium"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCat("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === "ALL"
                ? "bg-etiserv-blue text-white shadow-xs"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Todas ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCat === cat
                  ? "bg-etiserv-blue text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Table */}
        <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#06172A] text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-2.5 px-3">Código / SKU</th>
                <th className="py-2.5 px-3">Producto / Insumo</th>
                <th className="py-2.5 px-3">Cód. Barras</th>
                <th className="py-2.5 px-3 text-center">Stock Origen</th>
                <th className="py-2.5 px-3 text-right">PVP / Costo</th>
                <th className="py-2.5 px-3 text-center">Cant. Mover</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron productos coincidentes con "{search}".
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isAdded = addedIds.has(prod.id);
                  const currentQty = quantities[prod.id] || 5;
                  const originStock = getStockInLocation(prod.id, fromWarehouseId);
                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2 px-3">
                        <span className="font-mono font-bold text-xs text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50">
                          {prod.code || `SKU-${prod.id}`}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {prod.categoryName || "General"}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                        {prod.barCode || "—"}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${originStock > 0 ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" : "text-amber-600 bg-amber-50 dark:bg-amber-950/40"}`}>
                          {originStock} {prod.uomCode || "PZA"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(Number(prod.salePrice || 0))}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Costo: {formatCurrency(Number(prod.costPrice || prod.purchasePrice || 0))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={currentQty}
                          onChange={(e) =>
                            setQuantities({
                              ...quantities,
                              [prod.id]: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-16 text-center font-mono font-bold bg-slate-50 dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          type="button"
                          variant={isAdded ? "success" : "outline"}
                          size="sm"
                          onClick={() => handleAdd(prod)}
                          className={`text-xs py-1 px-2.5 gap-1 font-semibold ${
                            isAdded
                              ? "bg-emerald-600 text-white"
                              : "text-etiserv-blue border-blue-200 hover:bg-blue-50 dark:border-blue-900/40"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Agregado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
          <span className="text-xs text-slate-400">
            {filtered.length} productos disponibles en catálogo
          </span>
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Listo / Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Componente Searchable Product Picker para Traslados Internos con búsqueda en vivo y doble línea
const SearchableTransferRow: React.FC<{
  line: TransferLineItem;
  index: number;
  products: any[];
  fromWarehouseId: number;
  getStockInLocation: (prodId: number, locId: number) => number;
  onSelect: (index: number, product: any) => void;
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}> = ({
  line,
  index,
  products,
  fromWarehouseId,
  getStockInLocation,
  onSelect,
  onUpdateQty,
  onRemove,
  canRemove,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === line.productId);
  const availableStock = line.productId > 0 ? getStockInLocation(line.productId, fromWarehouseId) : 0;

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 15);
    const q = search.toLowerCase();
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
    <div className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2.5">
      {/* Línea 1: Identificación completa del Producto (Código SKU, Nombre sin truncar, Categoría y Botón Cambiar) */}
      <div className="relative w-full" ref={dropdownRef}>
        {selectedProduct ? (
          <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 rounded-lg p-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-md border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                {selectedProduct.code || `SKU-${selectedProduct.id}`}
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate">
                  {selectedProduct.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedProduct.categoryName || "General"} {selectedProduct.barCode ? `| Cód. Barras: ${selectedProduct.barCode}` : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setSearch("");
                }}
                className="text-[11px] font-semibold text-etiserv-blue hover:underline px-2 py-1 rounded bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Cambiar</span>
              </button>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Eliminar fila"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
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
                  className="w-full bg-slate-50 dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-etiserv-blue font-medium"
                />
              </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                  title="Eliminar fila"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dropdown flotante con resultados en vivo */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No se encontraron productos coincidentes con "{search}"
              </div>
            ) : (
              filteredProducts.map((p) => {
                const stock = getStockInLocation(p.id, fromWarehouseId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelect(index, p);
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
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${stock > 0 ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300" : "text-amber-600 bg-amber-50 dark:bg-amber-950/50"}`}>
                        Stock: {stock} {p.uomCode || "PZA"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Línea 2: Stock Disponible en Origen y Cantidad a Mover */}
      {selectedProduct && (
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-white/5 items-center">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Stock Disponible en Origen
            </label>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg block text-center ${availableStock > 0 ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" : "text-amber-600 bg-amber-50 dark:bg-amber-950/40"}`}>
              {availableStock} {selectedProduct.uomCode || "PZA"}
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Cantidad a Trasladar
            </label>
            <input
              type="number"
              min="1"
              placeholder="Cant."
              value={line.qty}
              onChange={(e) => onUpdateQty(index, parseInt(e.target.value, 10) || 1)}
              className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-center text-slate-900 dark:text-white font-bold"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const InventoryView: React.FC<{ initialTab?: "ITEMS" | "WAREHOUSES" | "TRANSFERS" | "KARDEX" }> = ({
  initialTab,
}) => {
  const { activeCompany, formatCurrency } = useCompany();
  const [stockData, setStockData] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [valuationSummary, setValuationSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"ITEMS" | "WAREHOUSES" | "TRANSFERS" | "KARDEX">(
    initialTab || "ITEMS"
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  // Product-Specific Kardex State
  const [kardexMode, setKardexMode] = useState<"BY_PRODUCT" | "ALL_MOVES">("BY_PRODUCT");
  const [selectedKardexProductId, setSelectedKardexProductId] = useState<number>(0);
  const [productKardexData, setProductKardexData] = useState<any>(null);
  const [productKardexLoading, setProductKardexLoading] = useState(false);
  const [kardexProductSearch, setKardexProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const [kardexMovements, setKardexMovements] = useState<any[]>([]);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [kardexSearch, setKardexSearch] = useState("");
  const [kardexTypeFilter, setKardexTypeFilter] = useState("ALL");
  const [kardexPage, setKardexPage] = useState(1);
  const [kardexPageSize, setKardexPageSize] = useState(25);

  // Multi-Product Internal Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [catalogBrowserOpen, setCatalogBrowserOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<number>(0);
  const [transferTo, setTransferTo] = useState<number>(0);
  const [transferDescription, setTransferDescription] = useState("Reabastecimiento y traslado interno");
  const [transferLines, setTransferLines] = useState<TransferLineItem[]>([
    { productId: 0, productName: "", productCode: "", qty: 1, uomCode: "PZA", availableStock: 0 },
  ]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const quickScanRef = useRef<HTMLDivElement>(null);

  // Quick scan live matching suggestions
  const quickScanSuggestions = useMemo(() => {
    if (!barcodeInput.trim()) return [];
    const q = barcodeInput.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.barCode && p.barCode.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [barcodeInput, products]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickScanRef.current && !quickScanRef.current.contains(e.target as Node)) {
        setIsQuickScanOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quick Stock Adjustment Modal State & Voucher
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("PHYSICAL_COUNT_SURPLUS");
  const [adjustNotes, setAdjustNotes] = useState<string>("");
  const [adjustResponsible, setAdjustResponsible] = useState<string>("Responsable de Almacén");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustmentVoucherModalOpen, setAdjustmentVoucherModalOpen] = useState(false);
  const [adjustmentVoucherData, setAdjustmentVoucherData] = useState<AdjustmentVoucherData | null>(null);

  // Transfer Voucher Modal State & History
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherData, setVoucherData] = useState<TransferVoucherData | null>(null);
  const [transfersHistorySearch, setTransfersHistorySearch] = useState("");
  const [transfersHistory, setTransfersHistory] = useState<TransferVoucherData[]>([
    {
      voucherNumber: "TRF-00078",
      companyName: "Distribuidora Nacional PyME S.A.",
      companyTaxId: "DNP190820KX1",
      date: "31/08/2026 10:45",
      fromWarehouseName: "Almacén Principal",
      fromWarehouseCode: "ALM-PRI",
      toWarehouseName: "Bodega Secundaria",
      toWarehouseCode: "ALM-SEC",
      description: "Reabastecimiento y traslado de mostrador",
      lines: [
        {
          productId: 1,
          productCode: "AGUA-500",
          productName: "Botella de Agua 500ml",
          categoryName: "Bebidas",
          qty: 10,
          uomCode: "PZA",
        },
      ],
      totalUnits: 10,
    },
  ]);

  // Pagination State
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(25);

  const loadStock = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const whId = selectedWarehouseId === "ALL" ? undefined : selectedWarehouseId;
      const [levelsRes, locs, prods, kardexRes] = await Promise.all([
        stockApi.getStockLevels(activeCompany.id, filterLowStock, whId),
        stockApi.getLocations(activeCompany.id),
        catalogApi.listProducts(activeCompany.id),
        stockApi.getKardexMovements(activeCompany.id, whId),
      ]);

      setKardexMovements(kardexRes || []);

      const items = levelsRes?.data || [];
      const summary = levelsRes?.summary || null;

      setStockData(items);
      setValuationSummary(summary);
      setLocations(locs || []);
      setProducts(prods || []);

      if (locs?.length >= 2) {
        setTransferFrom((prev) => (prev !== 0 ? prev : locs[0].id));
        setTransferTo((prev) => (prev !== 0 ? prev : locs[1].id));
      } else if (locs?.length === 1) {
        setTransferFrom(locs[0].id);
        setTransferTo(locs[0].id);
      }
    } catch (err) {
      console.error("Error al cargar inventario valorizado:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, [activeCompany, filterLowStock, selectedWarehouseId]);

  useEffect(() => {
    setStockPage(1);
  }, [searchQuery, filterLowStock, selectedWarehouseId]);

  const loadProductKardex = async (prodId: number) => {
    if (!activeCompany || !prodId) return;
    try {
      setProductKardexLoading(true);
      const whId = selectedWarehouseId === "ALL" ? undefined : selectedWarehouseId;
      const data = await stockApi.getProductKardex(activeCompany.id, prodId, whId);
      setProductKardexData(data);
      setSelectedKardexProductId(prodId);
    } catch (err) {
      console.error("Error al cargar Kardex de producto:", err);
    } finally {
      setProductKardexLoading(false);
    }
  };

  // Auto-select first product for Kardex if none selected
  useEffect(() => {
    if (products.length > 0 && selectedKardexProductId === 0) {
      const firstProdId = products[0].id;
      setSelectedKardexProductId(firstProdId);
      loadProductKardex(firstProdId);
    }
  }, [products, selectedWarehouseId]);

  useEffect(() => {
    if (selectedKardexProductId > 0) {
      loadProductKardex(selectedKardexProductId);
    }
  }, [selectedWarehouseId, activeCompany]);

  const getProductStockInLocation = (productId: number, locId: number) => {
    const found = stockData.find((s) => s.productId === productId && s.locationId === locId);
    return found ? found.currentStock : 0;
  };

  // Open Transfer modal
  const handleOpenTransferModal = () => {
    setTransferLines([
      { productId: 0, productName: "", productCode: "", qty: 1, uomCode: "PZA", availableStock: 0 },
    ]);
    setBarcodeInput("");
    setIsQuickScanOpen(false);
    setTransferModalOpen(true);
  };

  // Add line to transfer list
  const handleAddTransferLine = () => {
    setTransferLines([
      ...transferLines,
      { productId: 0, productName: "", productCode: "", qty: 1, uomCode: "PZA", availableStock: 0 },
    ]);
  };

  // Remove line from transfer list
  const handleRemoveTransferLine = (index: number) => {
    if (transferLines.length <= 1) {
      setTransferLines([
        { productId: 0, productName: "", productCode: "", qty: 1, uomCode: "PZA", availableStock: 0 },
      ]);
      return;
    }
    setTransferLines(transferLines.filter((_, i) => i !== index));
  };

  // Select product on a specific line
  const handleProductSelect = (index: number, prod: any) => {
    if (!prod) return;
    const stock = getProductStockInLocation(prod.id, transferFrom);
    const updated = [...transferLines];
    updated[index] = {
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      qty: updated[index]?.qty || 1,
      uomCode: prod.uomCode || "PZA",
      availableStock: stock,
    };
    setTransferLines(updated);
  };

  const handleAddFromCatalogBrowser = (prod: any, qty: number) => {
    const stock = getProductStockInLocation(prod.id, transferFrom);
    const existingIdx = transferLines.findIndex((l) => l.productId === prod.id);

    if (existingIdx >= 0) {
      const updated = [...transferLines];
      updated[existingIdx].qty += qty;
      setTransferLines(updated);
    } else {
      if (transferLines.length === 1 && transferLines[0].productId === 0) {
        setTransferLines([
          {
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            qty: qty,
            uomCode: prod.uomCode || "PZA",
            availableStock: stock,
          },
        ]);
      } else {
        setTransferLines([
          ...transferLines,
          {
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            qty: qty,
            uomCode: prod.uomCode || "PZA",
            availableStock: stock,
          },
        ]);
      }
    }
  };

  const handleQuickScanSelect = (prod: any) => {
    handleAddFromCatalogBrowser(prod, 1);
    setBarcodeInput("");
    setIsQuickScanOpen(false);
  };

  // Fast Barcode Scanner for transfer
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const found = products.find(
      (p) =>
        (p.barCode && p.barCode.toLowerCase() === query) ||
        (p.code && p.code.toLowerCase() === query) ||
        p.name.toLowerCase().includes(query)
    );

    if (found) {
      handleQuickScanSelect(found);
    } else {
      alert(`No se encontró producto con código o SKU: ${barcodeInput}`);
    }
  };

  // Submit Multi-Product Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    if (transferFrom === transferTo) {
      alert("El almacén de origen y el de destino deben ser diferentes.");
      return;
    }

    const validLines = transferLines.filter((l) => l.productId > 0 && l.qty > 0);
    if (validLines.length === 0) {
      alert("Debe agregar al menos 1 producto válido con cantidad mayor a cero.");
      return;
    }

    try {
      setTransferLoading(true);
      const res = await stockApi.createTransfer({
        companyId: activeCompany.id,
        fromWarehouseId: transferFrom,
        fromLocationId: transferFrom,
        toWarehouseId: transferTo,
        toLocationId: transferTo,
        items: validLines.map((l) => ({
          productId: l.productId,
          productName: l.productName || "Producto",
          qty: l.qty,
          unitPrice: 0,
        })),
        lines: validLines.map((l) => ({
          productId: l.productId,
          productName: l.productName || "Producto",
          qty: l.qty,
          unitPrice: 0,
        })),
        notes: transferDescription || "Traslado interno multi-producto",
        description: transferDescription || "Traslado interno multi-producto",
      });

      const moveId = res?.data?.stockMoveId || res?.stockMoveId || Math.floor(Math.random() * 9000 + 1000);
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("es-MX")} ${now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;

      const voucher: TransferVoucherData = {
        voucherNumber: `TRF-${String(moveId).padStart(5, "0")}`,
        companyName: activeCompany.name || "Distribuidora Nacional PyME S.A.",
        companyTaxId: activeCompany.taxId || "DNP190820KX1",
        date: formattedDate,
        fromWarehouseName: fromLocationObj?.name || `Bodega #${transferFrom}`,
        fromWarehouseCode: fromLocationObj?.code || "BOD-ORIGEN",
        toWarehouseName: toLocationObj?.name || `Bodega #${transferTo}`,
        toWarehouseCode: toLocationObj?.code || "BOD-DESTINO",
        description: transferDescription || "Reabastecimiento y traslado interno entre bodegas",
        lines: validLines.map((l) => {
          const matchedProd = products.find((p) => p.id === l.productId);
          return {
            productId: l.productId,
            productCode: l.productCode || matchedProd?.code || `SKU-${l.productId}`,
            productName: l.productName || matchedProd?.name || "Producto",
            categoryName: matchedProd?.categoryName || "General",
            qty: l.qty,
            uomCode: l.uomCode || matchedProd?.uomCode || "PZA",
          };
        }),
        totalUnits: validLines.reduce((sum, l) => sum + (l.qty || 0), 0),
      };

      setTransferModalOpen(false);
      setVoucherData(voucher);
      setTransfersHistory((prev) => [voucher, ...prev]);
      setVoucherModalOpen(true);
      loadStock();
    } catch (err: any) {
      alert(`Error en traslado: ${err.message}`);
    } finally {
      setTransferLoading(false);
    }
  };

  // Open adjustment modal
  const handleOpenAdjustModal = (item: any) => {
    setAdjustItem(item);
    setAdjustQty(item.currentStock || 0);
    setAdjustReason(item.currentStock > 0 ? "PHYSICAL_COUNT_SURPLUS" : "INITIAL_INVENTORY");
    setAdjustNotes("");
    setAdjustResponsible("Responsable de Almacén");
    setAdjustModalOpen(true);
  };

  // Submit Stock Adjustment
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !adjustItem) return;

    try {
      setAdjustLoading(true);
      const res = await stockApi.createAdjustment({
        companyId: activeCompany.id,
        warehouseId: adjustItem.locationId || locations[0]?.id || 1,
        locationId: adjustItem.locationId || locations[0]?.id || 1,
        productId: adjustItem.productId,
        productName: adjustItem.productName,
        physicalQty: adjustQty,
        reason: adjustReason,
        notes: adjustNotes,
      });

      const record: AdjustmentVoucherData = res?.data || res;
      setAdjustModalOpen(false);
      setAdjustmentVoucherData({
        ...record,
        companyName: activeCompany.name || "Distribuidora Nacional PyME S.A.",
        companyTaxId: activeCompany.taxId || "DNP190820KX1",
      });
      setAdjustmentVoucherModalOpen(true);
      await loadStock();
      if (selectedKardexProductId === adjustItem.productId) {
        loadProductKardex(adjustItem.productId);
      }
    } catch (err: any) {
      alert(`Error al ajustar stock: ${err.message}`);
    } finally {
      setAdjustLoading(false);
    }
  };

  const totalTransferUnits = transferLines
    .filter((l) => l.productId > 0)
    .reduce((sum, l) => sum + (l.qty || 0), 0);

  const fromLocationObj = locations.find((l) => l.id === transferFrom);
  const toLocationObj = locations.find((l) => l.id === transferTo);

  // Compute selected warehouse stats
  const currentWarehouseObj =
    selectedWarehouseId !== "ALL" && valuationSummary?.warehouses
      ? valuationSummary.warehouses.find((w: any) => w.warehouseId === selectedWarehouseId)
      : null;

  const displayCostValuation = currentWarehouseObj
    ? currentWarehouseObj.totalCostValuation
    : valuationSummary?.totalCompanyCostValuation || 0;

  const displaySaleValuation = currentWarehouseObj
    ? currentWarehouseObj.totalSaleValuation
    : valuationSummary?.totalCompanySaleValuation || 0;

  const displayUnits = currentWarehouseObj
    ? currentWarehouseObj.totalUnits
    : valuationSummary?.totalCompanyUnits || 0;

  const displaySkus = currentWarehouseObj
    ? currentWarehouseObj.totalSkus
    : valuationSummary?.totalActiveSkus || 0;

  const displayMargin = displaySaleValuation - displayCostValuation;
  const displayMarginPct = displaySaleValuation > 0
    ? ((displayMargin / displaySaleValuation) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Inventario & Valuación por Bodega
            </h2>
            <Badge variant="primary">Multi-Bodega LATAM</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Valoración contable al costo (PMP), valor comercial a la venta, márgenes y existencias por almacén
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filterLowStock ? "danger" : "outline"}
            size="sm"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className="gap-1.5 text-xs font-semibold"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {filterLowStock ? "Ver Todos" : `Stock Crítico (${valuationSummary?.totalCriticalItems || 0})`}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenTransferModal}
            className="gap-1.5 text-xs font-semibold"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-etiserv-blue" />
            <span>Traslado entre Bodegas</span>
          </Button>
          <Button
            variant="primary"
            glow
            size="sm"
            onClick={loadStock}
            loading={loading}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* TOP VALUATION KPI CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor al Costo */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Valor Inventario al Costo
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(displayCostValuation)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Valuación Contable PMP</span>
              {currentWarehouseObj && (
                <span className="font-bold text-etiserv-blue font-mono">
                  ({currentWarehouseObj.percentageOfTotal}% del total)
                </span>
              )}
            </p>
          </div>
        </Card>

        {/* Card 2: Valor a la Venta */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Valor a Precio de Venta
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(displaySaleValuation)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Potencial de facturación en mostrador / B2B
            </p>
          </div>
        </Card>

        {/* Card 3: Margen Proyectado */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Margen Bruto Proyectado
            </span>
            <Badge variant="success" className="font-mono text-[10px]">
              +{displayMarginPct}%
            </Badge>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(displayMargin)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Utilidad bruta estimada de existencias
            </p>
          </div>
        </Card>

        {/* Card 4: Unidades Físicas & SKUs */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Existencias Físicas
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {displayUnits.toLocaleString()} Unidades
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Distribuido en <strong className="text-slate-700 dark:text-slate-300 font-mono">{displaySkus}</strong> artículos / SKUs
            </p>
          </div>
        </Card>
      </div>

      {/* INTERACTIVE WAREHOUSE SELECTOR BAR */}
      <div className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-white/10 flex-shrink-0">
            <Warehouse className="w-4 h-4 text-etiserv-blue" />
            <span>Bodega:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedWarehouseId("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              selectedWarehouseId === "ALL"
                ? "bg-etiserv-blue text-white shadow-xs"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <span>🌐  Todas las Bodegas</span>
            <span className="text-[10px] opacity-80 font-mono">
              ({valuationSummary?.warehouses?.length || locations.length})
            </span>
          </button>

          {valuationSummary?.warehouses?.map((wh: any) => (
            <button
              key={wh.warehouseId}
              type="button"
              onClick={() => setSelectedWarehouseId(wh.warehouseId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                selectedWarehouseId === wh.warehouseId
                  ? "bg-etiserv-blue text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 opacity-80" />
              <span>{wh.warehouseName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
                {formatCurrency(wh.totalCostValuation)}
              </span>
            </button>
          ))}
        </div>

        {/* Tab switcher: ITEMS vs WAREHOUSES vs TRANSFERS view */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ITEMS")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "ITEMS"
                ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Detalle de SKUs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("WAREHOUSES")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "WAREHOUSES"
                ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Comparativa de Bodegas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TRANSFERS")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "TRANSFERS"
                ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Historial de Traslados</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("KARDEX")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "KARDEX"
                ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📋 Kardex de Movimientos ({kardexMovements.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: COMPARATIVA DE BODEGAS (CARDS GRID) */}
      {activeTab === "WAREHOUSES" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {valuationSummary?.warehouses?.map((wh: any, idx: number) => (
            <Card key={wh.warehouseId || idx} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-etiserv-blue flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {wh.warehouseName}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Código: {wh.warehouseCode}
                      </span>
                    </div>
                  </div>
                  <Badge variant="primary" className="font-mono text-xs">
                    {wh.percentageOfTotal}% Share
                  </Badge>
                </div>

                {/* Progress bar of concentration */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Concentración de Stock</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                      {wh.percentageOfTotal}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-etiserv-blue rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, wh.percentageOfTotal)}%` }}
                    />
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100/60 dark:border-white/5">
                    <span className="text-slate-500">Valor al Costo (PMP):</span>
                    <strong className="font-mono text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(wh.totalCostValuation)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100/60 dark:border-white/5">
                    <span className="text-slate-500">Valor a la Venta (PVP):</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(wh.totalSaleValuation)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100/60 dark:border-white/5">
                    <span className="text-slate-500">Margen Bruto Proyectado:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(wh.projectedMargin)}{" "}
                      <span className="text-[10px] text-emerald-600 font-bold">
                        (+{wh.projectedMarginPercent}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100/60 dark:border-white/5">
                    <span className="text-slate-500">Unidades Físicas:</span>
                    <strong className="font-mono text-slate-700 dark:text-slate-300">
                      {wh.totalUnits.toLocaleString()} piezas
                    </strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">SKUs Almacenados:</span>
                    <strong className="font-mono text-slate-700 dark:text-slate-300">
                      {wh.totalSkus} artículos
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                {wh.criticalStockCount > 0 ? (
                  <Badge variant="danger" className="text-[10px]">
                    ⚠️ {wh.criticalStockCount} Bajo Mínimo
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-[10px]">
                    ✅ Stock Equilibrado
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedWarehouseId(wh.warehouseId);
                    setActiveTab("ITEMS");
                  }}
                  className="text-xs font-semibold"
                >
                  Ver Artículos
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VIEW MODE 2: TABLA DE SKUs & EXISTENCIAS VALORIZADAS */}
      {activeTab === "ITEMS" && (() => {
        const filteredStock = stockData.filter(
          (item) =>
            (item.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.locationName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category || "").toLowerCase().includes(searchQuery.toLowerCase())
        );

        const totalItems = filteredStock.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / stockPageSize));
        const safePage = Math.min(stockPage, totalPages);
        const startIndex = (safePage - 1) * stockPageSize;
        const endIndex = Math.min(startIndex + stockPageSize, totalItems);
        const paginatedStock = filteredStock.slice(startIndex, endIndex);

        return (
          <div className="space-y-3">
            {/* Search & Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por SKU, producto, categoría o bodega..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-etiserv-blue font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-semibold">Ver:</span>
                  {[25, 50, 100, 250].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setStockPageSize(size);
                        setStockPage(1);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                        stockPageSize === size
                          ? "bg-etiserv-blue text-white shadow-xs"
                          : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-400">por pág</span>
                </div>

                <div className="text-xs text-slate-500 font-medium pl-2 border-l border-slate-200 dark:border-white/10">
                  Mostrando{" "}
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {totalItems > 0 ? startIndex + 1 : 0} - {endIndex}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {totalItems.toLocaleString()}
                  </span>{" "}
                  registros
                </div>
              </div>
            </div>

            {/* Valuation Table */}
            <Card className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-etiserv-blue" />
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Detalle Valorizado de Existencias {selectedWarehouseId !== "ALL" ? `(${currentWarehouseObj?.warehouseName})` : "(Consolidado)"}
                  </h3>
                </div>
                <Badge variant="primary">{totalItems.toLocaleString()} SKUs</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-4">Código / SKU</th>
                      <th className="py-2.5 px-4">Producto & Categoría</th>
                      <th className="py-2.5 px-4">Bodega / Almacén</th>
                      <th className="py-2.5 px-4 text-right">Existencia</th>
                      <th className="py-2.5 px-4 text-right">Costo Unit.</th>
                      <th className="py-2.5 px-4 text-right bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                        Valor al Costo
                      </th>
                      <th className="py-2.5 px-4 text-right">PVP Unit.</th>
                      <th className="py-2.5 px-4 text-right bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                        Valor Venta Total
                      </th>
                      <th className="py-2.5 px-4 text-right">Margen (%)</th>
                      <th className="py-2.5 px-4 text-center">Estado</th>
                      <th className="py-2.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {paginatedStock.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                          No se encontraron registros de existencias para los criterios seleccionados.
                        </td>
                      </tr>
                    )}
                    {paginatedStock.map((item, idx) => {
                      const costVal = Number(item.totalCostValue || (item.currentStock * (item.costPrice || 0)));
                      const saleVal = Number(item.totalSaleValue || (item.currentStock * (item.salePrice || 0)));
                      const marginPct = item.marginPercent !== undefined
                        ? item.marginPercent
                        : (saleVal > 0 ? (((saleVal - costVal) / saleVal) * 100).toFixed(1) : 0);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                          {/* SKU */}
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-etiserv-blue whitespace-nowrap">
                            {item.code || item.productCode || `PROD-${item.productId}`}
                          </td>

                          {/* Product */}
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            <div>
                              <span>{item.productName}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {item.category || "General"}
                              </span>
                            </div>
                          </td>

                          {/* Warehouse */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.locationName || "Almacén Matriz"}</span>
                            </div>
                          </td>

                          {/* Stock Qty */}
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white font-mono text-xs whitespace-nowrap">
                            {item.currentStock} {item.uomCode || "PZA"}
                          </td>

                          {/* Unit Cost */}
                          <td className="py-3 px-4 text-right tabular-nums text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                            {formatCurrency(Number(item.costPrice || 0))}
                          </td>

                          {/* Total Cost Valuation */}
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white font-mono text-xs bg-blue-50/20 dark:bg-blue-950/10 whitespace-nowrap">
                            {formatCurrency(costVal)}
                          </td>

                          {/* Unit Sale Price */}
                          <td className="py-3 px-4 text-right tabular-nums text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                            {formatCurrency(Number(item.salePrice || 0))}
                          </td>

                          {/* Total Sale Valuation */}
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400 font-mono text-xs bg-emerald-50/20 dark:bg-emerald-950/10 whitespace-nowrap">
                            {formatCurrency(saleVal)}
                          </td>

                          {/* Margin % */}
                          <td className="py-3 px-4 text-right tabular-nums font-mono text-xs whitespace-nowrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              +{marginPct}%
                            </span>
                          </td>

                          {/* Stock Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {item.isLowStock ? (
                              <Badge variant="danger" dot>
                                Bajo Mínimo ({item.currentStock}/{item.minStock || 10})
                              </Badge>
                            ) : (
                              <Badge variant="success" dot>
                                Óptimo
                              </Badge>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAdjustModal(item)}
                              className="text-[11px] py-1 px-2 font-medium"
                              title="Ajustar existencia física"
                            >
                              Ajustar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination Control */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">
                    Página <strong className="text-slate-900 dark:text-white font-mono">{safePage}</strong> de{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">{totalPages}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStockPage(1)}
                      disabled={safePage <= 1}
                      className="text-xs p-1.5"
                      title="Primera Página"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="text-xs p-1.5"
                      title="Página Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="px-3 py-1 font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-200/60 dark:bg-white/10 rounded">
                      {safePage} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStockPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="text-xs p-1.5"
                      title="Página Siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStockPage(totalPages)}
                      disabled={safePage >= totalPages}
                      className="text-xs p-1.5"
                      title="Última Página"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        );
      })()}

      {/* VIEW MODE 3: HISTORIAL DE TRASLADOS ENTRE BODEGAS */}
      {activeTab === "TRANSFERS" && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Filter & Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por folio, almacén o producto..."
                value={transfersHistorySearch}
                onChange={(e) => setTransfersHistorySearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#061527] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-etiserv-blue"
              />
            </div>

            <Button
              variant="primary"
              glow
              size="sm"
              onClick={() => setTransferModalOpen(true)}
              className="w-full sm:w-auto gap-1.5 text-xs font-semibold"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Nuevo Traslado entre Bodegas</span>
            </Button>
          </div>

          {/* Transfers History Table */}
          <div className="bg-white dark:bg-[#071C33] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Folio / Vale</th>
                    <th className="p-3.5">Fecha & Hora</th>
                    <th className="p-3.5">Origen &rarr; Destino</th>
                    <th className="p-3.5">Partidas / Productos</th>
                    <th className="p-3.5 text-right">Total Piezas</th>
                    <th className="p-3.5 text-center">Estatus</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {transfersHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No hay traslados registrados. Haz clic en "Nuevo Traslado entre Bodegas" para realizar el primero.
                      </td>
                    </tr>
                  ) : (
                    transfersHistory
                      .filter((t) => {
                        if (!transfersHistorySearch.trim()) return true;
                        const q = transfersHistorySearch.toLowerCase();
                        return (
                          t.voucherNumber.toLowerCase().includes(q) ||
                          t.fromWarehouseName.toLowerCase().includes(q) ||
                          t.toWarehouseName.toLowerCase().includes(q) ||
                          t.lines.some(
                            (l) =>
                              l.productName.toLowerCase().includes(q) ||
                              l.productCode.toLowerCase().includes(q)
                          )
                        );
                      })
                      .map((trf, idx) => (
                        <tr
                          key={trf.voucherNumber || idx}
                          className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="p-3.5 font-mono text-etiserv-blue font-bold">
                            {trf.voucherNumber}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                            {trf.date}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                              <span>{trf.fromWarehouseName}</span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {trf.toWarehouseName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {trf.description}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              {trf.lines.map((l, lIdx) => (
                                <div
                                  key={lIdx}
                                  className="text-[11px] text-slate-700 dark:text-slate-300"
                                >
                                  •{" "}
                                  <strong className="text-slate-900 dark:text-white">
                                    {l.productName}
                                  </strong>{" "}
                                  <span className="font-mono text-slate-400">
                                    ({l.qty} {l.uomCode})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-bold font-mono text-slate-900 dark:text-white">
                            {trf.totalUnits} Pzas
                          </td>
                          <td className="p-3.5 text-center">
                            <Badge variant="success" dot>
                              Completado
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVoucherData(trf);
                                setVoucherModalOpen(true);
                              }}
                              className="text-[11px] py-1 px-2.5 gap-1 font-semibold text-etiserv-blue"
                              title="Abrir vale de traslado y reimprimir con firmas"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Ver Vale</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: KARDEX DE MOVIMIENTOS HISTÓRICOS (CONSULTA POR CÓDIGO SKU & GLOBAL) */}
      {activeTab === "KARDEX" && (
        <div className="space-y-4">
          {/* Kardex Header & Mode Switcher */}
          <div className="bg-white dark:bg-[#071C33] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-etiserv-blue" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kardex Oficial de Inventario & Stock Move Lines
                </h3>
                <Badge variant="primary">Contabilizado / Valorado</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Consulta cronológica de Entradas (+), Salidas (-) y Saldos Acumulados por Código SKU o Almacén Global
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-lg flex items-center gap-1 border border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setKardexMode("BY_PRODUCT")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    kardexMode === "BY_PRODUCT"
                      ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>🔍 Consultar por Código / SKU</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKardexMode("ALL_MOVES")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    kardexMode === "ALL_MOVES"
                      ? "bg-white dark:bg-[#06172A] text-etiserv-blue shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>📋 Todos los Movimientos ({kardexMovements.length})</span>
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadStock();
                  if (selectedKardexProductId > 0) loadProductKardex(selectedKardexProductId);
                }}
                className="gap-1.5 text-xs py-1"
                title="Actualizar Kardex"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualizar</span>
              </Button>
            </div>
          </div>

          {/* MODE 1: KARDEX POR CÓDIGO DE PRODUCTO / SKU */}
          {kardexMode === "BY_PRODUCT" && (
            <div className="space-y-4">
              {/* Product Selector Bar */}
              <Card className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-etiserv-blue" />
                    <span>Seleccionar Producto / Código SKU para consultar Kardex:</span>
                  </label>

                  {/* Quick Product Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Rápidos:</span>
                    {products.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedKardexProductId(p.id);
                          loadProductKardex(p.id);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all shrink-0 ${
                          selectedKardexProductId === p.id
                            ? "bg-etiserv-blue text-white shadow-xs"
                            : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5"
                        }`}
                      >
                        {p.code || `SKU-${p.id}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Dropdown Input */}
                <div className="relative" ref={productDropdownRef}>
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      value={kardexProductSearch}
                      onChange={(e) => {
                        setKardexProductSearch(e.target.value);
                        setIsProductDropdownOpen(true);
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      placeholder="Escribe el código SKU, código de barras o nombre del producto a consultar..."
                      className="w-full pl-9 pr-24 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 text-[10px] text-slate-400 font-mono">
                      {products.length} productos
                    </span>
                  </div>

                  {isProductDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#071C33] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-white/5">
                      {(() => {
                        const q = kardexProductSearch.toLowerCase().trim();
                        const matches = products.filter((p) => {
                          if (!q) return true;
                          return (
                            (p.name && p.name.toLowerCase().includes(q)) ||
                            (p.code && p.code.toLowerCase().includes(q)) ||
                            (p.barCode && p.barCode.toLowerCase().includes(q)) ||
                            (p.categoryName && p.categoryName.toLowerCase().includes(q))
                          );
                        });

                        if (matches.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-slate-400">
                              No se encontraron productos con ese código o nombre.
                            </div>
                          );
                        }

                        return matches.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedKardexProductId(p.id);
                              loadProductKardex(p.id);
                              setKardexProductSearch("");
                              setIsProductDropdownOpen(false);
                            }}
                            className={`p-2.5 flex items-center justify-between hover:bg-blue-50/70 dark:hover:bg-blue-950/40 cursor-pointer transition-colors ${
                              selectedKardexProductId === p.id ? "bg-blue-50 dark:bg-blue-950/60" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded shrink-0">
                                {p.code || `SKU-${p.id}`}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {p.categoryName || "General"} | UOM: {p.unitName || "PZA"}
                                </span>
                              </div>
                            </div>

                            <div className="text-right font-mono text-xs pl-3">
                              <span className="text-slate-500 block text-[11px]">
                                Costo: {formatCurrency(p.costPrice || 0)}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                PVP: {formatCurrency(p.salePrice || 0)}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </Card>

              {/* Product Info & Summary KPIs */}
              {productKardexLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-etiserv-blue" />
                  <span>Cargando movimientos del Kardex...</span>
                </div>
              ) : productKardexData ? (
                <div className="space-y-4">
                  {/* Product Sheet Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-emerald-50/40 dark:from-blue-950/30 dark:via-[#071C33] dark:to-emerald-950/20 border border-blue-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold bg-etiserv-blue text-white px-2.5 py-0.5 rounded-md shadow-xs">
                          {productKardexData.product.code}
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          {productKardexData.product.name}
                        </h4>
                        <Badge variant="primary" className="text-[10px]">
                          {productKardexData.product.categoryName}
                        </Badge>
                        {productKardexData.summary.isLowStock && (
                          <Badge variant="danger" className="text-[10px] gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Stock Crítico</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        Unidad: <strong className="text-slate-700 dark:text-slate-300">{productKardexData.product.uomCode}</strong> | Costo PMP: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(productKardexData.product.costPrice)}</strong> | Precio Venta: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(productKardexData.product.salePrice)}</strong>
                      </p>
                    </div>

                    {/* Stock & Valuation Highlight */}
                    <div className="flex items-center gap-3">
                      <div className="text-right p-2.5 bg-white dark:bg-[#06172A] rounded-xl border border-slate-200/80 dark:border-white/10 font-mono">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Existencia Física Actual
                        </span>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {productKardexData.summary.currentStock} {productKardexData.product.uomCode}
                        </span>
                      </div>

                      <div className="text-right p-2.5 bg-white dark:bg-[#06172A] rounded-xl border border-slate-200/80 dark:border-white/10 font-mono">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Valuación al Costo (PMP)
                        </span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {formatCurrency(productKardexData.summary.totalCostValuation)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white dark:bg-[#071C33] rounded-xl border border-slate-200/80 dark:border-white/10 font-mono text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Inicial</span>
                      <strong className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {productKardexData.summary.initialStock} pzas
                      </strong>
                    </div>

                    <div className="p-3 bg-white dark:bg-[#071C33] rounded-xl border border-slate-200/80 dark:border-white/10 font-mono text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Entradas (+)</span>
                      <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +{productKardexData.summary.totalInflows} pzas
                      </strong>
                    </div>

                    <div className="p-3 bg-white dark:bg-[#071C33] rounded-xl border border-slate-200/80 dark:border-white/10 font-mono text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Salidas (-)</span>
                      <strong className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        -{productKardexData.summary.totalOutflows} pzas
                      </strong>
                    </div>

                    <div className="p-3 bg-white dark:bg-[#071C33] rounded-xl border border-slate-200/80 dark:border-white/10 font-mono text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Final Disponible</span>
                      <strong className="text-sm font-bold text-etiserv-blue">
                        {productKardexData.summary.currentStock} pzas
                      </strong>
                    </div>
                  </div>

                  {/* Chronological Kardex Table */}
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-etiserv-blue" />
                        <span>Libro Mayor Cronológico del Kardex ({productKardexData.ledger.length} transacciones)</span>
                      </h4>

                      <span className="text-[11px] text-slate-400 font-mono">
                        Ordenado por fecha más reciente
                      </span>
                    </div>

                    {productKardexData.ledger.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 font-mono">
                        No hay movimientos registrados para este producto todavía.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="p-3">Fecha</th>
                              <th className="p-3">Documento / Folio Origen</th>
                              <th className="p-3">Tipo Movimiento</th>
                              <th className="p-3">Almacén</th>
                              <th className="p-3 text-right text-emerald-600 dark:text-emerald-400">Entrada (+)</th>
                              <th className="p-3 text-right text-amber-600 dark:text-amber-400">Salida (-)</th>
                              <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20 text-etiserv-blue font-bold">
                                Saldo Acumulado
                              </th>
                              <th className="p-3 text-right">Valuación Saldo</th>
                              <th className="p-3 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {productKardexData.ledger.map((row: any, idx: number) => {
                              const isOutflow = row.outflowQty > 0;
                              const isInflow = row.inflowQty > 0;

                              return (
                                <tr key={row.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                    {row.date}
                                  </td>
                                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                    <span className="font-mono text-xs">{row.origin}</span>
                                  </td>
                                  <td className="p-3">
                                    {row.typeCode === "B2B_SALE" && (
                                      <Badge variant="warning" className="text-[10px] whitespace-nowrap">
                                        Salida Factura B2B
                                      </Badge>
                                    )}
                                    {row.typeCode === "POS_SALE" && (
                                      <Badge variant="warning" className="text-[10px] whitespace-nowrap">
                                        Salida Ticket POS
                                      </Badge>
                                    )}
                                    {row.typeCode === "INFLOW" && (
                                      <Badge variant="success" className="text-[10px] whitespace-nowrap">
                                        Entrada Compra / Ajuste
                                      </Badge>
                                    )}
                                    {row.typeCode === "TRANSFER" && (
                                      <Badge variant="primary" className="text-[10px] whitespace-nowrap">
                                        Traslado Bodega
                                      </Badge>
                                    )}
                                    {!["B2B_SALE", "POS_SALE", "INFLOW", "TRANSFER"].includes(row.typeCode) && (
                                      <Badge variant="neutral" className="text-[10px] whitespace-nowrap">
                                        {row.typeLabel}
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300">
                                    {row.warehouseName}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold">
                                    {isInflow ? (
                                      <span className="text-emerald-600 dark:text-emerald-400">
                                        +{row.inflowQty} pzas
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold">
                                    {isOutflow ? (
                                      <span className="text-amber-600 dark:text-amber-400">
                                        -{row.outflowQty} pzas
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-sm bg-blue-50/40 dark:bg-blue-950/20 text-etiserv-blue">
                                    {row.runningBalance} pzas
                                  </td>
                                  <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300 font-bold">
                                    {formatCurrency(row.balanceValue)}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/40">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Contabilizado</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>
              ) : null}
            </div>
          )}

          {/* MODE 2: TABLA GLOBAL DE TODOS LOS MOVIMIENTOS */}
          {kardexMode === "ALL_MOVES" && (
            <Card className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-etiserv-blue" />
                    <span>Todos los Movimientos de Inventario (StockMoveLines Globales)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Registro consolidado de salidas por venta, compras, traslados y ajustes de toda la empresa
                  </p>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={kardexSearch}
                    onChange={(e) => {
                      setKardexSearch(e.target.value);
                      setKardexPage(1);
                    }}
                    placeholder="Buscar por folio de factura, ticket, producto, SKU u origen..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={kardexTypeFilter}
                    onChange={(e) => {
                      setKardexTypeFilter(e.target.value);
                      setKardexPage(1);
                    }}
                    className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] p-2 text-slate-900 dark:text-white"
                  >
                    <option value="ALL">Todos los Tipos de Movimiento</option>
                    <option value="B2B_SALE">Salidas por Factura B2B</option>
                    <option value="POS_SALE">Salidas por Ticket POS</option>
                    <option value="INFLOW">Entradas por Compra / Ajuste (+)</option>
                    <option value="TRANSFER">Traslados entre Bodegas</option>
                  </select>
                </div>
              </div>

              {/* Kardex Table */}
              {(() => {
                let filteredKardex = kardexMovements;
                if (kardexTypeFilter !== "ALL") {
                  filteredKardex = filteredKardex.filter((m) => m.typeCode === kardexTypeFilter);
                }
                if (kardexSearch.trim()) {
                  const q = kardexSearch.toLowerCase().trim();
                  filteredKardex = filteredKardex.filter(
                    (m) =>
                      (m.origin && m.origin.toLowerCase().includes(q)) ||
                      (m.productName && m.productName.toLowerCase().includes(q)) ||
                      (m.productCode && m.productCode.toLowerCase().includes(q)) ||
                      (m.fromWarehouseName && m.fromWarehouseName.toLowerCase().includes(q))
                  );
                }

                const totalKardexItems = filteredKardex.length;
                const startKIdx = (kardexPage - 1) * kardexPageSize;
                const paginatedKardex = filteredKardex.slice(startKIdx, startKIdx + kardexPageSize);

                if (paginatedKardex.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <span>No se encontraron movimientos registrados en el Kardex con los filtros actuales.</span>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-white/10">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Documento / Origen</th>
                            <th className="p-3">Tipo Movimiento</th>
                            <th className="p-3">Almacén</th>
                            <th className="p-3">Producto & SKU</th>
                            <th className="p-3 text-right">Cantidad</th>
                            <th className="p-3 text-right">P. Unitario</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {paginatedKardex.map((m: any, idx: number) => {
                            const isOutflow = m.typeCode === "B2B_SALE" || m.typeCode === "POS_SALE" || m.typeSelect === 2;
                            const isInflow = m.typeCode === "INFLOW" || m.typeSelect === 1;
                            const isTransfer = m.typeCode === "TRANSFER" || m.typeSelect === 3;
                            const totalVal = (m.qty || 0) * (m.unitPrice || 0);

                            return (
                              <tr key={m.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {m.date}
                                </td>
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                  <span className="font-mono text-xs">{m.origin}</span>
                                </td>
                                <td className="p-3">
                                  {isOutflow && (
                                    <Badge variant="warning" className="text-[10px] whitespace-nowrap">
                                      {m.typeLabel}
                                    </Badge>
                                  )}
                                  {isInflow && (
                                    <Badge variant="success" className="text-[10px] whitespace-nowrap">
                                      {m.typeLabel}
                                    </Badge>
                                  )}
                                  {isTransfer && (
                                    <Badge variant="primary" className="text-[10px] whitespace-nowrap">
                                      {m.typeLabel}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-300 text-xs">
                                  {m.fromWarehouseName}
                                  {isTransfer && m.toWarehouseName !== m.fromWarehouseName && (
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      → {m.toWarehouseName}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {m.productName}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (m.productId) {
                                        setSelectedKardexProductId(m.productId);
                                        loadProductKardex(m.productId);
                                        setKardexMode("BY_PRODUCT");
                                      }
                                    }}
                                    className="font-mono text-[10px] text-etiserv-blue hover:underline cursor-pointer"
                                    title="Ver Kardex detallado de este código"
                                  >
                                    {m.productCode} ↗
                                  </button>
                                </td>
                                <td className="p-3 text-right font-mono font-bold">
                                  {isOutflow && (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      -{m.qty} pzas
                                    </span>
                                  )}
                                  {isInflow && (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      +{m.qty} pzas
                                    </span>
                                  )}
                                  {isTransfer && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                      ⇄ {m.qty} pzas
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-500">
                                  {formatCurrency(m.unitPrice || 0)}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(totalVal)}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/40">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Contabilizado</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-white/5">
                      <span>
                        Mostrando {startKIdx + 1} - {Math.min(startKIdx + kardexPageSize, totalKardexItems)} de {totalKardexItems} movimientos
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={kardexPage <= 1}
                          onClick={() => setKardexPage((p) => Math.max(1, p - 1))}
                          className="py-1 px-2 text-xs"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="font-mono text-xs px-2 font-bold text-slate-700 dark:text-slate-300">
                          Página {kardexPage} de {Math.max(1, Math.ceil(totalKardexItems / kardexPageSize))}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={kardexPage >= Math.ceil(totalKardexItems / kardexPageSize)}
                          onClick={() => setKardexPage((p) => p + 1)}
                          className="py-1 px-2 text-xs"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Ajuste de Existencia Física & Auditoría de Inventario"
        maxWidth="md"
      >
        {adjustItem && (() => {
          const prevStock = Number(adjustItem.currentStock || 0);
          const newQty = Number(adjustQty || 0);
          const delta = newQty - prevStock;
          const cost = Number(adjustItem.costPrice || 0);
          const impactValue = Math.abs(delta) * cost;
          const isPositive = delta > 0;
          const isNegative = delta < 0;

          return (
            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Producto:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{adjustItem.productName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Código SKU:</span>
                  <span className="font-mono text-etiserv-blue font-bold">{adjustItem.code || adjustItem.productCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Bodega / Almacén:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{adjustItem.locationName}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-500">Existencia Teórica Actual:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {prevStock} {adjustItem.uomCode || "PZA"}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-200">
                    Nueva Cantidad Física en Existencia (Conteo Real):
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Mínimo: 0 {adjustItem.uomCode || "PZA"}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 text-base font-mono font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                  required
                />
              </div>

              {/* Live Delta & Valuation Impact Preview Box */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-white/[0.02] dark:to-blue-950/20 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Diferencia Neta (Δ):</span>
                  <Badge
                    variant={isPositive ? "success" : isNegative ? "danger" : "neutral"}
                    className="gap-1 font-mono font-bold text-xs"
                  >
                    {isPositive ? `+${delta} (Entrada / Sobrante)` : isNegative ? `${delta} (Salida / Merma)` : "0 (Sin cambio)"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 dark:border-white/5 font-mono">
                  <span className="text-slate-500">Impacto Monetario Estimado:</span>
                  <strong className={`text-xs font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : isNegative ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                    {isPositive ? "+" : isNegative ? "-" : ""}${impactValue.toFixed(2)} MXN
                  </strong>
                </div>
                {isNegative && (
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/40 dark:border-white/5 flex items-center gap-1">
                    <span>🛡️ Control de Stock: Salida de {Math.abs(delta)} de {prevStock} pzas disponibles (Existencia final: {newQty} pzas).</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Motivo del Ajuste:
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                >
                  <option value="INITIAL_INVENTORY">Inventario Inicial de Apertura (+)</option>
                  <option value="PHYSICAL_COUNT_SURPLUS">Sobrante en Conteo Físico (+)</option>
                  <option value="PHYSICAL_COUNT_SHORTAGE">Faltante en Conteo Físico (-)</option>
                  <option value="DAMAGED_WASTE">Merma / Producto Dañado o Roto (-)</option>
                  <option value="EXPIRED">Caducidad / Producto Vencido (-)</option>
                  <option value="INTERNAL_CONSUMPTION">Consumo / Uso Interno de la Empresa (-)</option>
                  <option value="THEFT_LOSS">Pérdida por Robo o Extravío (-)</option>
                  <option value="ENTRY_ERROR">Corrección por Error de Captura Previa</option>
                  <option value="OTHER">Otro Ajuste Extraordinario</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Observaciones / Justificación de Auditoría:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Auditoría física de pasillo 3 / Daño de empaque..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  glow
                  size="sm"
                  type="submit"
                  loading={adjustLoading}
                  disabled={adjustQty < 0 || isNaN(adjustQty)}
                  className="gap-1.5 font-bold shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Ajuste & Emitir Vale</span>
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* OFFICIAL PRINTABLE ADJUSTMENT VOUCHER MODAL */}
      <AdjustmentVoucherModal
        isOpen={adjustmentVoucherModalOpen}
        onClose={() => {
          setAdjustmentVoucherModalOpen(false);
          setAdjustmentVoucherData(null);
        }}
        voucher={adjustmentVoucherData}
      />

      {/* MULTI-PRODUCT INTERNAL TRANSFER MODAL */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Traslado Interno de Mercancía (Multi-Producto)"
        maxWidth="xl"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {/* Warehouse Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <div>
              <Select
                label="Almacén de Origen (Salida)"
                value={transferFrom}
                onChange={(e) => {
                  const newFrom = parseInt(e.target.value, 10);
                  setTransferFrom(newFrom);
                  setTransferLines((prev) =>
                    prev.map((l) => ({
                      ...l,
                      availableStock: l.productId > 0 ? getProductStockInLocation(l.productId, newFrom) : 0,
                    }))
                  );
                }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code || "BOD"})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                label="Almacén de Destino (Entrada)"
                value={transferTo}
                onChange={(e) => setTransferTo(parseInt(e.target.value, 10))}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === transferFrom}>
                    {loc.name} ({loc.code || "BOD"}) {loc.id === transferFrom ? "(Mismo almacén)" : ""}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Quick Barcode / SKU Scanner Bar with Live Autocomplete */}
          <div className="relative" ref={quickScanRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    setIsQuickScanOpen(true);
                  }}
                  onFocus={() => {
                    if (barcodeInput.trim()) setIsQuickScanOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBarcodeSubmit(e);
                    }
                  }}
                  placeholder="📷 Escanear código de barras, SKU o escribir nombre del producto..."
                  className="w-full bg-slate-50 dark:bg-[#06172A] border border-etiserv-blue/40 rounded-xl px-3.5 py-2.5 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue font-medium"
                />
                <Zap className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                {barcodeInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setBarcodeInput("");
                      setIsQuickScanOpen(false);
                    }}
                    className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleBarcodeSubmit}
                className="text-xs px-4 font-semibold gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            {/* Quick Live Autocomplete Suggestions Dropdown */}
            {isQuickScanOpen && quickScanSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                <div className="p-2 bg-slate-50 dark:bg-[#06172A] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60 dark:border-white/5">
                  Resultados sugeridos ({quickScanSuggestions.length}) — Haz clic para agregar
                </div>
                {quickScanSuggestions.map((p) => {
                  const stock = getProductStockInLocation(p.id, transferFrom);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickScanSelect(p)}
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
                          {p.barCode && <span>• Cód. Barras: {p.barCode}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${stock > 0 ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300" : "text-amber-600 bg-amber-50 dark:bg-amber-950/50"}`}>
                          Stock: {stock} {p.uomCode || "PZA"}
                        </span>
                        <span className="text-xs text-etiserv-blue font-semibold group-hover:underline">
                          + Agregar
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Item Line Items Table (Formato Doble Línea & Searchable) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Artículos a Trasladar ({transferLines.filter((l) => l.productId > 0).length} Partidas)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCatalogBrowserOpen(true)}
                  className="text-xs py-1 px-2.5 gap-1 font-semibold text-etiserv-blue border-blue-200 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  <Search className="w-3 h-3" />
                  <span>🔍 Catálogo Completo</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTransferLine}
                  className="text-xs py-1 gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Fila Manual</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {transferLines.map((item, idx) => (
                <SearchableTransferRow
                  key={idx}
                  line={item}
                  index={idx}
                  products={products}
                  fromWarehouseId={transferFrom}
                  getStockInLocation={getProductStockInLocation}
                  onSelect={handleProductSelect}
                  onUpdateQty={(lineIdx, newQty) => {
                    const updated = [...transferLines];
                    updated[lineIdx].qty = newQty;
                    setTransferLines(updated);
                  }}
                  onRemove={handleRemoveTransferLine}
                  canRemove={transferLines.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Description & Summary */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Motivo / Referencia del Traslado
              </label>
              <input
                type="text"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="ej. Reabastecimiento de mostrador, traspaso por solicitud de cliente..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
              />
            </div>

            {/* Total Summary Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Boxes className="w-4 h-4 text-etiserv-blue" />
                <span>
                  Traspasando de <strong className="text-slate-900 dark:text-white">{fromLocationObj?.name}</strong> a{" "}
                  <strong className="text-slate-900 dark:text-white">{toLocationObj?.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">
                  Total Piezas: <strong className="text-etiserv-blue font-mono font-bold text-sm">{totalTransferUnits}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setTransferModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              glow
              size="sm"
              type="submit"
              loading={transferLoading}
              className="gap-1.5 font-semibold"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Ejecutar Traslado ({totalTransferUnits} Piezas)</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* EXPLORADOR DE CATÁLOGO MODAL PARA TRASLADOS */}
      <CatalogBrowserModal
        isOpen={catalogBrowserOpen}
        onClose={() => setCatalogBrowserOpen(false)}
        products={products}
        fromWarehouseId={transferFrom}
        getStockInLocation={getProductStockInLocation}
        onAddProduct={handleAddFromCatalogBrowser}
        formatCurrency={formatCurrency}
      />

      {/* COMPROBANTE / VALE DE TRASLADO IMPRIMIBLE */}
      <TransferVoucherModal
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        voucherData={voucherData}
      />
    </div>
  );
};

export default InventoryView;
