import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ShoppingBag,
  Plus,
  CheckCircle,
  PackageCheck,
  RefreshCw,
  Trash2,
  RotateCcw,
  Search,
  Zap,
  Lock,
  Unlock,
  ChevronDown,
  FileText,
  Truck,
  Receipt,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Edit3,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { purchasingApi } from "../api/purchasingApi";
import { catalogApi } from "../api/catalogApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Autocomplete, AutocompleteItem } from "../components/ui/Autocomplete";
import { StatusStepper } from "../components/layout/StatusStepper";

// Modal Explorador & Buscador de Catálogo de Productos
const CatalogBrowserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onAddProduct: (product: any, qty: number) => void;
  formatCurrency: (val: number) => string;
}> = ({ isOpen, onClose, products, onAddProduct, formatCurrency }) => {
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
    const qty = quantities[prod.id] || 10;
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
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3 text-right">Costo Base</th>
                <th className="py-2.5 px-3 text-center">Cant.</th>
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
                  const currentQty = quantities[prod.id] || 10;
                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2 px-3">
                        <span className="font-mono text-[10px] font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/30">
                          {prod.code || `SKU-${prod.id}`}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {prod.name}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                        {prod.barCode || "—"}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {prod.categoryName || "General"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(Number(prod.costPrice || prod.purchasePrice || 20))}
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

// Componente Searchable Product Picker para compras con columna explícita de Código / SKU
const SearchablePurchaseRow: React.FC<{
  line: { productId: number; qty: number; unitPrice: number };
  index: number;
  products: any[];
  onSelect: (index: number, product: any) => void;
  onUpdateQty: (index: number, qty: number) => void;
  onUpdatePrice: (index: number, price: number) => void;
  onRemove: (index: number) => void;
  formatCurrency: (val: number) => string;
}> = ({
  line,
  index,
  products,
  onSelect,
  onUpdateQty,
  onUpdatePrice,
  onRemove,
  formatCurrency,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === line.productId);

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

  const lineTotal = (line.qty || 1) * (line.unitPrice || 0);

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
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block leading-snug break-words">
                  {selectedProduct.name}
                </span>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                  {selectedProduct.categoryName && (
                    <span className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.2 rounded font-sans text-slate-500">
                      {selectedProduct.categoryName}
                    </span>
                  )}
                  {selectedProduct.barCode && <span>CB: {selectedProduct.barCode}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setSearch("");
                }}
                className="text-xs text-etiserv-blue hover:underline font-semibold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1"
                title="Cambiar producto seleccionado"
              >
                🔄 Cambiar
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Eliminar partida"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="🔍 Escribe código SKU o nombre del producto..."
              className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-etiserv-blue font-medium"
              autoFocus
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No se encontraron productos con "{search}"
              </div>
            ) : (
              filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(index, p);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                        {p.code || `SKU-${p.id}`}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {p.categoryName ? `Cat: ${p.categoryName} • ` : ""}Código de Barras: {p.barCode || "Sin código"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">Costo Base</span>
                    <strong className="font-mono text-emerald-600 text-xs">
                      {formatCurrency(Number(p.costPrice || p.purchasePrice || 0))}
                    </strong>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Línea 2: Controles de Cantidad, Costo Unitario y Subtotal */}
      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-white/5 items-center">
        {/* Cantidad */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Cantidad
          </label>
          <input
            type="number"
            min="1"
            placeholder="Cant."
            value={line.qty}
            onChange={(e) => onUpdateQty(index, parseInt(e.target.value, 10) || 1)}
            className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-center text-slate-900 dark:text-white font-bold"
            title="Cantidad a ordenar"
          />
        </div>

        {/* Costo Unitario */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Costo Unitario ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Costo"
            value={line.unitPrice}
            onChange={(e) => onUpdatePrice(index, parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-right text-slate-900 dark:text-white font-semibold"
            title="Costo unitario pactado con proveedor"
          />
        </div>

        {/* Total Partida */}
        <div className="text-right">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Partida
          </label>
          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white pt-1">
            {formatCurrency(lineTotal)}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PurchasingViewProps {
  initialTab?: "ORDERS" | "RECEIPTS" | "INVOICES";
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ initialTab = "ORDERS" }) => {
  const { activeCompany, formatCurrency } = useCompany();
  const [activeTab, setActiveTab] = useState<"ORDERS" | "RECEIPTS" | "INVOICES">(initialTab);
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [orders, setOrders] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Filter for Orders
  const [statusFilter, setStatusFilter] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Catalog Browser Modal State
  const [catalogBrowserOpen, setCatalogBrowserOpen] = useState(false);
  const [catalogBrowserTarget, setCatalogBrowserTarget] = useState<"PO" | "INVOICE">("PO");

  // Order Detail & Edit Modal State
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [isEditingDraftOrder, setIsEditingDraftOrder] = useState(false);
  const [editOrderLines, setEditOrderLines] = useState<Array<{ productId: number; qty: number; unitPrice: number }>>([]);
  const [editSupplierId, setEditSupplierId] = useState<number>(0);
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Receipt Detail Modal State
  const [receiptDetailModalOpen, setReceiptDetailModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Vendor Invoice Detail Modal State
  const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // New Purchase Order Modal State
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<number>(0);
  const [isSupplierUnlocked, setIsSupplierUnlocked] = useState(false);
  const [orderLines, setOrderLines] = useState<Array<{ productId: number; qty: number; unitPrice: number }>>([]);
  const [quickScanInput, setQuickScanInput] = useState("");
  const [quickScanDropdownOpen, setQuickScanDropdownOpen] = useState(false);
  const quickScanRef = useRef<HTMLDivElement>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Supplier Return Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<Array<{ productId: number; productName: string; qty: number; unitPrice: number }>>([]);
  const [returnReason, setReturnReason] = useState<"MERCANCIA_DANADA" | "ERROR_SURTIDO" | "EXCESO_INVENTARIO" | "OTRO">("MERCANCIA_DANADA");
  const [returnNotes, setReturnNotes] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // New Vendor Invoice / Direct Purchase Modal State
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [invoiceSupplierId, setInvoiceSupplierId] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [autoReceiveStock, setAutoReceiveStock] = useState(true);
  const [invoiceWarehouseId, setInvoiceWarehouseId] = useState(1);
  const [invoiceLotNumber, setInvoiceLotNumber] = useState("");
  const [quickScanInvoiceInput, setQuickScanInvoiceInput] = useState("");
  const [quickScanInvoiceDropdownOpen, setQuickScanInvoiceDropdownOpen] = useState(false);
  const quickScanInvoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceLines, setInvoiceLines] = useState<Array<{ productId: number; productName: string; productCode?: string; qty: number; unitPrice: number; lotNumber?: string }>>([]);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickScanRef.current && !quickScanRef.current.contains(e.target as Node)) {
        setQuickScanDropdownOpen(false);
      }
      if (quickScanInvoiceRef.current && !quickScanInvoiceRef.current.contains(e.target as Node)) {
        setQuickScanInvoiceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quick Scan live filter (Matches by Code, SKU, Name, Barcode, Category)
  const quickScanFilteredProducts = useMemo(() => {
    if (!quickScanInput.trim()) return [];
    const q = quickScanInput.toLowerCase().trim();
    return products.filter((p) => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.barCode && p.barCode.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }).slice(0, 12);
  }, [quickScanInput, products]);

  // Quick Scan Invoice live filter
  const quickScanInvoiceFilteredProducts = useMemo(() => {
    if (!quickScanInvoiceInput.trim()) return [];
    const q = quickScanInvoiceInput.toLowerCase().trim();
    return products.filter((p) => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.barCode && p.barCode.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }).slice(0, 12);
  }, [quickScanInvoiceInput, products]);

  const handleAddProductToOrder = (prod: any, qty: number = 10) => {
    if (!prod) return;
    const existingIdx = orderLines.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...orderLines];
      updated[existingIdx].qty += qty;
      setOrderLines(updated);
    } else {
      if (orderLines.length === 1 && orderLines[0].productId === 0) {
        setOrderLines([
          {
            productId: prod.id,
            qty: qty,
            unitPrice: Number(prod.costPrice || prod.purchasePrice || 20),
          },
        ]);
      } else {
        setOrderLines([
          ...orderLines,
          {
            productId: prod.id,
            qty: qty,
            unitPrice: Number(prod.costPrice || prod.purchasePrice || 20),
          },
        ]);
      }
    }
    setQuickScanInput("");
    setQuickScanDropdownOpen(false);
  };

  const handleAddProductToInvoice = (prod: any, qty: number = 10) => {
    if (!prod) return;
    const existingIdx = invoiceLines.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...invoiceLines];
      updated[existingIdx].qty += qty;
      setInvoiceLines(updated);
    } else {
      setInvoiceLines([
        ...invoiceLines,
        {
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code || `SKU-${prod.id}`,
          qty: qty,
          unitPrice: Number(prod.costPrice || prod.purchasePrice || 20),
          lotNumber: invoiceLotNumber,
        },
      ]);
    }
    setQuickScanInvoiceInput("");
    setQuickScanInvoiceDropdownOpen(false);
  };

  const loadData = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [ordersData, receiptsData, invoicesData, suppData, prodData] = await Promise.all([
        purchasingApi.listOrders(activeCompany.id),
        purchasingApi.listReceipts(activeCompany.id),
        purchasingApi.listVendorInvoices(activeCompany.id),
        catalogApi.listPartners(activeCompany.id, "SUPPLIER"),
        catalogApi.listProducts(activeCompany.id),
      ]);
      setOrders(ordersData || []);
      setReceipts(receiptsData || []);
      setInvoices(invoicesData || []);
      setSuppliers(suppData || []);
      setProducts(prodData || []);
      if (suppData?.length > 0 && !selectedSupplier) {
        setSelectedSupplier(suppData[0].id);
        setInvoiceSupplierId(suppData[0].id);
      }
    } catch (err) {
      console.error("Error al cargar datos de compras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany]);

  const supplierItems: AutocompleteItem[] = suppliers.map((s) => ({
    id: s.id,
    title: s.name || s.fullName,
    subtitle: `RFC: ${s.taxNbr || "Sin RFC"} | ${s.email || "Sin email"}`,
    badge: s.taxNbr ? "RFC Válido" : undefined,
  }));

  const handleProductSelect = (index: number, prod: any) => {
    if (!prod) return;
    const updated = [...orderLines];
    updated[index] = {
      productId: prod.id,
      qty: updated[index]?.qty || 10,
      unitPrice: Number(prod.costPrice || prod.purchasePrice || 20),
    };
    setOrderLines(updated);
  };

  const handleAddLine = () => {
    if (products.length > 0) {
      setOrderLines([
        ...orderLines,
        { productId: 0, qty: 10, unitPrice: 0 },
      ]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    if (orderLines.length <= 1) {
      setOrderLines([{ productId: 0, qty: 10, unitPrice: 0 }]);
      setIsSupplierUnlocked(false);
      return;
    }
    setOrderLines(orderLines.filter((_, i) => i !== idx));
  };

  // Quick Barcode / SKU Scanner in Purchase Order Modal
  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanInput.trim()) return;

    if (quickScanFilteredProducts.length === 1) {
      handleAddProductToOrder(quickScanFilteredProducts[0], 10);
      return;
    }

    if (quickScanFilteredProducts.length > 1) {
      setQuickScanDropdownOpen(true);
      return;
    }

    const q = quickScanInput.trim().toLowerCase();
    const found = products.find(
      (p) =>
        (p.barCode && p.barCode.toLowerCase() === q) ||
        (p.code && p.code.toLowerCase() === q) ||
        (p.name && p.name.toLowerCase() === q)
    );

    if (found) {
      handleAddProductToOrder(found, 10);
    } else {
      setQuickScanDropdownOpen(true);
      alert(`No se encontró producto exacto con: "${quickScanInput}". Puedes buscar en el catálogo.`);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedSupplier) return;

    const validLines = orderLines.filter((l) => l.productId > 0);
    if (validLines.length === 0) {
      alert("Debe agregar al menos 1 producto válido a la orden de compra.");
      return;
    }

    try {
      setCreateLoading(true);
      const itemsPayload = validLines.map((l) => {
        const prod = products.find((p) => p.id === l.productId);
        return {
          productId: l.productId,
          productName: prod?.name || "Producto / Insumo",
          qty: l.qty,
          unitPrice: l.unitPrice,
        };
      });

      await purchasingApi.createOrder({
        companyId: activeCompany.id,
        supplierId: selectedSupplier,
        items: itemsPayload,
        lines: itemsPayload,
        notes: orderNotes || "Orden de compra de abastecimiento PyME",
      });
      alert("¡Orden de compra generada exitosamente!");
      setNewOrderModalOpen(false);
      setOrderNotes("");
      setIsSupplierUnlocked(false);
      setOrderLines([{ productId: 0, qty: 10, unitPrice: 0 }]);
      loadData();
    } catch (err: any) {
      alert(`Error al crear orden: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    try {
      await purchasingApi.confirmOrder(orderId);
      loadData();
    } catch (err: any) {
      alert(`Error al confirmar orden: ${err.message}`);
    }
  };

  const handleReceiveOrder = async (orderId: number) => {
    try {
      const res = await purchasingApi.receiveOrder(orderId);
      alert(`¡Mercancía recibida en almacén exitosamente! Generada remisión de entrada ${res.receiptSeq || "REC-ALM"}.`);
      loadData();
    } catch (err: any) {
      alert(`Error al recibir mercancía: ${err.message}`);
    }
  };

  const handleGenerateInvoiceFromOrder = async (orderId: number) => {
    try {
      const res = await purchasingApi.generateInvoiceFromOrder(orderId);
      alert(`¡Factura de proveedor ${res.invoiceSeq} generada contra Orden de Compra! Registrada en Cuentas por Pagar.`);
      loadData();
      setActiveTab("INVOICES");
    } catch (err: any) {
      alert(`Error al generar factura de compra: ${err.message}`);
    }
  };

  const handleOpenOrderDetail = async (order: any, startInEditMode = false) => {
    try {
      let fullOrder = order;
      if (typeof order.id === "number" || typeof order.id === "string") {
        try {
          const fetched = await purchasingApi.getOrder(Number(order.id));
          if (fetched) fullOrder = fetched;
        } catch {}
      }

      setSelectedOrderDetail(fullOrder);

      // Prepare edit state if draft
      const rawLines = fullOrder.purchaseOrderLineList || fullOrder.lines || fullOrder.items || [];
      const mappedLines = rawLines.map((l: any) => ({
        productId: l.product?.id || l.productId || 0,
        qty: l.qty || l.quantity || 1,
        unitPrice: Number(l.price || l.unitPrice || 0),
      }));

      setEditOrderLines(mappedLines.length > 0 ? mappedLines : [{ productId: 0, qty: 10, unitPrice: 0 }]);
      setEditSupplierId(fullOrder.supplierPartner?.id || fullOrder.supplierId || (suppliers[0]?.id || 0));
      setEditNotes(fullOrder.internalNote || fullOrder.notes || "");
      setIsEditingDraftOrder(startInEditMode && fullOrder.statusSelect === 1);
      setOrderDetailModalOpen(true);
    } catch (err: any) {
      alert(`Error al abrir detalle de la orden: ${err.message}`);
    }
  };

  const handleSaveEditedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderDetail) return;

    const validLines = editOrderLines.filter((l) => l.productId > 0);
    if (validLines.length === 0) {
      alert("Debe incluir al menos 1 artículo en la orden.");
      return;
    }

    try {
      setEditSaving(true);
      const itemsPayload = validLines.map((l) => {
        const prod = products.find((p) => p.id === l.productId);
        return {
          productId: l.productId,
          productName: prod?.name || "Producto / Insumo",
          qty: l.qty,
          unitPrice: l.unitPrice,
        };
      });

      const updated = await purchasingApi.updateOrder(selectedOrderDetail.id, {
        supplierId: editSupplierId,
        items: itemsPayload,
        notes: editNotes,
      });

      setSelectedOrderDetail(updated);
      setIsEditingDraftOrder(false);
      loadData();
      alert("¡Orden de compra actualizada exitosamente!");
    } catch (err: any) {
      alert(`Error al guardar cambios: ${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteDraftOrder = async (orderId: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar y eliminar esta orden de compra en borrador?")) {
      return;
    }
    try {
      setDeletingOrder(true);
      await purchasingApi.deleteOrder(orderId);
      setOrderDetailModalOpen(false);
      setSelectedOrderDetail(null);
      loadData();
      alert("Orden de compra en borrador eliminada.");
    } catch (err: any) {
      alert(`Error al eliminar borrador: ${err.message}`);
    } finally {
      setDeletingOrder(false);
    }
  };

  const handleOpenReceiptDetail = (receipt: any) => {
    setSelectedReceipt(receipt);
    setReceiptDetailModalOpen(true);
  };

  const handleOpenInvoiceDetail = (invoice: any) => {
    setSelectedInvoice(invoice);
    setInvoiceDetailModalOpen(true);
  };

  const handleOpenReturnModal = (order: any) => {
    setSelectedReturnOrder(order);
    setReturnReason("MERCANCIA_DANADA");
    setReturnNotes("");
    if (products.length > 0) {
      setReturnItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          qty: 1,
          unitPrice: Number(products[0].costPrice || products[0].purchasePrice || 20),
        },
      ]);
    } else {
      setReturnItems([]);
    }
    setReturnModalOpen(true);
  };

  const handleAddReturnLine = () => {
    if (products.length > 0) {
      setReturnItems([
        ...returnItems,
        {
          productId: products[0].id,
          productName: products[0].name,
          qty: 1,
          unitPrice: Number(products[0].costPrice || products[0].purchasePrice || 20),
        },
      ]);
    }
  };

  const handleRemoveReturnLine = (idx: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== idx));
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnOrder || returnItems.length === 0) return;

    try {
      setSubmittingReturn(true);
      await purchasingApi.returnOrder(selectedReturnOrder.id, {
        reason: returnReason,
        items: returnItems,
        notes: returnNotes,
      });
      alert("¡Devolución a proveedor registrada exitosamente! Se ajustaron las existencias y cuenta por pagar.");
      setReturnModalOpen(false);
      setSelectedReturnOrder(null);
      loadData();
    } catch (err: any) {
      alert(`Error al procesar devolución: ${err.message}`);
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Quick Scan for Direct Purchase / Vendor Invoice
  const handleQuickScanInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanInvoiceInput.trim()) return;

    if (quickScanInvoiceFilteredProducts.length === 1) {
      handleAddProductToInvoice(quickScanInvoiceFilteredProducts[0], 10);
      return;
    }

    if (quickScanInvoiceFilteredProducts.length > 1) {
      setQuickScanInvoiceDropdownOpen(true);
      return;
    }

    const q = quickScanInvoiceInput.trim().toLowerCase();
    const found = products.find(
      (p) =>
        (p.barCode && p.barCode.toLowerCase() === q) ||
        (p.code && p.code.toLowerCase() === q) ||
        (p.name && p.name.toLowerCase() === q)
    );

    if (found) {
      handleAddProductToInvoice(found, 10);
    } else {
      setQuickScanInvoiceDropdownOpen(true);
      alert(`No se encontró producto exacto con: "${quickScanInvoiceInput}". Puedes buscar en el catálogo.`);
    }
  };

  // Create Manual Vendor Invoice / Direct Purchase
  const handleOpenNewInvoiceModal = () => {
    if (suppliers.length > 0) setInvoiceSupplierId(suppliers[0].id);
    setInvoiceNumber(`FAC-${Math.floor(10000 + Math.random() * 90000)}`);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setInvoiceDueDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setAutoReceiveStock(true);
    setInvoiceWarehouseId(1);
    const initialLot = `LOTE-2026-${Math.floor(100 + Math.random() * 900)}`;
    setInvoiceLotNumber(initialLot);
    setQuickScanInvoiceInput("");

    if (products.length > 0) {
      setInvoiceLines([
        {
          productId: products[0].id,
          productName: products[0].name,
          productCode: products[0].code || `SKU-${products[0].id}`,
          qty: 10,
          unitPrice: Number(products[0].costPrice || products[0].purchasePrice || 20),
          lotNumber: initialLot,
        },
      ]);
    } else {
      setInvoiceLines([]);
    }
    setInvoiceNotes("");
    setNewInvoiceModalOpen(true);
  };

  const handleCreateVendorInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !invoiceSupplierId || invoiceLines.length === 0) {
      alert("Debe seleccionar un proveedor y agregar al menos 1 producto.");
      return;
    }

    const supp = suppliers.find((s) => s.id === invoiceSupplierId);
    try {
      setSubmittingInvoice(true);
      const res = await purchasingApi.createVendorInvoice({
        companyId: activeCompany.id,
        supplierId: invoiceSupplierId,
        supplierName: supp?.name || supp?.fullName || "Proveedor",
        supplierTaxNbr: supp?.taxNbr || "XAXX010101000",
        invoiceNumber,
        invoiceDate,
        dueDate: invoiceDueDate,
        autoReceive: autoReceiveStock,
        warehouseId: invoiceWarehouseId,
        lotNumber: invoiceLotNumber,
        items: invoiceLines,
        notes: invoiceNotes,
      });

      if (autoReceiveStock && res.receiptSeq) {
        alert(
          `¡Compra Directa Registrada y Cargada a Inventario Exitosamente!\n\n` +
          `🧾 Factura Proveedor (CxP): ${res.invoiceSeq} (${invoiceNumber})\n` +
          `📥 Entrada de Almacén: ${res.receiptSeq}\n` +
          `📑 Orden de Compra: ${res.orderNumber || "Generada"}\n\n` +
          `Las existencias de bodega y costos unitarios fueron actualizados de inmediato.`
        );
      } else {
        alert(`¡Factura de proveedor ${res.invoiceSeq} registrada exitosamente en Cuentas por Pagar!`);
      }

      setNewInvoiceModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error al registrar compra: ${err.message}`);
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "ALL" || o.statusSelect === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.purchaseOrderSeq && o.purchaseOrderSeq.toLowerCase().includes(q)) ||
        (o.supplierPartner?.name && o.supplierPartner.name.toLowerCase().includes(q)) ||
        (o.supplierName && o.supplierName.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Live Calculations for Purchase Order Modal
  const validOrderLines = orderLines.filter((l) => l.productId > 0);
  const purchaseSubtotal = validOrderLines.reduce((sum, l) => sum + (l.qty || 1) * (l.unitPrice || 0), 0);
  const purchaseTax = purchaseSubtotal * 0.16;
  const purchaseGrandTotal = purchaseSubtotal + purchaseTax;

  // Supplier Lock Condition
  const isSupplierLocked = validOrderLines.length > 0 && !isSupplierUnlocked;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Compras & Abastecimiento
            </h2>
            <Badge variant="primary">Procurement ERP</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Flujo simétrico de compras: Orden de Compra → Recepción en Almacén → Factura Proveedor (CxP)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            loading={loading}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </Button>
          <Button
            variant="primary"
            glow
            size="sm"
            onClick={handleOpenNewInvoiceModal}
            className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
            title="Registrar factura directa y cargar existencias de inmediato a inventario"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Compra Rápida Directa</span>
          </Button>
          {activeTab === "ORDERS" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOrderLines([{ productId: 0, qty: 10, unitPrice: 0 }]);
                setQuickScanInput("");
                setIsSupplierUnlocked(false);
                setNewOrderModalOpen(true);
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Orden de Compra</span>
            </Button>
          )}
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("ORDERS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "ORDERS"
              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Órdenes de Compra (PO)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RECEIPTS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "RECEIPTS"
              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Recepciones de Almacén</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
            {receipts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("INVOICES")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "INVOICES"
              ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Facturas de Compra (CxP)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
            {invoices.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ÓRDENES DE COMPRA (PO) */}
      {activeTab === "ORDERS" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Estado:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "ALL"
                    ? "bg-etiserv-blue text-white shadow-xs"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Todas ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 1
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Borrador ({orders.filter((o) => o.statusSelect === 1).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(2)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 2
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Confirmadas ({orders.filter((o) => o.statusSelect === 2).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(3)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 3
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                Recibidas ({orders.filter((o) => o.statusSelect === 3).length})
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por folio OC o proveedor..."
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3.5">
            {filteredOrders.length === 0 && !loading && (
              <Card className="p-8 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No se encontraron órdenes de compra con los filtros seleccionados</p>
                <p className="text-xs text-slate-400 mt-1">Haz clic en "+ Nueva Orden de Compra" para emitir un pedido de abastecimiento.</p>
              </Card>
            )}

            {filteredOrders.map((order) => {
              const supplierName = order.supplierPartner?.name || order.supplierPartner?.fullName || order.supplierName || "Proveedor";
              const orderTotal = Number(order.inTaxTotal || order.totalAmount || order.exTaxTotal * 1.16 || 0);
              const orderFolio =
                order.orderNumber ||
                order.purchaseOrderSeq ||
                order.orderSeq ||
                (typeof order.id === "string" && order.id.startsWith("OC-") ? order.id : `OC-2026-${String(order.id).padStart(5, "0")}`);

              return (
                <Card
                  key={order.id}
                  className="p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group"
                  onClick={() => handleOpenOrderDetail(order, false)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrderDetail(order, false);
                          }}
                          className="font-mono font-bold text-sm text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40 hover:underline flex items-center gap-1"
                          title="Clic para abrir y ver detalle completo"
                        >
                          <Eye className="w-3.5 h-3.5 inline text-etiserv-blue" />
                          <span>{orderFolio}</span>
                        </button>
                        <Badge
                          variant={
                            order.statusSelect === 3 ? "success" : order.statusSelect === 2 ? "primary" : "warning"
                          }
                        >
                          {order.statusSelect === 1 ? "Borrador" : order.statusSelect === 2 ? "Confirmada" : "Recibida en Almacén"}
                        </Badge>
                        {order.receiptSeq && (
                          <Badge variant="success" className="text-[10px] gap-1 font-mono">
                            <PackageCheck className="w-3 h-3 inline" />
                            {order.receiptSeq}
                          </Badge>
                        )}
                        {(order.invoiceSeq || order.isInvoiced) && (
                          <Badge variant="primary" className="text-[10px] gap-1 font-mono">
                            <Receipt className="w-3 h-3 inline" />
                            {order.invoiceSeq || "Facturada CxP"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {supplierName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Fecha: {order.orderDate || order.creationDate || new Date().toISOString().slice(0, 10)}
                        </span>
                        <span>•</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Total: {formatCurrency(orderTotal)}
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Botón Ver Detalle en todos los estados */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenOrderDetail(order, false)}
                        className="text-xs gap-1 text-slate-600 dark:text-slate-300 hover:text-etiserv-blue"
                        title="Ver detalle completo de partidas y productos"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ver Detalle</span>
                      </Button>

                      {order.statusSelect === 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenOrderDetail(order, true)}
                            className="text-xs gap-1 text-etiserv-blue border-etiserv-blue/40 font-semibold"
                            title="Editar cantidades, proveedor o productos"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-etiserv-blue" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            variant="primary"
                            glow
                            size="sm"
                            onClick={() => handleConfirmOrder(order.id)}
                            className="text-xs gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirmar Pedido</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraftOrder(order.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Eliminar borrador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {order.statusSelect === 2 && (
                        <>
                          <Button
                            variant="primary"
                            glow
                            size="sm"
                            onClick={() => handleReceiveOrder(order.id)}
                            className="text-xs gap-1.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Recibir en Almacén</span>
                          </Button>
                          {!order.isInvoiced && !order.invoiceSeq ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateInvoiceFromOrder(order.id)}
                              className="text-xs gap-1.5"
                              title="Generar Factura de Proveedor (CxP)"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-500" />
                              <span>Generar Factura CxP</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab("INVOICES")}
                              className="text-xs gap-1.5 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40"
                              title="Ver Factura de Proveedor registrada"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-500" />
                              <span>Ver Factura CxP</span>
                            </Button>
                          )}
                        </>
                      )}
                      {order.statusSelect === 3 && (
                        <>
                          {!order.isInvoiced && !order.invoiceSeq ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateInvoiceFromOrder(order.id)}
                              className="text-xs gap-1.5"
                              title="Generar Factura de Proveedor (CxP)"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-500" />
                              <span>Generar Factura CxP</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab("INVOICES")}
                              className="text-xs gap-1.5 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40"
                              title="Ver Factura de Proveedor registrada"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-500" />
                              <span>Ver Factura CxP</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReturnModal(order)}
                            className="text-xs gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Devolver Mercancía</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Stepper */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                    <StatusStepper
                      steps={[
                        { id: 1, label: "Borrador" },
                        { id: 2, label: "Confirmada" },
                        { id: 3, label: "Recibida en Almacén" },
                      ]}
                      currentStepIndex={(order.statusSelect || 1) - 1}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RECEPCIONES DE ALMACÉN */}
      {activeTab === "RECEIPTS" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Historial de Recepciones de Mercancía & Control de Lotes
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {receipts.length} Entradas registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Folio Entrada</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Orden Origen</th>
                  <th className="py-3 px-4">Bodega / Almacén</th>
                  <th className="py-3 px-4">Partidas & Lotes</th>
                  <th className="py-3 px-4 text-center">Cant. Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No hay recepciones de almacén registradas. Al recibir una orden de compra se generará su remisión de entrada.
                    </td>
                  </tr>
                )}
                {receipts.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => handleOpenReceiptDetail(rec)}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReceiptDetail(rec);
                        }}
                        className="font-mono font-bold text-xs text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/30 hover:underline flex items-center gap-1"
                        title="Clic para ver detalle de recepción"
                      >
                        <Eye className="w-3 h-3 inline text-etiserv-blue" />
                        <span>{rec.receiptSeq || rec.id}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {rec.receiptDate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {rec.supplierName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {rec.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {rec.warehouseName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {rec.items?.map((it: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{it.productName}</span>
                            <span className="font-mono text-slate-400">({it.qtyReceived} u.)</span>
                            {it.lotNumber && (
                              <span className="font-mono text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded">
                                {it.lotNumber}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {rec.totalQty} u.
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success">Recibido en Bodega</Badge>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReceiptDetail(rec)}
                        className="text-[11px] py-1 px-2.5 gap-1 text-slate-600 dark:text-slate-300"
                      >
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>Ver</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: FACTURAS DE COMPRA (CXP) */}
      {activeTab === "INVOICES" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Facturas de Compra & Causación de Cuentas por Pagar (CxP)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {invoices.length} Facturas registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Folio Fiscal CxP</th>
                  <th className="py-3 px-4">Factura Prov.</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Orden Origen</th>
                  <th className="py-3 px-4">Emisión</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado Pago</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      No hay facturas de proveedor registradas. Puedes registrar una con el botón "+ Registrar Factura Proveedor".
                    </td>
                  </tr>
                )}
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => handleOpenInvoiceDetail(inv)}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInvoiceDetail(inv);
                        }}
                        className="font-mono font-bold text-xs text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/30 hover:underline flex items-center gap-1"
                        title="Clic para ver detalle de factura"
                      >
                        <Eye className="w-3 h-3 inline text-etiserv-blue" />
                        <span>{inv.invoiceSeq || inv.id}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {inv.vendorInvoiceNumber || "S/F"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>{inv.supplierName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{inv.supplierTaxNbr}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <div>{inv.orderNumber || "Directa"}</div>
                      {inv.receiptSeq && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5" title="Entrada a inventario autogenerada">
                          <PackageCheck className="w-3 h-3 inline" />
                          <span>{inv.receiptSeq}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(inv.subtotal || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.totalAmount || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={inv.status === "PAID" ? "success" : "warning"}>
                        {inv.status === "PAID" ? "Liquidada" : "Pendiente Pago"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenInvoiceDetail(inv)}
                        className="text-[11px] py-1 px-2.5 gap-1 text-slate-600 dark:text-slate-300"
                      >
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>Ver</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: NUEVA ORDEN DE COMPRA (CON BUSCADOR Y SELECTOR EXPLÍCITO DE SKU) */}
      <Modal
        isOpen={newOrderModalOpen}
        onClose={() => setNewOrderModalOpen(false)}
        title="Crear Nueva Orden de Compra de Abastecimiento"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {/* Supplier Selection with Enllave / Lock */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSupplierLocked ? (
                  <Badge variant="primary" className="text-[10px] gap-1 font-mono font-bold">
                    <Lock className="w-3 h-3 text-white inline" /> Proveedor Enllavado ({validOrderLines.length} {validOrderLines.length === 1 ? "artículo agregado" : "artículos agregados"})
                  </Badge>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-slate-400 inline" /> Proveedor & Datos de Compra
                  </span>
                )}
              </div>

              {isSupplierLocked && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("⚠️ Desbloquear el proveedor permitirá cambiarlo. ¿Deseas continuar?")) {
                      setIsSupplierUnlocked(true);
                    }
                  }}
                  className="text-xs text-etiserv-blue hover:underline font-semibold flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Desbloquear / Cambiar Proveedor</span>
                </button>
              )}
            </div>

            <Autocomplete
              label="Proveedor"
              placeholder="Escribe el nombre, empresa o RFC del proveedor..."
              items={supplierItems}
              value={selectedSupplier}
              disabled={isSupplierLocked}
              onChange={(item) => {
                setSelectedSupplier(Number(item.id));
                setIsSupplierUnlocked(false);
              }}
              autoFocus={!isSupplierLocked}
              required
            />
          </div>

          {/* Quick Scanner & SKU Bar with Live Dropdown and Catalog Browser Button */}
          <div className="relative" ref={quickScanRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickScanInput}
                  onChange={(e) => {
                    setQuickScanInput(e.target.value);
                    setQuickScanDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (quickScanInput.trim()) setQuickScanDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleQuickScanSubmit(e);
                    }
                    if (e.key === "Escape") {
                      setQuickScanDropdownOpen(false);
                    }
                  }}
                  placeholder="⚡ Buscar por nombre, código SKU o escanear código de barras..."
                  className="w-full bg-slate-50 dark:bg-[#06172A] border border-etiserv-blue/40 rounded-xl px-3.5 py-2 pl-9 pr-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-etiserv-blue font-medium"
                  autoComplete="off"
                />
                <Zap className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
                {quickScanInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickScanInput("");
                      setQuickScanDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCatalogBrowserTarget("PO");
                  setCatalogBrowserOpen(true);
                }}
                className="text-xs px-3 font-semibold gap-1.5 text-etiserv-blue border-blue-200 hover:bg-blue-50 dark:border-blue-900/40 dark:hover:bg-blue-950/40"
                title="Abrir explorador y catálogo completo de productos"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Explorar Catálogo</span>
              </Button>
            </div>

            {/* Live Autocomplete Dropdown List */}
            {quickScanDropdownOpen && quickScanFilteredProducts.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Coincidencias ({quickScanFilteredProducts.length})</span>
                  <span className="font-normal lowercase">Clic para agregar (10 u.)</span>
                </div>
                {quickScanFilteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProductToOrder(p, 10)}
                    className="w-full text-left p-2.5 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-between text-xs group"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/30">
                          {p.code || `SKU-${p.id}`}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-etiserv-blue">
                          {p.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                        {p.categoryName && <span>Cat: {p.categoryName}</span>}
                        {p.barCode && <span>CB: {p.barCode}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 block">Costo Base</span>
                        <strong className="font-mono text-emerald-600 text-xs">
                          {formatCurrency(Number(p.costPrice || p.purchasePrice || 20))}
                        </strong>
                      </div>
                      <span className="text-xs bg-etiserv-blue text-white px-2.5 py-1 rounded-lg font-bold group-hover:scale-105 transition-transform flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Agregar
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items Table in Modal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Partidas de la Orden ({validOrderLines.length} Insumos/Productos)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="text-xs py-1 gap-1"
              >
                <Plus className="w-3 h-3" /> Fila Manual
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {orderLines.map((line, idx) => (
                <SearchablePurchaseRow
                  key={idx}
                  line={line}
                  index={idx}
                  products={products}
                  onSelect={handleProductSelect}
                  onUpdateQty={(i, qty) => {
                    const updated = [...orderLines];
                    updated[i].qty = qty;
                    setOrderLines(updated);
                  }}
                  onUpdatePrice={(i, price) => {
                    const updated = [...orderLines];
                    updated[i].unitPrice = price;
                    setOrderLines(updated);
                  }}
                  onRemove={handleRemoveLine}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 text-slate-500">
              <div>
                Subtotal de Compra: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(purchaseSubtotal)}</strong>
              </div>
              <div>
                IVA Trasladado (16%): <span className="font-mono">{formatCurrency(purchaseTax)}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                Total Orden de Compra: <span className="text-etiserv-blue">{formatCurrency(purchaseGrandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Notas & Instrucciones de Entrega para Proveedor
            </label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="ej. Entregar en bodega principal de 8:00 a 14:00 hrs..."
              className="w-full bg-slate-50 dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-etiserv-blue"
            />
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setNewOrderModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              glow
              className="flex-1"
              type="submit"
              loading={createLoading}
            >
              Generar Orden de Compra
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: COMPRA RÁPIDA DIRECTA / REGISTRAR FACTURA DE PROVEEDOR (CXP) */}
      <Modal
        isOpen={newInvoiceModalOpen}
        onClose={() => setNewInvoiceModalOpen(false)}
        title="⚡ Compra Rápida Directa & Factura Proveedor (CxP)"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateVendorInvoice} className="space-y-4">
          {/* Informative Banner */}
          <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-etiserv-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Flujo Directo de Abastecimiento PyME</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Ingresa la factura del proveedor de una sola vez. Se genera la Factura (CxP), la remisión de entrada a bodega (REC-ALM) y se incrementan las existencias en inventario al instante.
              </p>
            </div>
          </div>

          {/* Supplier & Invoice Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Autocomplete
                label="Proveedor (Búsqueda Inteligente)"
                placeholder="Selecciona o busca un proveedor..."
                searchPlaceholder="Escribe nombre, empresa, RFC o razón social..."
                items={suppliers.map((s) => ({
                  id: s.id,
                  title: s.name || s.fullName || `Proveedor #${s.id}`,
                  subtitle: `RFC: ${s.taxNbr || "Sin RFC"} • Tel: ${s.phone || s.fixedPhone || "Sin teléfono"}`,
                  badge: s.taxNbr ? "RFC Válido" : undefined,
                  icon: "building" as const,
                }))}
                value={invoiceSupplierId}
                onChange={(item) => setInvoiceSupplierId(Number(item.id))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Número / Folio Factura Proveedor
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="ej. F-98214"
                required
                className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Fecha de Emisión
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Fecha de Vencimiento de Pago
              </label>
              <input
                type="date"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
                className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Tipo de Compra Selector: Mercancía vs Servicio/Gasto */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tipo de Compra / Concepto
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAutoReceiveStock(true)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  autoReceiveStock
                    ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500"
                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <PackageCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${autoReceiveStock ? "text-emerald-600" : "text-slate-400"}`} />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>📦 Mercancía / Insumo</span>
                    {autoReceiveStock && <Badge variant="success" className="text-[9px] px-1 py-0">Inventariable</Badge>}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Afecta existencias, genera remisión REC-ALM y actualiza costo en bodega.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAutoReceiveStock(false)}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  !autoReceiveStock
                    ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500"
                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${!autoReceiveStock ? "text-blue-600" : "text-slate-400"}`} />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>🛠️ Servicio / Gasto Operativo</span>
                    {!autoReceiveStock && <Badge variant="primary" className="text-[9px] px-1 py-0">No Inventariable</Badge>}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Fletes, honorarios, renta, luz o gastos. Genera CxP sin mover almacén.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Warehouse & Lot Options when Goods (Stockable) is selected */}
          {autoReceiveStock && (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-500" />
                  Datos de Entrada a Almacén (REC-ALM Automática)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  Incrementará Existencias
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-emerald-200/40 dark:border-emerald-900/20">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Bodega / Almacén Destino
                  </label>
                  <select
                    value={invoiceWarehouseId}
                    onChange={(e) => setInvoiceWarehouseId(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    <option value={1}>Bodega Principal Toluca</option>
                    <option value={2}>Almacén General de Distribución</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Número de Lote (Opcional)
                  </label>
                  <input
                    type="text"
                    value={invoiceLotNumber}
                    onChange={(e) => setInvoiceLotNumber(e.target.value)}
                    placeholder="ej. LOTE-2026-001"
                    className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {!autoReceiveStock && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>
                  Esta factura se registrará como gasto en <strong>Cuentas por Pagar (CxP)</strong> sin alterar existencias de inventario en almacén.
                </span>
              </div>

              {/* Quick Expense Concepts Chips */}
              <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1">
                  ⚡ Conceptos Rápidos de Gastos & Servicios:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: "Energía Eléctrica (Suministro CFE)", code: "SRV-ENERGIA", price: 1200 },
                    { name: "Combustible & Gasolina", code: "SRV-COMB-GAS", price: 500 },
                    { name: "Internet & Telefonía Empresarial", code: "SRV-INTERNET", price: 850 },
                    { name: "Servicio de Flete & Logística", code: "SRV-FLT-LOC", price: 350 },
                    { name: "Renta de Local / Inmueble", code: "SRV-RENTA-LOCAL", price: 15000 },
                    { name: "Honorarios Contables & Asesoría", code: "SRV-HON-CONT", price: 4000 },
                    { name: "Mantenimiento & Reparación", code: "SRV-MANT-PREV", price: 650 },
                    { name: "Papelería & Insumos Oficina", code: "SRV-PAPEL-OFIC", price: 350 },
                  ].map((srv, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        const matchedProd = products.find((p) => p.code === srv.code) || products[0];
                        const newLine = {
                          productId: matchedProd?.id || 14,
                          productName: srv.name,
                          productCode: srv.code,
                          qty: 1,
                          unitPrice: srv.price,
                        };
                        if (
                          invoiceLines.length === 1 &&
                          (invoiceLines[0].productName === "Producto" || invoiceLines[0].unitPrice === 20)
                        ) {
                          setInvoiceLines([newLine]);
                        } else {
                          setInvoiceLines([...invoiceLines, newLine]);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#071C33] border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-2xs"
                    >
                      + {srv.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Scanner for Products */}
          {autoReceiveStock && (
            <div className="relative" ref={quickScanInvoiceRef}>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={quickScanInvoiceInput}
                    onChange={(e) => {
                      setQuickScanInvoiceInput(e.target.value);
                      setQuickScanInvoiceDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (quickScanInvoiceInput.trim()) setQuickScanInvoiceDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickScanInvoiceSubmit(e);
                      }
                      if (e.key === "Escape") {
                        setQuickScanInvoiceDropdownOpen(false);
                      }
                    }}
                    placeholder="⚡ Buscar por nombre, código SKU o escanear código de barras..."
                    className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 pr-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue font-medium"
                    autoComplete="off"
                  />
                  {quickScanInvoiceInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickScanInvoiceInput("");
                        setQuickScanInvoiceDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCatalogBrowserTarget("INVOICE");
                    setCatalogBrowserOpen(true);
                  }}
                  className="text-xs px-3 font-semibold gap-1 text-etiserv-blue border-blue-200 hover:bg-blue-50 dark:border-blue-900/40"
                  title="Abrir explorador de catálogo"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explorar Catálogo</span>
                </Button>
              </div>

              {/* Live Autocomplete Dropdown List for Direct Purchase */}
              {quickScanInvoiceDropdownOpen && quickScanInvoiceFilteredProducts.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Coincidencias ({quickScanInvoiceFilteredProducts.length})</span>
                    <span className="font-normal lowercase">Clic para agregar (10 u.)</span>
                  </div>
                  {quickScanInvoiceFilteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddProductToInvoice(p, 10)}
                      className="w-full text-left p-2.5 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-between text-xs group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/30">
                            {p.code || `SKU-${p.id}`}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-etiserv-blue">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                          {p.categoryName && <span>Cat: {p.categoryName}</span>}
                          {p.barCode && <span>CB: {p.barCode}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <span className="text-[9px] text-slate-400 block">Costo Base</span>
                          <strong className="font-mono text-emerald-600 text-xs">
                            {formatCurrency(Number(p.costPrice || p.purchasePrice || 20))}
                          </strong>
                        </div>
                        <span className="text-xs bg-etiserv-blue text-white px-2.5 py-1 rounded-lg font-bold group-hover:scale-105 transition-transform flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Agregar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lines Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                {autoReceiveStock ? "Partidas & Artículos de la Compra" : "Conceptos del Servicio / Gasto"} ({invoiceLines.length} Conceptos)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    setInvoiceLines([
                      ...invoiceLines,
                      {
                        productId: products[0].id,
                        productName: products[0].name,
                        productCode: products[0].code || `SKU-${products[0].id}`,
                        qty: 1,
                        unitPrice: Number(products[0].costPrice || products[0].purchasePrice || 20),
                        lotNumber: invoiceLotNumber,
                      },
                    ]);
                  }
                }}
                className="text-xs font-semibold text-etiserv-blue hover:underline"
              >
                + Agregar Partida
              </button>
            </div>

            {invoiceLines.map((line, idx) => {
              const lineTotal = (line.qty || 1) * (line.unitPrice || 0);
              const prod = products.find((p) => p.id === line.productId);
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2.5"
                >
                  {/* Fila 1: Producto / Servicio selector o badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {autoReceiveStock ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                            {line.productCode || (prod?.code ? prod.code : `SKU-${line.productId}`)}
                          </span>
                          <select
                            value={line.productId}
                            onChange={(e) => {
                              const prodId = parseInt(e.target.value, 10);
                              const selectedP = products.find((p) => p.id === prodId);
                              const updated = [...invoiceLines];
                              updated[idx].productId = prodId;
                              updated[idx].productName = selectedP?.name || "Producto";
                              updated[idx].productCode = selectedP?.code || `SKU-${prodId}`;
                              updated[idx].unitPrice = Number(selectedP?.costPrice || selectedP?.purchasePrice || 20);
                              setInvoiceLines(updated);
                            }}
                            className="w-full text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-1.5 text-slate-900 dark:text-white truncate"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.categoryName ? `(${p.categoryName})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40 shrink-0">
                            GASTO / SERVICIO
                          </span>
                          <input
                            type="text"
                            value={line.productName}
                            onChange={(e) => {
                              const updated = [...invoiceLines];
                              updated[idx].productName = e.target.value;
                              setInvoiceLines(updated);
                            }}
                            placeholder="Descripción o detalle del servicio / gasto..."
                            className="flex-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-1.5 text-slate-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {invoiceLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setInvoiceLines(invoiceLines.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                        title="Eliminar partida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fila 2: Cantidad, Costo Unitario y Subtotal */}
                  <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-white/5 items-center">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) => {
                          const updated = [...invoiceLines];
                          updated[idx].qty = parseInt(e.target.value, 10) || 1;
                          setInvoiceLines(updated);
                        }}
                        placeholder="Cant."
                        className="w-full text-xs font-mono text-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1.5 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Costo Unitario ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => {
                          const updated = [...invoiceLines];
                          updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setInvoiceLines(updated);
                        }}
                        placeholder="Costo"
                        className="w-full text-xs font-mono text-right rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1.5 text-slate-900 dark:text-white font-semibold"
                      />
                    </div>

                    <div className="text-right">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Total Partida
                      </label>
                      <div className="text-sm font-mono font-bold text-slate-900 dark:text-white pt-1">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes & Totals Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Observaciones / Notas
              </label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Notas de la compra directa..."
                className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-etiserv-blue"
              />
            </div>

            {/* Totals Breakdown */}
            {(() => {
              const subtotal = invoiceLines.reduce((s, it) => s + (it.qty || 1) * (it.unitPrice || 0), 0);
              const tax = subtotal * 0.16;
              const total = subtotal + tax;

              return (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>IVA (16%):</span>
                    <span className="font-mono">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                    <span>Total a Pagar:</span>
                    <span className="font-mono text-sm text-etiserv-blue">{formatCurrency(total)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => setNewInvoiceModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              glow
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              type="submit"
              loading={submittingInvoice}
            >
              {autoReceiveStock ? "⚡ Registrar Compra y Cargar a Inventario" : "Registrar Factura Proveedor"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DEVOLUCIÓN A PROVEEDOR */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedReturnOrder(null);
        }}
        title={`Devolución a Proveedor - Orden ${selectedReturnOrder?.orderNumber || selectedReturnOrder?.id || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-100 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Proveedor Destino
            </span>
            <div className="font-semibold text-sm text-slate-900 dark:text-white">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                {selectedReturnOrder?.supplierPartner?.name || selectedReturnOrder?.supplierPartner?.fullName || "Proveedor"}
              </span>
            </div>
          </div>

          <Select
            label="Motivo de Devolución"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value as any)}
          >
            <option value="MERCANCIA_DANADA">Mercancía Dañada / Defectuosa</option>
            <option value="ERROR_SURTIDO">Error en Surtido del Proveedor</option>
            <option value="EXCESO_INVENTARIO">Exceso de Inventario / Cancelación</option>
            <option value="OTRO">Otro Motivo</option>
          </Select>

          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Productos a Devolver (Salida Física de Almacén)
              </label>
              <button
                type="button"
                onClick={handleAddReturnLine}
                className="text-xs font-semibold text-etiserv-blue hover:underline"
              >
                + Agregar Producto
              </button>
            </div>

            {returnItems.map((line, idx) => {
              const prod = products.find((p) => p.id === line.productId);
              const lineTotal = (line.qty || 1) * (line.unitPrice || 0);
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2.5"
                >
                  {/* Fila 1: Selector / Identificación del Producto */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200/80 dark:border-rose-900/50 shrink-0">
                        {prod?.code || `SKU-${line.productId}`}
                      </span>
                      <select
                        value={line.productId}
                        onChange={(e) => {
                          const prodId = parseInt(e.target.value, 10);
                          const selectedP = products.find((p) => p.id === prodId);
                          const newLines = [...returnItems];
                          newLines[idx].productId = prodId;
                          newLines[idx].productName = selectedP?.name || "Producto";
                          newLines[idx].unitPrice = Number(selectedP?.costPrice || selectedP?.purchasePrice || 20);
                          setReturnItems(newLines);
                        }}
                        className="w-full text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-1.5 text-slate-900 dark:text-white truncate"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.categoryName ? `(${p.categoryName})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {returnItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveReturnLine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                        title="Eliminar partida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fila 2: Cantidad, Costo Unitario y Subtotal Devolución */}
                  <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-white/5 items-center">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Cantidad a Devolver
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) => {
                          const newLines = [...returnItems];
                          newLines[idx].qty = parseInt(e.target.value, 10) || 1;
                          setReturnItems(newLines);
                        }}
                        placeholder="Cant."
                        className="w-full text-xs font-mono text-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1.5 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Costo Unitario ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => {
                          const newLines = [...returnItems];
                          newLines[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setReturnItems(newLines);
                        }}
                        placeholder="Costo"
                        className="w-full text-xs font-mono text-right rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1.5 text-slate-900 dark:text-white font-semibold"
                      />
                    </div>

                    <div className="text-right">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Importe Devolución
                      </label>
                      <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 pt-1">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setReturnModalOpen(false);
                setSelectedReturnOrder(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              glow
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              type="submit"
              loading={submittingReturn}
            >
              Confirmar Devolución
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VER DETALLE / EDITAR ORDEN DE COMPRA (PO) */}
      <Modal
        isOpen={orderDetailModalOpen}
        onClose={() => {
          setOrderDetailModalOpen(false);
          setSelectedOrderDetail(null);
          setIsEditingDraftOrder(false);
        }}
        title={
          selectedOrderDetail
            ? `${isEditingDraftOrder ? "✏️ Editar" : "🔍 Detalle de"} Orden de Compra: ${
                selectedOrderDetail.orderNumber ||
                selectedOrderDetail.purchaseOrderSeq ||
                `OC-2026-${String(selectedOrderDetail.id).padStart(5, "0")}`
              }`
            : "Detalle de Orden de Compra"
        }
        maxWidth="xl"
      >
        {selectedOrderDetail && (
          <div className="space-y-4">
            {/* Header Status & Progression Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-base text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                    {selectedOrderDetail.orderNumber ||
                      selectedOrderDetail.purchaseOrderSeq ||
                      `OC-2026-${String(selectedOrderDetail.id).padStart(5, "0")}`}
                  </span>
                  <Badge
                    variant={
                      selectedOrderDetail.statusSelect === 3
                        ? "success"
                        : selectedOrderDetail.statusSelect === 2
                        ? "primary"
                        : "warning"
                    }
                  >
                    {selectedOrderDetail.statusSelect === 1
                      ? "Borrador"
                      : selectedOrderDetail.statusSelect === 2
                      ? "Confirmada"
                      : "Recibida en Almacén"}
                  </Badge>
                  {selectedOrderDetail.receiptSeq && (
                    <Badge variant="success" className="text-[10px] gap-1 font-mono">
                      <PackageCheck className="w-3 h-3 inline" />
                      {selectedOrderDetail.receiptSeq}
                    </Badge>
                  )}
                  {(selectedOrderDetail.invoiceSeq || selectedOrderDetail.isInvoiced) && (
                    <Badge variant="primary" className="text-[10px] gap-1 font-mono">
                      <Receipt className="w-3 h-3 inline" />
                      {selectedOrderDetail.invoiceSeq || "Facturada CxP"}
                    </Badge>
                  )}
                </div>

                {/* Switcher Edit / View Mode (Only for Draft status) */}
                {selectedOrderDetail.statusSelect === 1 && (
                  <div className="flex items-center gap-2">
                    {isEditingDraftOrder ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingDraftOrder(false)}
                        className="text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Resumen</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingDraftOrder(true)}
                        className="text-xs gap-1 text-etiserv-blue border-etiserv-blue/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Borrador</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Status Stepper */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                <StatusStepper
                  steps={[
                    { id: 1, label: "Borrador" },
                    { id: 2, label: "Confirmada" },
                    { id: 3, label: "Recibida en Almacén" },
                  ]}
                  currentStepIndex={(selectedOrderDetail.statusSelect || 1) - 1}
                />
              </div>
            </div>

            {/* EDIT MODE */}
            {isEditingDraftOrder ? (
              <form onSubmit={handleSaveEditedOrder} className="space-y-4">
                {/* Supplier Selection */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Proveedor Asignado a la Orden
                    </span>
                  </div>
                  <Autocomplete
                    label="Proveedor"
                    placeholder="Escribe el nombre, empresa o RFC del proveedor..."
                    items={supplierItems}
                    value={editSupplierId}
                    onChange={(item) => setEditSupplierId(Number(item.id))}
                    required
                  />
                </div>

                {/* Edit Line Items */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Partidas de la Orden ({editOrderLines.filter((l) => l.productId > 0).length} Artículos)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditOrderLines([
                          ...editOrderLines,
                          { productId: 0, qty: 10, unitPrice: 0 },
                        ])
                      }
                      className="text-xs py-1 gap-1"
                    >
                      <Plus className="w-3 h-3" /> Fila Manual
                    </Button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {editOrderLines.map((line, idx) => (
                      <SearchablePurchaseRow
                        key={idx}
                        line={line}
                        index={idx}
                        products={products}
                        onSelect={(index, prod) => {
                          const updated = [...editOrderLines];
                          updated[index] = {
                            productId: prod.id,
                            qty: updated[index]?.qty || 10,
                            unitPrice: Number(prod.costPrice || prod.purchasePrice || 20),
                          };
                          setEditOrderLines(updated);
                        }}
                        onUpdateQty={(index, qty) => {
                          const updated = [...editOrderLines];
                          updated[index].qty = qty;
                          setEditOrderLines(updated);
                        }}
                        onUpdatePrice={(index, price) => {
                          const updated = [...editOrderLines];
                          updated[index].unitPrice = price;
                          setEditOrderLines(updated);
                        }}
                        onRemove={(index) => {
                          if (editOrderLines.length <= 1) {
                            setEditOrderLines([{ productId: 0, qty: 10, unitPrice: 0 }]);
                          } else {
                            setEditOrderLines(editOrderLines.filter((_, i) => i !== index));
                          }
                        }}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes & Calculations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Observaciones / Instrucciones de Compra
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notas para el proveedor o almacén..."
                      className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {(() => {
                    const valid = editOrderLines.filter((l) => l.productId > 0);
                    const subtotal = valid.reduce((s, l) => s + (l.qty || 1) * (l.unitPrice || 0), 0);
                    const tax = subtotal * 0.16;
                    const grandTotal = subtotal + tax;

                    return (
                      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>IVA Trasladado (16%):</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                          <span>Total Orden:</span>
                          <span className="text-etiserv-blue">{formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Edit Form Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingDraftOrder(false)}
                  >
                    Cancelar Edición
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    glow
                    loading={editSaving}
                    className="flex-1"
                  >
                    💾 Guardar Cambios en Borrador
                  </Button>
                </div>
              </form>
            ) : (
              /* VIEW MODE */
              <div className="space-y-4">
                {/* Supplier & Order Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Proveedor
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedOrderDetail.supplierPartner?.name ||
                        selectedOrderDetail.supplierPartner?.fullName ||
                        selectedOrderDetail.supplierName ||
                        "Proveedor General"}
                    </div>
                    <div className="text-slate-500 font-mono">
                      RFC: {selectedOrderDetail.supplierPartner?.taxNbr || "Sin RFC registrado"}
                    </div>
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Detalles del Documento
                    </span>
                    <div className="text-slate-700 dark:text-slate-300">
                      Fecha Emisión:{" "}
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {selectedOrderDetail.orderDate || selectedOrderDetail.creationDate || "Hoy"}
                      </strong>
                    </div>
                    <div className="text-slate-500 font-mono">
                      Moneda: MXN (Pesos Mexicanos)
                    </div>
                  </div>
                </div>

                {/* Items List (Double-Line Standard Layout) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Partidas & Artículos Incluidos
                  </span>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(() => {
                      const rawLines =
                        selectedOrderDetail.purchaseOrderLineList ||
                        selectedOrderDetail.lines ||
                        selectedOrderDetail.items ||
                        [];
                      if (rawLines.length === 0) {
                        return (
                          <div className="p-4 text-center text-xs text-slate-400 italic">
                            Sin partidas detalladas registradas en el documento
                          </div>
                        );
                      }
                      return rawLines.map((line: any, idx: number) => {
                        const prod =
                          line.product ||
                          products.find(
                            (p) => p.id === line.productId || p.id === line.product?.id
                          );
                        const prodName =
                          line.productName || line.product?.name || prod?.name || "Artículo de Compra";
                        const prodCode =
                          line.productCode || line.product?.code || prod?.code || `SKU-${line.productId || idx + 1}`;
                        const qty = line.qty || line.quantity || 1;
                        const price = Number(line.price || line.unitPrice || 0);
                        const total = line.exTaxTotal || qty * price;

                        return (
                          <div
                            key={idx}
                            className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2"
                          >
                            {/* Fila 1: SKU & Nombre */}
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                                {prodCode}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate">
                                  {prodName}
                                </span>
                                {prod?.categoryName && (
                                  <span className="text-[10px] text-slate-400 font-sans">
                                    {prod.categoryName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Fila 2: Cantidad, Costo y Total */}
                            <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-white/5 items-center text-xs font-mono">
                              <div>
                                <span className="text-[10px] text-slate-400 font-sans block">
                                  Cantidad
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {qty} PZA
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-sans block">
                                  Costo Unitario
                                </span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {formatCurrency(price)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-sans block">
                                  Total Partida
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Notes & Totals Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Observaciones / Notas
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 italic">
                      {selectedOrderDetail.internalNote ||
                        selectedOrderDetail.notes ||
                        "Sin observaciones adicionales"}
                    </p>
                  </div>

                  {(() => {
                    const rawSub = Number(
                      selectedOrderDetail.exTaxTotal ||
                        (selectedOrderDetail.inTaxTotal
                          ? selectedOrderDetail.inTaxTotal / 1.16
                          : selectedOrderDetail.totalAmount || 0)
                    );
                    const subtotal = rawSub;
                    const tax = subtotal * 0.16;
                    const grandTotal =
                      Number(selectedOrderDetail.inTaxTotal || selectedOrderDetail.totalAmount) ||
                      subtotal + tax;

                    return (
                      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>IVA Trasladado (16%):</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                          <span>Total General:</span>
                          <span className="text-etiserv-blue">{formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Actions based on Status */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    {selectedOrderDetail.statusSelect === 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDraftOrder(selectedOrderDetail.id)}
                        loading={deletingOrder}
                        className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Borrador</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOrderDetail.statusSelect === 1 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingDraftOrder(true)}
                          className="text-xs gap-1 text-etiserv-blue border-etiserv-blue/40"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          glow
                          size="sm"
                          onClick={async () => {
                            await handleConfirmOrder(selectedOrderDetail.id);
                            setOrderDetailModalOpen(false);
                          }}
                          className="text-xs gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirmar Pedido</span>
                        </Button>
                      </>
                    )}

                    {selectedOrderDetail.statusSelect === 2 && (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          glow
                          size="sm"
                          onClick={async () => {
                            await handleReceiveOrder(selectedOrderDetail.id);
                            setOrderDetailModalOpen(false);
                          }}
                          className="text-xs gap-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Recibir en Almacén</span>
                        </Button>
                        {!selectedOrderDetail.isInvoiced && !selectedOrderDetail.invoiceSeq && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await handleGenerateInvoiceFromOrder(selectedOrderDetail.id);
                              setOrderDetailModalOpen(false);
                            }}
                            className="text-xs gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-500" />
                            <span>Generar Factura CxP</span>
                          </Button>
                        )}
                      </>
                    )}

                    {selectedOrderDetail.statusSelect === 3 && (
                      <>
                        {!selectedOrderDetail.isInvoiced && !selectedOrderDetail.invoiceSeq && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await handleGenerateInvoiceFromOrder(selectedOrderDetail.id);
                              setOrderDetailModalOpen(false);
                            }}
                            className="text-xs gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5 text-blue-500" />
                            <span>Generar Factura CxP</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOrderDetailModalOpen(false);
                            handleOpenReturnModal(selectedOrderDetail);
                          }}
                          className="text-xs gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Devolver Mercancía</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: VER DETALLE DE RECEPCIÓN DE ALMACÉN */}
      <Modal
        isOpen={receiptDetailModalOpen}
        onClose={() => {
          setReceiptDetailModalOpen(false);
          setSelectedReceipt(null);
        }}
        title={
          selectedReceipt
            ? `🔍 Detalle de Recepción: ${selectedReceipt.receiptSeq || selectedReceipt.id}`
            : "Detalle de Recepción"
        }
        maxWidth="xl"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                  {selectedReceipt.receiptSeq || selectedReceipt.id}
                </span>
                <Badge variant="success" className="gap-1">
                  <PackageCheck className="w-3 h-3 inline" />
                  Recibido en Bodega
                </Badge>
                {selectedReceipt.orderNumber && (
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    Orden: {selectedReceipt.orderNumber}
                  </Badge>
                )}
              </div>
              <div className="text-xs font-mono text-slate-500">
                Fecha Entrada: <strong>{selectedReceipt.receiptDate}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Proveedor
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedReceipt.supplierName}
                </div>
              </div>
              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Almacén Destino
                </span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedReceipt.warehouseName}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Artículos Ingresados al Inventario
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(selectedReceipt.items || []).map((it: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                        {it.productCode || `SKU-${it.productId || idx + 1}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate">
                          {it.productName}
                        </span>
                      </div>
                      {it.lotNumber && (
                        <span className="font-mono text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                          Lote: {it.lotNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-xs font-mono">
                      <span className="text-slate-400">Cantidad Recibida</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {it.qtyReceived} Unidades
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs font-mono">
              <span className="text-slate-500 font-sans font-semibold">Total de Unidades Recibidas:</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">{selectedReceipt.totalQty} u.</span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReceiptDetailModalOpen(false);
                  setSelectedReceipt(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: VER DETALLE DE FACTURA DE PROVEEDOR (CXP) */}
      <Modal
        isOpen={invoiceDetailModalOpen}
        onClose={() => {
          setInvoiceDetailModalOpen(false);
          setSelectedInvoice(null);
        }}
        title={
          selectedInvoice
            ? `🔍 Detalle de Factura CxP: ${selectedInvoice.invoiceSeq || selectedInvoice.id}`
            : "Detalle de Factura CxP"
        }
        maxWidth="xl"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                  {selectedInvoice.invoiceSeq || selectedInvoice.id}
                </span>
                <Badge variant={selectedInvoice.status === "PAID" ? "success" : "warning"}>
                  {selectedInvoice.status === "PAID" ? "Liquidada" : "Pendiente de Pago"}
                </Badge>
                {selectedInvoice.vendorInvoiceNumber && (
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    Factura Prov: {selectedInvoice.vendorInvoiceNumber}
                  </Badge>
                )}
                {selectedInvoice.receiptSeq && (
                  <Badge variant="success" className="font-mono text-[10px] gap-1">
                    <PackageCheck className="w-3 h-3 inline" />
                    {selectedInvoice.receiptSeq}
                  </Badge>
                )}
              </div>

              <div className="text-xs font-mono text-slate-500">
                Emisión: <strong>{selectedInvoice.invoiceDate}</strong> | Vence: <strong>{selectedInvoice.dueDate}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Proveedor
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedInvoice.supplierName}
                </div>
                <div className="text-slate-500 font-mono">
                  RFC: {selectedInvoice.supplierTaxNbr || "Sin RFC"}
                </div>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Referencia de Compra
                </span>
                <div className="text-slate-700 dark:text-slate-300">
                  Orden: <strong className="text-slate-900 dark:text-white font-mono">{selectedInvoice.orderNumber || "Directa"}</strong>
                </div>
                <div className="text-slate-500 font-mono">
                  Moneda: MXN
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Partidas & Conceptos Facturados
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(selectedInvoice.items || []).map((it: any, idx: number) => {
                  const qty = it.qty || it.quantity || 1;
                  const price = Number(it.unitPrice || it.price || 0);
                  const total = qty * price;

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                          {it.productCode || `SKU-${it.productId || idx + 1}`}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate">
                            {it.productName}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-white/5 items-center text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Cantidad</span>
                          <span className="font-bold text-slate-900 dark:text-white">{qty} PZA</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Precio Unit.</span>
                          <span className="text-slate-700 dark:text-slate-300">{formatCurrency(price)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-sans block">Total</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Notas / Observaciones
                </span>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  {selectedInvoice.notes || "Factura registrada en Cuentas por Pagar"}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA Trasladado (16%):</span>
                  <span>{formatCurrency((selectedInvoice.subtotal || 0) * 0.16)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                  <span>Total Factura:</span>
                  <span className="text-etiserv-blue">{formatCurrency(selectedInvoice.totalAmount || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInvoiceDetailModalOpen(false);
                  setSelectedInvoice(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: EXPLORADOR DE CATÁLOGO DE PRODUCTOS (MULTI-FILTRO Y BÚSQUEDA) */}
      <CatalogBrowserModal
        isOpen={catalogBrowserOpen}
        onClose={() => setCatalogBrowserOpen(false)}
        products={products}
        onAddProduct={(prod, qty) => {
          if (catalogBrowserTarget === "PO") {
            handleAddProductToOrder(prod, qty);
          } else {
            handleAddProductToInvoice(prod, qty);
          }
        }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default PurchasingView;
