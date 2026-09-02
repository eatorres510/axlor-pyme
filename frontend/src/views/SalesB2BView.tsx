import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  FileText,
  ShoppingBag,
  Tags,
  Plus,
  RefreshCw,
  ArrowRight,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Edit2,
  Trash2,
  Users,
  Search,
  Check,
  Percent,
  Barcode,
  Package,
  ChevronDown,
  Lock,
  Unlock,
  X,
  Eye,
  Edit3,
  Printer,
  DollarSign,
  CreditCard,
  Truck,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { catalogApi } from "../api/catalogApi";
import { salesApi, SaleQuoteRecord, B2BOrderRecord, SalesInvoiceRecord, PriceList } from "../api/salesApi";
import { financeApi } from "../api/financeApi";
import { Autocomplete, AutocompleteItem } from "../components/ui/Autocomplete";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { ThermalTicketModal } from "../components/layout/ThermalTicketModal";

export type SalesTab = "QUOTES" | "ORDERS" | "INVOICES" | "PRICE_LISTS";

interface SalesB2BViewProps {
  initialTab?: SalesTab;
}

// Componente Searchable Product Picker para cada partida (Formato Doble Línea)
const SearchableProductRow: React.FC<{
  item: any;
  index: number;
  products: any[];
  onSelect: (index: number, product: any) => void;
  onUpdateQty: (index: number, qty: number) => void;
  onUpdateUnitPrice?: (index: number, unitPrice: number) => void;
  onUpdateDiscount: (index: number, discountPct: number) => void;
  onRemove: (index: number) => void;
  formatCurrency: (val: number) => string;
}> = ({
  item,
  index,
  products,
  onSelect,
  onUpdateQty,
  onUpdateUnitPrice,
  onUpdateDiscount,
  onRemove,
  formatCurrency,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === item.productId);

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

  const netLineTotal = (item.qty || 1) * (item.unitPrice || 0) * (1 - (item.discountPct || 0) / 100);

  return (
    <div className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2.5">
      {/* Fila 1: Identificación completa del Producto */}
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
              placeholder="🔍 Escribe para buscar producto por nombre o SKU..."
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
                  <strong className="font-mono text-etiserv-blue text-xs ml-2 shrink-0">
                    {formatCurrency(Number(p.salePrice || 0))}
                  </strong>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Fila 2: Cantidad, Precio Unitario, Descuento % e Importe Neto */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-white/5 items-center">
        {/* Cantidad */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Cantidad
          </label>
          <input
            type="number"
            min="1"
            placeholder="Cant."
            value={item.qty}
            onChange={(e) => onUpdateQty(index, parseInt(e.target.value, 10) || 1)}
            className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-center text-slate-900 dark:text-white font-bold"
            title="Cantidad a cotizar"
          />
        </div>

        {/* Precio Unitario */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Precio Unit. ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={item.unitPrice ?? 0}
            onChange={(e) => onUpdateUnitPrice ? onUpdateUnitPrice(index, parseFloat(e.target.value) || 0) : null}
            className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-right text-slate-900 dark:text-white font-bold"
            title="Precio unitario de venta"
          />
        </div>

        {/* Descuento % */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            % Descuento
          </label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="% Dto"
            value={item.discountPct}
            onChange={(e) => onUpdateDiscount(index, parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-center text-slate-900 dark:text-white font-semibold"
            title="Porcentaje de descuento comercial"
          />
        </div>

        {/* Importe Neto */}
        <div className="text-right">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Importe Neto
          </label>
          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white pt-1">
            {formatCurrency(netLineTotal)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SalesB2BView: React.FC<SalesB2BViewProps> = ({ initialTab = "QUOTES" }) => {
  const { activeCompany, formatCurrency } = useCompany();
  const [activeTab, setActiveTab] = useState<SalesTab>(initialTab);
  const [quotes, setQuotes] = useState<SaleQuoteRecord[]>([]);
  const [orders, setOrders] = useState<B2BOrderRecord[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoiceRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoiceRecord | null>(null);
  const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = useState(false);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync initialTab when sidebar selection changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Nueva Cotización Modal State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | string>(0);
  const [quoteItems, setQuoteItems] = useState<any[]>([
    { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 },
  ]);
  const [quickScanInput, setQuickScanInput] = useState("");
  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [quickScanHighlightIndex, setQuickScanHighlightIndex] = useState(0);
  const quickScanRef = useRef<HTMLDivElement>(null);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [lastConversionTime, setLastConversionTime] = useState<string | null>(null);
  const [isCustomerUnlocked, setIsCustomerUnlocked] = useState(false);

  // Quote Detail & Edit Modal State
    // Direct Invoice (Factura Rápida B2B) Modal State
  const [directInvoiceModalOpen, setDirectInvoiceModalOpen] = useState(false);
  const [directInvoiceItems, setDirectInvoiceItems] = useState<any[]>([
    { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 }
  ]);
  const [directInvoicePartnerId, setDirectInvoicePartnerId] = useState<number | string>(0);
  const [directInvoiceNotes, setDirectInvoiceNotes] = useState("");
  const [directInvoicePaymentTerms, setDirectInvoicePaymentTerms] = useState("30_DIAS_CREDITO");
  const [submittingDirectInvoice, setSubmittingDirectInvoice] = useState(false);

  const [quoteDetailModalOpen, setQuoteDetailModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<SaleQuoteRecord | null>(null);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [editQuoteLines, setEditQuoteLines] = useState<any[]>([]);
  const [editPartnerId, setEditPartnerId] = useState<number | string>(0);
  const [editPriceListCode, setEditPriceListCode] = useState<string>("PUBLIC");
  const [editQuoteNotes, setEditQuoteNotes] = useState("");
  const [savingQuoteEdit, setSavingQuoteEdit] = useState(false);
  const [deletingQuote, setDeletingQuote] = useState(false);

  // B2B Order Detail Modal State
  const [b2bOrderDetailModalOpen, setB2bOrderDetailModalOpen] = useState(false);
  const [selectedB2BOrder, setSelectedB2BOrder] = useState<B2BOrderRecord | null>(null);

  const quickScanMatches = useMemo(() => {
    if (!quickScanInput.trim()) return [];
    const q = quickScanInput.trim().toLowerCase();
    return products.filter((p) => {
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q) ||
        (p.barCode || "").toLowerCase().includes(q) ||
        (p.categoryName || "").toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [quickScanInput, products]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickScanRef.current && !quickScanRef.current.contains(e.target as Node)) {
        setQuickScanOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Restore draft quote from localStorage if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem("b2b_draft_quote");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          setQuoteItems(parsed.items);
        }
        if (parsed.partnerId) {
          setSelectedPartnerId(parsed.partnerId);
        }
        if (parsed.notes) {
          setQuoteNotes(parsed.notes);
        }
      }
    } catch {}
  }, []);

  // Save draft quote automatically while open
  useEffect(() => {
    if (quoteModalOpen) {
      try {
        localStorage.setItem(
          "b2b_draft_quote",
          JSON.stringify({
            items: quoteItems,
            partnerId: selectedPartnerId,
            notes: quoteNotes,
          })
        );
      } catch {}
    }
  }, [quoteItems, selectedPartnerId, quoteNotes, quoteModalOpen]);

  // Price List CRUD & Association Modals
  const [priceListModalOpen, setPriceListModalOpen] = useState(false);
  const [editingPriceListCode, setEditingPriceListCode] = useState<string | null>(null);
  const [priceListForm, setPriceListForm] = useState({
    code: "",
    name: "",
    discountPct: 0,
    description: "",
  });

  // Assign Partners Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetPriceList, setTargetPriceList] = useState<PriceList | null>(null);
  const [assignedPartnerIds, setAssignedPartnerIds] = useState<number[]>([]);
  const [partnerFilterQuery, setPartnerFilterQuery] = useState("");
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Ticket & Factura Thermal Print Modal
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  const handlePrintQuoteDirect = (q: SaleQuoteRecord) => {
    if (!activeCompany) return;
    const isConverted = q.status === "CONVERTED" || q.status === "WON";
    const folioStr = isConverted
      ? (q.convertedOrderId ? `FAC-${q.convertedOrderId}` : `FAC-2026-${String(q.id).padStart(5, "0")}`)
      : q.quoteSeq;

    setTicketData({
      ticketNumber: folioStr,
      docTypeLabel: isConverted ? "FACTURA FISCAL B2B" : "COTIZACIÓN COMERCIAL",
      companyName: activeCompany.name,
      companyTaxId: activeCompany.taxId,
      branchName: "Oficina de Ventas B2B",
      clientName: q.partnerName,
      date: new Date().toLocaleString("es-MX"),
      items: (q.items || []).map((it) => ({
        productName: it.productName || "Producto",
        qty: it.qty || 1,
        unitPrice: it.unitPrice || 0,
        total: (it.qty || 1) * (it.unitPrice || 0) * (1 - (it.discountPct || 0) / 100),
      })),
      subtotal: Number(q.subtotal || (q.total / 1.16).toFixed(2)),
      taxAmount: Number(q.taxAmount || (q.total - q.total / 1.16).toFixed(2)),
      total: Number(q.total || 0),
      paymentMethod: isConverted ? "CRÉDITO / POR COBRAR EN CAJA" : "COTIZACIÓN VIGENTE",
      amountPaid: Number(q.total || 0),
      change: 0,
    });
    setTicketModalOpen(true);
  };

  const loadData = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const [quotesData, ordersData, invoicesData, priceListsData, partnersData, productsData] = await Promise.all([
        salesApi.listQuotes(activeCompany.id),
        salesApi.listOrders(activeCompany.id),
        salesApi.listInvoices(activeCompany.id),
        salesApi.listPriceLists(),
        catalogApi.listPartners(activeCompany.id),
        catalogApi.listProducts(activeCompany.id),
      ]);
      setQuotes(quotesData || []);
      setOrders(ordersData || []);
      setInvoices(invoicesData || []);
      setPriceLists(priceListsData || []);
      setPartners(partnersData || []);
      setProducts(productsData || []);
      if (partnersData && partnersData.length > 0 && (!selectedPartnerId || selectedPartnerId === 0)) {
        setSelectedPartnerId(partnersData[0].id);
      }
    } catch (err) {
      console.error("Error al cargar ventas B2B:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany]);

  const partnerItems: AutocompleteItem[] = partners.map((p) => {
    const typeLabel =
      p.partnerType === "FINAL_CONSUMER"
        ? "🛒 B2C"
        : p.partnerType === "FISICA"
        ? "👤 P. Física"
        : p.partnerType === "DISTRIBUTOR"
        ? "🏷️ Distribuidor"
        : p.partnerType === "GOVERNMENT"
        ? "🏛️ Gobierno"
        : "🏢 P. Moral";

    return {
      id: p.id,
      title: p.name || p.fullName,
      subtitle: `RFC: ${p.taxNbr || "XAXX010101000"} | ${p.email || "Sin email"}`,
      badge: typeLabel,
    };
  });

  // Automatic Price List & Discount based on selected customer
  const currentPartner = partners.find((p) => Number(p.id) === Number(selectedPartnerId));
  const activePriceListCode = currentPartner?.priceListCode || "PUBLIC";
  const currentPriceListObj = priceLists.find((pl) => pl.code === activePriceListCode);
  const currentDiscountPct = currentPriceListObj ? currentPriceListObj.discountPct : 0;

  const handleProductSelect = (index: number, prod: any) => {
    if (!prod) return;

    const updated = [...quoteItems];
    updated[index] = {
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      qty: updated[index]?.qty || 1,
      unitPrice: Number(prod.salePrice || 0),
      discountPct: currentDiscountPct,
    };
    setQuoteItems(updated);
  };

  const handleAddQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: currentDiscountPct },
    ]);
  };

  const handleRemoveQuoteItem = (index: number) => {
    if (quoteItems.length <= 1) {
      setQuoteItems([{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: currentDiscountPct }]);
      setIsCustomerUnlocked(false);
      return;
    }
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  // Direct Product Adder for Scanner / Selection
  const addProductToQuote = (prod: any) => {
    const existingIdx = quoteItems.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...quoteItems];
      updated[existingIdx].qty += 1;
      setQuoteItems(updated);
    } else {
      if (quoteItems.length === 1 && quoteItems[0].productId === 0) {
        setQuoteItems([
          {
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            qty: 1,
            unitPrice: Number(prod.salePrice || 0),
            discountPct: currentDiscountPct,
          },
        ]);
      } else {
        setQuoteItems([
          ...quoteItems,
          {
            productId: prod.id,
            productName: prod.name,
            productCode: prod.code,
            qty: 1,
            unitPrice: Number(prod.salePrice || 0),
            discountPct: currentDiscountPct,
          },
        ]);
      }
    }
    setQuickScanInput("");
    setQuickScanOpen(false);
  };

  // Quick Barcode / SKU Scanner in Quote Modal
  const handleQuickScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickScanInput.trim()) return;

    if (quickScanMatches.length > 0) {
      const targetProd = quickScanMatches[quickScanHighlightIndex] || quickScanMatches[0];
      addProductToQuote(targetProd);
    } else {
      alert(`No se encontró producto con código o SKU: ${quickScanInput}`);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    const validItems = quoteItems
      .filter((i) => i.productId > 0)
      .map((i) => {
        const prod = products.find((p) => p.id === i.productId);
        return {
          productId: i.productId,
          productName: i.productName || prod?.name || "Producto",
          productCode: i.productCode || prod?.code || "SKU",
          qty: Number(i.qty) || 1,
          unitPrice: Number(i.unitPrice) || Number(prod?.salePrice) || 0,
          discountPct: Number(i.discountPct) || 0,
        };
      });

    if (validItems.length === 0) {
      alert("Debe seleccionar al menos 1 producto válido con cantidad mayor a 0.");
      return;
    }

    const partner =
      partners.find((p) => Number(p.id) === Number(selectedPartnerId)) ||
      partners[0] || { id: 1, name: "Cliente B2B Comercial" };

    const partnerId = partner ? Number(partner.id) : 1;
    const partnerName = partner ? (partner.name || partner.fullName || "Cliente B2B") : "Cliente B2B";

    try {
      setSubmittingQuote(true);
      await salesApi.createQuote({
        companyId: activeCompany.id,
        partnerId,
        partnerName,
        priceListCode: activePriceListCode,
        items: validItems,
        notes: quoteNotes || "Cotización Comercial B2B",
      });

      try {
        localStorage.removeItem("b2b_draft_quote");
      } catch {}
      setQuoteModalOpen(false);
      setQuoteNotes("");
      setIsCustomerUnlocked(false);
      setQuoteItems([{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 }]);
      await loadData();
      alert("¡Cotización emitida y registrada exitosamente!");
    } catch (err: any) {
      alert(`Error al crear cotización: ${err.message || err.error || "Verifique los datos"}`);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleConvertToOrder = async (quoteId: string) => {
    try {
      const order = await salesApi.convertToOrder(quoteId);
      alert(`¡Cotización convertida con éxito a Pedido B2B ${order.orderSeq}!`);
      loadData();
    } catch (err: any) {
      alert(`Error al convertir a pedido: ${err.message}`);
    }
  };

    const handleOpenDirectInvoiceModal = () => {
    const firstPartnerId = partners.length > 0 ? partners[0].id : 0;
    setDirectInvoicePartnerId(selectedPartnerId || firstPartnerId);
    setDirectInvoiceItems([
      { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: currentDiscountPct }
    ]);
    setDirectInvoiceNotes("");
    setDirectInvoicePaymentTerms("30_DIAS_CREDITO");
    setDirectInvoiceModalOpen(true);
  };

  const handleDirectInvoiceProductSelect = (index: number, prod: any) => {
    if (!prod) return;
    const partner = partners.find((p) => Number(p.id) === Number(directInvoicePartnerId));
    const plCode = partner?.priceListCode || "PUBLIC";
    const plObj = priceLists.find((pl) => pl.code === plCode);
    const discPct = plObj ? plObj.discountPct : 0;

    const updated = [...directInvoiceItems];
    updated[index] = {
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      qty: updated[index]?.qty || 1,
      unitPrice: Number(prod.salePrice || 0),
      discountPct: discPct,
    };
    setDirectInvoiceItems(updated);
  };

  const handleAddDirectInvoiceItem = () => {
    const partner = partners.find((p) => Number(p.id) === Number(directInvoicePartnerId));
    const plCode = partner?.priceListCode || "PUBLIC";
    const plObj = priceLists.find((pl) => pl.code === plCode);
    const discPct = plObj ? plObj.discountPct : 0;

    setDirectInvoiceItems([
      ...directInvoiceItems,
      { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: discPct },
    ]);
  };

  const handleRemoveDirectInvoiceItem = (index: number) => {
    if (directInvoiceItems.length <= 1) {
      setDirectInvoiceItems([{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 }]);
      return;
    }
    setDirectInvoiceItems(directInvoiceItems.filter((_, i) => i !== index));
  };

  const handleSubmitDirectInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    const validLines = directInvoiceItems.filter((it) => it.productId > 0);
    if (validLines.length === 0) {
      alert("Debes agregar al menos un producto a facturar.");
      return;
    }

    const partner = partners.find((p) => Number(p.id) === Number(directInvoicePartnerId));
    if (!partner) {
      alert("Debes seleccionar un cliente válido.");
      return;
    }

    setSubmittingDirectInvoice(true);
    const t0 = performance.now();
    try {
      const res = await salesApi.createDirectInvoice({
        companyId: activeCompany.id,
        partnerId: Number(partner.id),
        partnerName: partner.name || partner.fullName,
        items: validLines,
        paymentTerms: directInvoicePaymentTerms,
        notes: directInvoiceNotes,
      });

      const ttf = ((performance.now() - t0) / 1000).toFixed(2);
      setLastConversionTime(ttf);
      setDirectInvoiceModalOpen(false);
      await loadData();
      setActiveTab("INVOICES");
      alert(`⚡ ¡Factura Rápida ${res.invoiceSeq} y Pedido ${res.orderSeq} emitidos en ${ttf}s con éxito!`);
    } catch (err: any) {
      alert(`Error al emitir factura rápida: ${err.message}`);
    } finally {
      setSubmittingDirectInvoice(false);
    }
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    const t0 = performance.now();
    try {
      const res = await salesApi.convertToInvoice(quoteId);
      const ttf = ((performance.now() - t0) / 1000).toFixed(2);
      setLastConversionTime(ttf);
      await loadData();
      setActiveTab("INVOICES");
      alert(`⚡ ¡Ciclo B2B Completado en ${ttf}s! Se generaron Pedido ${res.orderSeq} y Factura ${res.invoiceSeq} vinculados a Cotización ${res.quoteSeq}.`);
    } catch (err: any) {
      alert(`Error al facturar cotización: ${err.message}`);
    }
  };

  const handleConvertOrderToInvoice = async (orderId: string) => {
    const t0 = performance.now();
    try {
      const res = await salesApi.convertOrderToInvoice(orderId);
      const ttf = ((performance.now() - t0) / 1000).toFixed(2);
      setLastConversionTime(ttf);
      await loadData();
      setActiveTab("INVOICES");
      alert(`¡Factura ${res.invoiceSeq || "FAC-2026-00001"} emitida con éxito en ${ttf}s desde Pedido!`);
    } catch (err: any) {
      alert(`Error al facturar pedido: ${err.message}`);
    }
  };

    const handleOpenInvoiceDetail = async (inv: SalesInvoiceRecord) => {
    setSelectedInvoice(inv);
    setInvoiceDetailModalOpen(true);
    try {
      const fullInv = await salesApi.getInvoice(inv.id);
      if (fullInv) {
        setSelectedInvoice(fullInv);
      }
    } catch (e) {
      console.warn("No se pudo cargar detalle completo de factura:", e);
    }
  };

const handlePrintInvoiceDirect = (inv: SalesInvoiceRecord) => {
    if (!activeCompany) return;
    setTicketData({
      ticketNumber: inv.invoiceSeq,
      docTypeLabel: "FACTURA FISCAL DE VENTA (CFDI)",
      companyName: activeCompany.name,
      companyTaxId: activeCompany.taxId,
      branchName: "Oficina de Ventas B2B",
      clientName: inv.partnerName,
      date: new Date().toLocaleString("es-MX"),
      items: [
        {
          productName: inv.notes || "Facturación Comercial de Mercancía / Servicios B2B",
          qty: 1,
          unitPrice: inv.subtotal,
          total: inv.subtotal,
        },
      ],
      subtotal: inv.subtotal,
      tax: inv.taxAmount,
      total: inv.total,
      notes: `Vencimiento: ${inv.dueDate} | Saldo Pendiente: ${formatCurrency(inv.amountRemaining)}`,
    });
    setTicketModalOpen(true);
  };

  const handleOpenQuoteDetail = async (quote: SaleQuoteRecord, startInEdit = false) => {
    setSelectedQuote(quote);
    setEditPartnerId(quote.partnerId || 0);
    setEditPriceListCode(quote.priceListCode || "PUBLIC");
    setEditQuoteNotes(quote.notes || "");

    let activeQuote = quote;
    try {
      const fullQuote = await salesApi.getQuote(quote.id);
      if (fullQuote) {
        activeQuote = fullQuote;
        setSelectedQuote(fullQuote);
        setEditPartnerId(fullQuote.partnerId || 0);
        setEditPriceListCode(fullQuote.priceListCode || "PUBLIC");
        setEditQuoteNotes(fullQuote.notes || "");
      }
    } catch (e) {
      console.warn("No se pudo cargar detalle completo de cotización:", e);
    }

    const mappedLines = (activeQuote.items || []).map((it) => {
      const prod = products.find((p) => p.id === it.productId);
      const safePrice = Number(it.unitPrice) > 0 ? Number(it.unitPrice) : Number(prod?.salePrice || 0);
      return {
        productId: it.productId,
        productName: it.productName || prod?.name || "Producto",
        productCode: it.productCode || prod?.code || "SKU",
        qty: Number(it.qty) || 1,
        unitPrice: safePrice,
        discountPct: Number(it.discountPct) || 0,
      };
    });
    setEditQuoteLines(mappedLines.length > 0 ? mappedLines : [{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 }]);
    setIsEditingQuote(startInEdit && (activeQuote.status === "DRAFT" || !activeQuote.status));
    setQuoteDetailModalOpen(true);
  };

  const handleSaveQuoteEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;

    const validLines = editQuoteLines.filter((l) => l.productId > 0);
    if (validLines.length === 0) {
      alert("Debe incluir al menos 1 producto en la cotización.");
      return;
    }

    const partner = partners.find((p) => Number(p.id) === Number(editPartnerId));
    try {
      setSavingQuoteEdit(true);
      const updated = await salesApi.updateQuote(selectedQuote.id, {
        partnerId: Number(editPartnerId),
        partnerName: partner?.name || partner?.fullName || selectedQuote.partnerName,
        priceListCode: editPriceListCode,
        items: validLines,
        notes: editQuoteNotes,
      });

      setSelectedQuote(updated);
      setIsEditingQuote(false);
      await loadData();
      alert("¡Cotización actualizada exitosamente!");
    } catch (err: any) {
      alert(`Error al guardar cambios: ${err.message}`);
    } finally {
      setSavingQuoteEdit(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar y eliminar esta cotización en borrador?")) {
      return;
    }
    try {
      setDeletingQuote(true);
      await salesApi.deleteQuote(quoteId);
      setQuoteDetailModalOpen(false);
      setSelectedQuote(null);
      await loadData();
    } catch (err: any) {
      alert(`Error al eliminar cotización: ${err.message}`);
    } finally {
      setDeletingQuote(false);
    }
  };

  const handleOpenOrderDetail = async (order: B2BOrderRecord) => {
    setSelectedB2BOrder(order);
    try {
      const fullOrder = await salesApi.getOrder(order.id);
      if (fullOrder) {
        setSelectedB2BOrder(fullOrder);
      }
    } catch (e) {
      console.warn("No se pudo cargar detalle completo de pedido:", e);
    }
    setB2bOrderDetailModalOpen(true);
  };

  // --- Price List CRUD Handlers ---
  const handleOpenCreatePriceList = () => {
    setEditingPriceListCode(null);
    setPriceListForm({
      code: "",
      name: "",
      discountPct: 0,
      description: "",
    });
    setPriceListModalOpen(true);
  };

  const handleOpenEditPriceList = (pl: PriceList) => {
    setEditingPriceListCode(pl.code);
    setPriceListForm({
      code: pl.code,
      name: pl.name,
      discountPct: pl.discountPct,
      description: pl.description || "",
    });
    setPriceListModalOpen(true);
  };

  const handleSavePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceListForm.name.trim()) {
      alert("Ingrese el nombre de la lista de precios");
      return;
    }
    try {
      if (editingPriceListCode) {
        await salesApi.updatePriceList(editingPriceListCode, priceListForm);
        alert("¡Lista de precios actualizada exitosamente!");
      } else {
        if (!priceListForm.code.trim()) {
          alert("Ingrese un código único para la lista de precios");
          return;
        }
        await salesApi.createPriceList(priceListForm);
        alert("¡Lista de precios creada exitosamente!");
      }
      setPriceListModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error al guardar lista de precios: ${err.message}`);
    }
  };

  const handleDeletePriceList = async (pl: PriceList) => {
    if (pl.code === "PUBLIC") {
      alert("La tarifa base Pública no se puede eliminar");
      return;
    }
    if (confirm(`¿Está seguro de eliminar la lista de precios "${pl.name}"?`)) {
      try {
        await salesApi.deletePriceList(pl.code);
        alert("Lista de precios eliminada");
        loadData();
      } catch (err: any) {
        alert(`Error al eliminar lista: ${err.message}`);
      }
    }
  };

  // --- Assign Partners to Price List Handlers ---
  const handleOpenAssignModal = (pl: PriceList) => {
    setTargetPriceList(pl);
    const assigned = partners.filter((p) => p.priceListCode === pl.code).map((p) => p.id);
    setAssignedPartnerIds(assigned);
    setPartnerFilterQuery("");
    setAssignModalOpen(true);
  };

  const handleTogglePartnerAssignment = (partnerId: number) => {
    if (assignedPartnerIds.includes(partnerId)) {
      setAssignedPartnerIds(assignedPartnerIds.filter((id) => id !== partnerId));
    } else {
      setAssignedPartnerIds([...assignedPartnerIds, partnerId]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!targetPriceList) return;
    try {
      setSavingAssignments(true);
      await salesApi.assignPriceListToPartners(targetPriceList.code, assignedPartnerIds);
      alert(`¡${assignedPartnerIds.length} clientes vinculados a la tarifa "${targetPriceList.name}" con éxito!`);
      setAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error al asociar clientes: ${err.message}`);
    } finally {
      setSavingAssignments(false);
    }
  };

  // Live Calculation for Modal Quote Summary
  const validQuoteLines = quoteItems.filter((it) => it.productId > 0);
  const grossSubtotal = validQuoteLines.reduce((sum, it) => sum + (it.qty || 1) * (it.unitPrice || 0), 0);
  const netSubtotal = validQuoteLines.reduce(
    (sum, it) => sum + (it.qty || 1) * (it.unitPrice || 0) * (1 - (it.discountPct || 0) / 100),
    0
  );
  const totalDiscountAmount = grossSubtotal - netSubtotal;
  const vatTax = netSubtotal * 0.16;
  const quoteGrandTotal = netSubtotal + vatTax;

  // Customer Lock Condition: Once lines are added, customer is locked unless explicitly unlocked
  const isCustomerLocked = validQuoteLines.length > 0 && !isCustomerUnlocked;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Ventas B2B & Cotizaciones
            </h2>
            <Badge variant="primary">Flujo Comercial B2B</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cotizaciones con tarifas vinculadas al cliente y conversión en 1 clic a pedidos y facturas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenDirectInvoiceModal}
            className="gap-1.5 text-xs font-semibold border-amber-300 dark:border-amber-600/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            title="Emitir venta rápida y generar Pedido + Factura directamente"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>⚡ Factura Rápida B2B</span>
          </Button>

          {activeTab === "PRICE_LISTS" ? (
            <Button
              variant="primary"
              glow
              size="sm"
              onClick={handleOpenCreatePriceList}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Tarifa</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              glow
              size="sm"
              onClick={() => {
                setQuoteItems([{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: currentDiscountPct }]);
                setQuickScanInput("");
                setIsCustomerUnlocked(false);
                setQuoteModalOpen(true);
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Cotización</span>
            </Button>
          )}
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab("QUOTES");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
            activeTab === "QUOTES"
              ? "bg-etiserv-blue text-white"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Cotizaciones ({quotes.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("ORDERS");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
            activeTab === "ORDERS"
              ? "bg-etiserv-blue text-white"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Pedidos B2B ({orders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("INVOICES");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
            activeTab === "INVOICES"
              ? "bg-etiserv-blue text-white"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Facturas de Venta ({invoices.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("PRICE_LISTS");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
            activeTab === "PRICE_LISTS"
              ? "bg-etiserv-blue text-white"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Tags className="w-3.5 h-3.5" />
          <span>Listas de Precios & Tarifas ({priceLists.length})</span>
        </button>
      </div>

      {/* PAGE 1: QUOTES */}
      {activeTab === "QUOTES" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por folio, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white"
              />
            </div>
            {lastConversionTime && (
              <Badge variant="success">⚡ Facturado en {lastConversionTime}s</Badge>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Folio</th>
                  <th className="py-2.5 px-5">Cliente B2B</th>
                  <th className="py-2.5 px-5">Tarifa Aplicada</th>
                  <th className="py-2.5 px-5 text-right">Monto Total</th>
                  <th className="py-2.5 px-5 text-center">Estado</th>
                  <th className="py-2.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {quotes
                  .filter((q) =>
                    (q.quoteSeq || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (q.partnerName || "").toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => handleOpenQuoteDetail(q, false)}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuoteDetail(q, false);
                          }}
                          className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40 hover:underline flex items-center gap-1"
                          title="Clic para abrir y ver cotización"
                        >
                          <Eye className="w-3 h-3 inline text-etiserv-blue" />
                          <span>{q.quoteSeq}</span>
                        </button>
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                        {q.partnerName}
                      </td>
                      <td className="py-3 px-5">
                        <Badge variant="neutral">{q.priceListCode}</Badge>
                      </td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums text-slate-900 dark:text-white font-mono">
                        {formatCurrency(q.total || 0)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <Badge
                          variant={
                            q.status === "WON" || q.status === "CONVERTED"
                              ? "success"
                              : q.status === "SENT"
                              ? "primary"
                              : "warning"
                          }
                          dot
                        >
                          {q.status === "DRAFT" ? "Borrador" : q.status === "SENT" ? "Enviada" : q.status === "WON" || q.status === "CONVERTED" ? "Convertida" : q.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Botón Imprimir Formato / Ticket Térmico */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintQuoteDirect(q)}
                            className="text-[11px] py-1 px-2 gap-1 text-slate-700 dark:text-slate-200 hover:border-etiserv-blue"
                            title={q.status === "CONVERTED" || q.status === "WON" ? "Imprimir Factura Fiscal / Ticket Térmico" : "Imprimir Cotización B2B"}
                          >
                            <Printer className="w-3 h-3 text-etiserv-blue" />
                            <span>Imprimir</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenQuoteDetail(q, false)}
                            className="text-[11px] py-1 px-2 gap-1 text-slate-600 dark:text-slate-300"
                            title="Ver desglose completo de partidas"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>Ver</span>
                          </Button>

                          {(q.status === "DRAFT" || !q.status) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenQuoteDetail(q, true)}
                                className="text-[11px] py-1 px-2 gap-1 text-etiserv-blue border-etiserv-blue/40 font-semibold"
                                title="Editar partidas o cliente"
                              >
                                <Edit3 className="w-3 h-3 text-etiserv-blue" />
                                <span>Editar</span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuote(q.id || q.quoteSeq)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="Eliminar borrador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {q.status !== "CONVERTED" && q.status !== "WON" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConvertToOrder(q.id || q.quoteSeq)}
                                className="text-[11px] py-1 px-2.5 gap-1"
                                title="Convertir a Pedido B2B"
                              >
                                <ArrowRight className="w-3 h-3 text-etiserv-blue" />
                                <span>A Pedido</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                glow
                                onClick={() => handleConvertToInvoice(q.id || q.quoteSeq)}
                                className="text-[11px] py-1 px-2.5 gap-1"
                                title="Facturar directamente con 1-clic y enviar a Caja"
                              >
                                <Zap className="w-3 h-3 text-amber-300" />
                                <span>Facturar</span>
                              </Button>
                            </>
                          )}

                          {(q.status === "CONVERTED" || q.status === "WON") && (
                            <Badge variant="neutral" className="font-mono text-[10px] py-0.5 px-2 bg-blue-50 dark:bg-blue-950/60 text-etiserv-blue border-blue-200/80">
                              🧾 {q.convertedOrderId ? `FAC-${q.convertedOrderId}` : `FAC-2026-${String(q.id).padStart(5, "0")}`}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PAGE 2: ORDERS */}
      {activeTab === "ORDERS" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pedido, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Folio Pedido</th>
                  <th className="py-2.5 px-5">Cliente B2B</th>
                  <th className="py-2.5 px-5">Cotización Origen</th>
                  <th className="py-2.5 px-5">Condiciones</th>
                  <th className="py-2.5 px-5 text-right">Total</th>
                  <th className="py-2.5 px-5">Riesgo / Crédito</th>
                  <th className="py-2.5 px-5 text-center">Estado</th>
                  <th className="py-2.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {orders
                  .filter((o) =>
                    (o.orderSeq || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (o.partnerName || "").toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => handleOpenOrderDetail(o)}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOrderDetail(o);
                          }}
                          className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40 hover:underline flex items-center gap-1"
                          title="Clic para ver detalle de pedido"
                        >
                          <Eye className="w-3 h-3 inline text-etiserv-blue" />
                          <span>{o.orderSeq}</span>
                        </button>
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                        {o.partnerName}
                      </td>
                      <td className="py-3 px-5 font-mono text-[11px] text-slate-500">
                        {o.quoteSeq || "Venta Directa"}
                      </td>
                      <td className="py-3 px-5 text-slate-600 dark:text-slate-300 font-medium">
                        {o.paymentTerms === "30_DIAS_CREDITO" ? "30 Días Crédito" : o.paymentTerms || "Contado"}
                      </td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums text-slate-900 dark:text-white font-mono">
                        {formatCurrency(o.total || 0)}
                      </td>
                      <td className="py-3 px-5">
                        {o.creditWarning ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 whitespace-normal"
                            title={o.creditWarning}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span>{o.creditWarning}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Crédito Autorizado</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <Badge variant="primary" dot>{o.status}</Badge>
                      </td>
                      <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenOrderDetail(o)}
                            className="text-[11px] py-1 px-2.5 gap-1 text-slate-600 dark:text-slate-300"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>Ver</span>
                          </Button>
                          {o.status !== "INVOICED" && (
                            <Button
                              size="sm"
                              variant="primary"
                              glow
                              onClick={() => handleConvertOrderToInvoice(o.id || o.orderSeq)}
                              className="text-[11px] py-1 px-2.5 gap-1"
                              title="Facturar Pedido y enviar a CxC"
                            >
                              <Zap className="w-3 h-3 text-amber-300" />
                              <span>Facturar</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PAGE: INVOICES (FACTURAS DE VENTA) */}
      {activeTab === "INVOICES" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por folio de factura, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="font-mono text-xs">
                Total Facturado: {formatCurrency(invoices.reduce((s, i) => s + (i.total || 0), 0))}
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Folio Factura</th>
                  <th className="py-2.5 px-5">Cliente B2B</th>
                  <th className="py-2.5 px-5">Origen / Trazabilidad</th>
                  <th className="py-2.5 px-5">Fecha Emisión</th>
                  <th className="py-2.5 px-5 text-right">Total Factura</th>
                  <th className="py-2.5 px-5 text-right">Saldo Pendiente</th>
                  <th className="py-2.5 px-5 text-center">Estado</th>
                  <th className="py-2.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No hay facturas de venta registradas aún.
                    </td>
                  </tr>
                ) : (
                  invoices
                    .filter((inv) =>
                      (inv.invoiceSeq || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (inv.partnerName || "").toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => handleOpenInvoiceDetail(inv)}
                        className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInvoiceDetail(inv);
                            }}
                            className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40 hover:underline flex items-center gap-1 w-fit"
                            title="Clic para ver detalle y trazabilidad comercial"
                          >
                            <Receipt className="w-3 h-3 inline text-etiserv-blue" />
                            <span>{inv.invoiceSeq}</span>
                          </button>
                        </td>
                        <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                          {inv.partnerName}
                        </td>
                        <td className="py-3 px-5">
                          {inv.originBadgeType === "QUOTE" ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-etiserv-blue bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                              <FileText className="w-3 h-3 text-etiserv-blue" />
                              <span>{inv.originSummary || "Cotización"}</span>
                            </span>
                          ) : inv.originBadgeType === "ORDER" ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200/60 dark:border-purple-900/40">
                              <ShoppingBag className="w-3 h-3 text-purple-600" />
                              <span>{inv.originSummary || "Pedido"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>Venta Directa</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 font-mono text-slate-600 dark:text-slate-300">
                          {inv.date}
                        </td>
                        <td className="py-3 px-5 text-right font-bold tabular-nums text-slate-900 dark:text-white font-mono">
                          {formatCurrency(inv.total || 0)}
                        </td>
                        <td className="py-3 px-5 text-right font-bold tabular-nums font-mono">
                          <span className={inv.amountRemaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {formatCurrency(inv.amountRemaining || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <Badge
                            variant={inv.amountRemaining <= 0 ? "success" : "warning"}
                            dot
                          >
                            {inv.amountRemaining <= 0 ? "Pagada" : "Por Cobrar"}
                          </Badge>
                        </td>
                        <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenInvoiceDetail(inv)}
                              className="text-[11px] py-1 px-2.5 gap-1 text-slate-600 dark:text-slate-300"
                              title="Ver detalle y trazabilidad completa"
                            >
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>Ver</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintInvoiceDirect(inv)}
                              className="text-[11px] py-1 px-2 gap-1 text-slate-700 dark:text-slate-200 hover:border-etiserv-blue"
                              title="Imprimir Factura Fiscal / Ticket Térmico"
                            >
                              <Printer className="w-3 h-3 text-etiserv-blue" />
                              <span>Imprimir</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PAGE 3: PRICE LISTS (CRUD & PARTNER ASSOCIATION) */}
      {activeTab === "PRICE_LISTS" && (
        <div className="space-y-4">
          {/* Filter and Counter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0B2B4C] p-3.5 rounded-xl border border-slate-200 dark:border-white/10">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar tarifa por nombre, código o porcentaje..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {priceLists.length} Tarifas Registradas
              </span>
              <Button
                variant="primary"
                size="sm"
                glow
                onClick={handleOpenCreatePriceList}
                className="gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Tarifa</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {priceLists
              .filter((p) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  (p.name || "").toLowerCase().includes(q) ||
                  (p.code || "").toLowerCase().includes(q) ||
                  String(p.discountPct).includes(q) ||
                  (p.description || "").toLowerCase().includes(q)
                );
              })
              .map((pl) => {
                const assignedPartners = partners.filter((pt) => pt.priceListCode === pl.code);

                return (
                  <Card key={pl.code} className="p-5 flex flex-col justify-between hover:border-etiserv-blue/40 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={pl.discountPct > 0 ? "success" : "neutral"}>
                            {pl.discountPct > 0 ? `-${pl.discountPct}% Descuento` : "Precio Base"}
                          </Badge>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                            {pl.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPriceList(pl)}
                            className="p-1 text-slate-400 hover:text-etiserv-blue hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                            title="Editar Tarifa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {pl.code !== "PUBLIC" && (
                            <button
                              type="button"
                              onClick={() => handleDeletePriceList(pl)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                              title="Eliminar Tarifa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                        {pl.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {pl.description || "Tarifa comercial aplicada automáticamente en cotizaciones y facturas"}
                      </p>

                      {/* Associated Partners Summary */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-etiserv-blue" /> Clientes Asociados
                          </span>
                          <Badge variant={assignedPartners.length > 0 ? "primary" : "neutral"}>
                            {assignedPartners.length} {assignedPartners.length === 1 ? "Cliente" : "Clientes"}
                          </Badge>
                        </div>

                        {assignedPartners.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {assignedPartners.slice(0, 4).map((pt) => (
                              <span
                                key={pt.id}
                                className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 truncate max-w-[140px]"
                                title={pt.name}
                              >
                                {pt.name}
                              </span>
                            ))}
                            {assignedPartners.length > 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                                +{assignedPartners.length - 4} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Ningún cliente asignado directamente
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button: Assign Partners */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssignModal(pl)}
                        className="w-full text-xs font-semibold gap-1.5 justify-center"
                      >
                        <Users className="w-3.5 h-3.5 text-etiserv-blue" />
                        <span>Asociar / Vincular Clientes</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>

          {priceLists.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#0B2B4C] rounded-xl border border-slate-200 dark:border-white/10">
              <Tags className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                No hay listas de precios o tarifas registradas
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Crea listas de precios con descuentos automáticos para mayoreo, distribuidores o clientes VIP.
              </p>
              <Button
                variant="primary"
                size="sm"
                glow
                onClick={handleOpenCreatePriceList}
                className="mt-4 gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Primera Tarifa</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT PRICE LIST */}
      <Modal
        isOpen={priceListModalOpen}
        onClose={() => setPriceListModalOpen(false)}
        title={editingPriceListCode ? "Editar Lista de Precios & Tarifa" : "Nueva Lista de Precios & Tarifa"}
        maxWidth="md"
      >
        <form onSubmit={handleSavePriceList} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código de Tarifa (Único)"
              placeholder="ej. MAYOREO_15, VIP, DISTRIB"
              value={priceListForm.code}
              onChange={(e) => setPriceListForm({ ...priceListForm, code: e.target.value.toUpperCase() })}
              disabled={!!editingPriceListCode}
              required
            />
            <Input
              label="Porcentaje de Descuento (%)"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={priceListForm.discountPct}
              onChange={(e) => setPriceListForm({ ...priceListForm, discountPct: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <Input
            label="Nombre Comercial de la Tarifa"
            placeholder="ej. Tarifa Especial Clientes Frecuentes (-15%)"
            value={priceListForm.name}
            onChange={(e) => setPriceListForm({ ...priceListForm, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Descripción / Condiciones Comerciales
            </label>
            <textarea
              rows={2}
              value={priceListForm.description}
              onChange={(e) => setPriceListForm({ ...priceListForm, description: e.target.value })}
              placeholder="Detalle los requisitos de volumen o facturación para esta tarifa..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <Button type="button" variant="outline" size="sm" onClick={() => setPriceListModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" glow>
              Guardar Lista de Precios
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ASSIGN PARTNERS TO PRICE LIST */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Vincular Clientes a Tarifa: ${targetPriceList?.name}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-600 dark:text-slate-300">
                Los clientes seleccionados tendrán aplicada automáticamente esta tarifa con{" "}
                <strong className="text-etiserv-blue font-bold">
                  {targetPriceList?.discountPct}% de descuento
                </strong>{" "}
                en cotizaciones y ventas.
              </span>
            </div>
            <Badge variant="primary">{assignedPartnerIds.length} Seleccionados</Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar clientes por nombre, RFC o correo..."
              value={partnerFilterQuery}
              onChange={(e) => setPartnerFilterQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {partners
              .filter((p) => {
                if (!partnerFilterQuery) return true;
                const q = partnerFilterQuery.toLowerCase();
                return (
                  (p.name || "").toLowerCase().includes(q) ||
                  (p.taxNbr || "").toLowerCase().includes(q) ||
                  (p.email || "").toLowerCase().includes(q)
                );
              })
              .map((p) => {
                const isSelected = assignedPartnerIds.includes(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePartnerAssignment(p.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/60 dark:bg-blue-950/40 border-etiserv-blue text-slate-900 dark:text-white"
                        : "bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-etiserv-blue border-etiserv-blue text-white"
                            : "border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33]"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>

                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          RFC: {p.taxNbr || "XAXX010101000"} {p.email ? `• ${p.email}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      {p.priceListCode && p.priceListCode !== targetPriceList?.code && (
                        <span className="text-[10px] text-amber-500 font-sans">
                          (Actual: {p.priceListCode})
                        </span>
                      )}
                      {isSelected && (
                        <Badge variant="success">Asignado</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <Button type="button" variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveAssignments}
              loading={savingAssignments}
              glow
            >
              Guardar Asignación ({assignedPartnerIds.length} Clientes)
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: NUEVA COTIZACIÓN B2B (CON TARIFA AUTOMÃ TICA VINCULADA AL CLIENTE) */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title="Crear Nueva Cotización Comercial B2B"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateQuote} className="space-y-4">
          {/* Header Row: Customer Selection with Tied Price List Badge */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCustomerLocked ? (
                  <Badge variant="primary" className="text-[10px] gap-1 font-mono font-bold">
                    <Lock className="w-3 h-3 text-white inline" /> Cliente Enllavado ({validQuoteLines.length} {validQuoteLines.length === 1 ? "artículo agregado" : "artículos agregados"})
                  </Badge>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-slate-400 inline" /> Cliente & Tarifa Asignada
                  </span>
                )}
              </div>

              {isCustomerLocked && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("⚠️ Desbloquear el cliente permitirá cambiarlo. Al seleccionar un nuevo cliente, se recalcularán automáticamente los precios y descuentos según la tarifa vinculada al nuevo cliente. ¿Deseas desbloquear?")) {
                      setIsCustomerUnlocked(true);
                    }
                  }}
                  className="text-xs text-etiserv-blue hover:underline font-semibold flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Desbloquear / Cambiar Cliente</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Autocomplete
                  label="Cliente B2B (Búsqueda Inteligente)"
                  placeholder="Escribe el nombre, empresa o RFC del cliente..."
                  items={partnerItems}
                  value={selectedPartnerId}
                  disabled={isCustomerLocked}
                  onChange={(item) => {
                    setSelectedPartnerId(item.id);
                    const p = partners.find((x) => x.id === item.id);
                    const clientPl = p?.priceListCode || "PUBLIC";
                    const plObj = priceLists.find((pl) => pl.code === clientPl);
                    const discount = plObj ? plObj.discountPct : 0;
                    setQuoteItems((prev) =>
                      prev.map((it) => (it.productId > 0 ? { ...it, discountPct: discount } : it))
                    );
                    setIsCustomerUnlocked(false);
                  }}
                  autoFocus={!isCustomerLocked}
                  required
                />
              </div>

              {/* Automatic Tied Price List Badge */}
              <div className="flex flex-col justify-end">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tarifa Comercial Vinculada
                </span>
                <div className="flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 text-xs h-[38px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Tags className="w-3.5 h-3.5 text-etiserv-blue shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-white truncate" title={currentPriceListObj?.name || "Tarifa Base Pública"}>
                      {currentPriceListObj?.name || "Tarifa Base Pública"}
                    </span>
                  </div>
                  {currentPriceListObj && currentPriceListObj.discountPct > 0 ? (
                    <Badge variant="success" className="text-[10px] shrink-0 font-mono font-bold">
                      -{currentPriceListObj.discountPct}%
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">0%</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Scanner & Barcode Bar with Instant Autocomplete */}
          <div className="relative" ref={quickScanRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickScanInput}
                  onChange={(e) => {
                    setQuickScanInput(e.target.value);
                    setQuickScanOpen(true);
                    setQuickScanHighlightIndex(0);
                  }}
                  onFocus={() => {
                    if (quickScanInput.trim()) setQuickScanOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (quickScanMatches.length > 0) {
                        setQuickScanHighlightIndex((prev) => (prev + 1) % quickScanMatches.length);
                      }
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      if (quickScanMatches.length > 0) {
                        setQuickScanHighlightIndex((prev) => (prev - 1 + quickScanMatches.length) % quickScanMatches.length);
                      }
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      handleQuickScanSubmit();
                    } else if (e.key === "Escape") {
                      setQuickScanOpen(false);
                    }
                  }}
                  placeholder="⚡ Escanear código de barras o escribir nombre/SKU para agregar partida..."
                  className="w-full bg-slate-50 dark:bg-[#06172A] border border-etiserv-blue/40 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-etiserv-blue font-medium"
                />
                <Zap className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickScanSubmit()}
                className="text-xs px-4 font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            {/* Live Floating Dropdown for Quick Scanner */}
            {quickScanOpen && quickScanInput.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                {quickScanMatches.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No se encontraron productos con "{quickScanInput}"
                  </div>
                ) : (
                  quickScanMatches.map((prod, idx) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => addProductToQuote(prod)}
                      className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between text-xs ${
                        idx === quickScanHighlightIndex
                          ? "bg-blue-50 dark:bg-blue-950/60 text-etiserv-blue"
                          : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-900 dark:text-white"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span className="font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-1 rounded">
                            {prod.code}
                          </span>
                          {prod.categoryName && <span>• {prod.categoryName}</span>}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Stock: {prod.stock ?? 99}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <strong className="font-mono text-etiserv-blue text-xs block">
                          {formatCurrency(Number(prod.salePrice || 0))}
                        </strong>
                        <span className="text-[9px] text-slate-400">Clic o Enter</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Items Table in Modal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Partidas Cotizadas ({validQuoteLines.length} Artículos)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuoteItem}
                className="text-xs py-1 gap-1"
              >
                <Plus className="w-3 h-3" /> Fila Manual
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {quoteItems.map((item, idx) => (
                <SearchableProductRow
                  key={idx}
                  item={item}
                  index={idx}
                  products={products}
                  onSelect={handleProductSelect}
                  onUpdateQty={(i, qty) => {
                    const updated = [...quoteItems];
                    updated[i].qty = qty;
                    setQuoteItems(updated);
                  }}
                  onUpdateUnitPrice={(i, price) => {
                    const updated = [...quoteItems];
                    updated[i].unitPrice = price;
                    setQuoteItems(updated);
                  }}
                  onUpdateDiscount={(i, dPct) => {
                    const updated = [...quoteItems];
                    updated[i].discountPct = dPct;
                    setQuoteItems(updated);
                  }}
                  onRemove={handleRemoveQuoteItem}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>

          {/* Financial Breakdown & Totals Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 text-slate-500">
              <div>
                Subtotal Bruto: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(grossSubtotal)}</strong>
              </div>
              <div>
                Descuento de Tarifa ({currentPriceListObj?.name || "Base"}):{" "}
                <strong className="font-mono text-emerald-600">
                  -{formatCurrency(totalDiscountAmount)}
                </strong>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-slate-500">
                IVA Trasladado (16%): <span className="font-mono">{formatCurrency(vatTax)}</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                Total Cotizado: <span className="text-etiserv-blue">{formatCurrency(quoteGrandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Notas & Términos Comerciales de la Cotización
            </label>
            <input
              type="text"
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder="ej. Precios en MXN válidos por 15 días, entrega incluida en sucursal..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuoteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingQuote}
              glow
              className="font-semibold gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Emitir Cotización ({formatCurrency(quoteGrandTotal)})</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VER DETALLE / EDITAR COTIZACIÓN B2B */}
      <Modal
        isOpen={quoteDetailModalOpen}
        onClose={() => {
          setQuoteDetailModalOpen(false);
          setSelectedQuote(null);
          setIsEditingQuote(false);
        }}
        title={
          selectedQuote
            ? `${isEditingQuote ? "✏️ Editar" : "🔍 Detalle de"} Cotización: ${selectedQuote.quoteSeq}`
            : "Detalle de Cotización"
        }
        maxWidth="xl"
      >
        {selectedQuote && (
          <div className="space-y-4">
            {/* Header Status Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                  {selectedQuote.quoteSeq}
                </span>
                <Badge
                  variant={
                    selectedQuote.status === "WON" || selectedQuote.status === "CONVERTED"
                      ? "success"
                      : selectedQuote.status === "SENT"
                      ? "primary"
                      : "warning"
                  }
                >
                  {selectedQuote.status === "DRAFT"
                    ? "Borrador"
                    : selectedQuote.status === "SENT"
                    ? "Enviada"
                    : selectedQuote.status === "WON" || selectedQuote.status === "CONVERTED"
                    ? "Convertida a Pedido"
                    : selectedQuote.status}
                </Badge>
                <Badge variant="neutral">Tarifa: {selectedQuote.priceListCode}</Badge>
              </div>

              {/* Edit Mode Switcher for Drafts */}
              {(selectedQuote.status === "DRAFT" || !selectedQuote.status) && (
                <div>
                  {isEditingQuote ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingQuote(false)}
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
                      onClick={() => setIsEditingQuote(true)}
                      className="text-xs gap-1 text-etiserv-blue border-etiserv-blue/40 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Borrador</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* EDIT MODE */}
            {isEditingQuote ? (
              <form onSubmit={handleSaveQuoteEdit} className="space-y-4">
                {/* Customer & Price List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                  <div>
                    <Autocomplete
                      label="Cliente B2B (Búsqueda Inteligente)"
                      placeholder="Selecciona o busca un cliente..."
                      searchPlaceholder="Escribe nombre, empresa o RFC..."
                      items={partnerItems}
                      value={editPartnerId}
                      onChange={(item) => setEditPartnerId(item.id)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Tarifa / Lista de Precios
                    </label>
                    <select
                      value={editPriceListCode}
                      onChange={(e) => setEditPriceListCode(e.target.value)}
                      className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] p-2 text-slate-900 dark:text-white"
                    >
                      {priceLists.map((pl) => (
                        <option key={pl.code} value={pl.code}>
                          {pl.name} ({pl.discountPct}% desc)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items List in Edit Mode */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Partidas de la Cotización ({editQuoteLines.filter((l) => l.productId > 0).length} Artículos)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditQuoteLines([
                          ...editQuoteLines,
                          { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 },
                        ])
                      }
                      className="text-xs py-1 gap-1"
                    >
                      <Plus className="w-3 h-3" /> Fila Manual
                    </Button>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {editQuoteLines.map((line, idx) => (
                      <SearchableProductRow
                        key={idx}
                        item={line}
                        index={idx}
                        products={products}
                        onSelect={(index, prod) => {
                          const updated = [...editQuoteLines];
                          updated[index] = {
                            productId: prod.id,
                            productName: prod.name,
                            productCode: prod.code,
                            qty: updated[index]?.qty || 1,
                            unitPrice: Number(prod.salePrice || 0),
                            discountPct: updated[index]?.discountPct || 0,
                          };
                          setEditQuoteLines(updated);
                        }}
                        onUpdateQty={(index, qty) => {
                          const updated = [...editQuoteLines];
                          updated[index].qty = qty;
                          setEditQuoteLines(updated);
                        }}
                        onUpdateUnitPrice={(index, price) => {
                          const updated = [...editQuoteLines];
                          updated[index].unitPrice = price;
                          setEditQuoteLines(updated);
                        }}
                        onUpdateDiscount={(index, dPct) => {
                          const updated = [...editQuoteLines];
                          updated[index].discountPct = dPct;
                          setEditQuoteLines(updated);
                        }}
                        onRemove={(index) => {
                          if (editQuoteLines.length <= 1) {
                            setEditQuoteLines([{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 }]);
                          } else {
                            setEditQuoteLines(editQuoteLines.filter((_, i) => i !== index));
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
                      Observaciones / Condiciones Comerciales
                    </label>
                    <textarea
                      rows={2}
                      value={editQuoteNotes}
                      onChange={(e) => setEditQuoteNotes(e.target.value)}
                      placeholder="Notas sobre tiempo de entrega, flete, validez..."
                      className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {(() => {
                    const valid = editQuoteLines.filter((l) => l.productId > 0);
                    const gross = valid.reduce((sum, it) => sum + (it.qty || 1) * (it.unitPrice || 0), 0);
                    const net = valid.reduce(
                      (sum, it) => sum + (it.qty || 1) * (it.unitPrice || 0) * (1 - (it.discountPct || 0) / 100),
                      0
                    );
                    const discount = gross - net;
                    const tax = net * 0.16;
                    const total = net + tax;

                    return (
                      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal Bruto:</span>
                          <span>{formatCurrency(gross)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Descuento Comercial:</span>
                            <span>-{formatCurrency(discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500">
                          <span>IVA Trasladado (16%):</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                          <span>Total Cotización:</span>
                          <span className="text-etiserv-blue">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Edit Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingQuote(false)}
                  >
                    Cancelar Edición
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    glow
                    loading={savingQuoteEdit}
                    className="flex-1"
                  >
                    💾 Guardar Cambios en Borrador
                  </Button>
                </div>
              </form>
            ) : (
              /* VIEW MODE */
              <div className="space-y-4">
                {/* Customer & Quote Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Cliente B2B
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedQuote.partnerName}
                    </div>
                    <div className="text-slate-500 font-mono">
                      Tarifa: <strong>{selectedQuote.priceListCode}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Vigencia & Emisión
                    </span>
                    <div className="text-slate-700 dark:text-slate-300">
                      Fecha: <strong className="text-slate-900 dark:text-white font-mono">{selectedQuote.date}</strong>
                    </div>
                    <div className="text-slate-500 font-mono">
                      Válido hasta: {selectedQuote.validUntil}
                    </div>
                  </div>
                </div>

                {/* Items List (Double-Line Standard Layout) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Partidas & Productos Cotizados
                  </span>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(selectedQuote.items || []).map((item, idx) => {
                      const qty = item.qty || 1;
                      const price = Number(item.unitPrice || 0);
                      const discount = Number(item.discountPct || 0);
                      const netTotal = qty * price * (1 - discount / 100);

                      return (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2"
                        >
                          {/* Fila 1: SKU & Nombre */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                              {item.productCode || `SKU-${item.productId}`}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate">
                                {item.productName}
                              </span>
                            </div>
                          </div>

                          {/* Fila 2: Cantidad, Precio, Descuento y Total */}
                          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-white/5 items-center text-xs font-mono">
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
                                Precio Unit.
                              </span>
                              <span className="text-slate-700 dark:text-slate-300">
                                {formatCurrency(price)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-sans block">
                                Descuento
                              </span>
                              <span className={discount > 0 ? "font-bold text-emerald-600" : "text-slate-400"}>
                                {discount}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-sans block">
                                Importe Neto
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(netTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes & Totals Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Observaciones / Notas
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 italic">
                      {selectedQuote.notes || "Sin observaciones adicionales"}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal Neto:</span>
                      <span>{formatCurrency(selectedQuote.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>IVA Trasladado (16%):</span>
                      <span>{formatCurrency(selectedQuote.taxAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                      <span>Total General:</span>
                      <span className="text-etiserv-blue">{formatCurrency(selectedQuote.total || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    {(selectedQuote.status === "DRAFT" || !selectedQuote.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuote(selectedQuote.id || selectedQuote.quoteSeq)}
                        loading={deletingQuote}
                        className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Borrador</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintQuoteDirect(selectedQuote)}
                      className="text-xs gap-1.5 text-slate-700 dark:text-slate-200 hover:border-etiserv-blue"
                      title="Imprimir formato membretado o ticket"
                    >
                      <Printer className="w-3.5 h-3.5 text-etiserv-blue" />
                      <span>Imprimir</span>
                    </Button>

                    {(selectedQuote.status === "DRAFT" || !selectedQuote.status) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingQuote(true)}
                        className="text-xs gap-1 text-etiserv-blue border-etiserv-blue/40"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </Button>
                    )}

                    {selectedQuote.status !== "CONVERTED" && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await handleConvertToOrder(selectedQuote.id || selectedQuote.quoteSeq);
                            setQuoteDetailModalOpen(false);
                          }}
                          className="text-xs gap-1.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-etiserv-blue" />
                          <span>Convertir a Pedido</span>
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          glow
                          size="sm"
                          onClick={async () => {
                            await handleConvertToInvoice(selectedQuote.id || selectedQuote.quoteSeq);
                            setQuoteDetailModalOpen(false);
                          }}
                          className="text-xs gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Facturar 1-Clic</span>
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

      {/* MODAL: VER DETALLE DE PEDIDO B2B */}
      <Modal
        isOpen={b2bOrderDetailModalOpen}
        onClose={() => {
          setB2bOrderDetailModalOpen(false);
          setSelectedB2BOrder(null);
        }}
        title={
          selectedB2BOrder
            ? `🔍 Detalle de Pedido B2B: ${selectedB2BOrder.orderSeq}`
            : "Detalle de Pedido B2B"
        }
        maxWidth="xl"
      >
        {selectedB2BOrder && (
          <div className="space-y-4">
            {/* Header Status Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                  {selectedB2BOrder.orderSeq}
                </span>
                <Badge variant="primary" dot>
                  {selectedB2BOrder.status === "DELIVERED"
                    ? "Entregado"
                    : selectedB2BOrder.status === "INVOICED"
                    ? "Facturado"
                    : "Confirmado"}
                </Badge>
                {selectedB2BOrder.quoteSeq && (
                  <Badge variant="neutral" className="font-mono text-[10px]">
                    Cotización: {selectedB2BOrder.quoteSeq}
                  </Badge>
                )}
              </div>

              <div>
                {selectedB2BOrder.creditWarning ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{selectedB2BOrder.creditWarning}</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Crédito Autorizado</span>
                  </span>
                )}
              </div>
            </div>

            {/* Customer & Conditions Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Cliente B2B
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedB2BOrder.partnerName}
                </div>
                <div className="text-slate-500">
                  Condición: <strong>{selectedB2BOrder.paymentTerms === "30_DIAS_CREDITO" ? "30 Días Crédito" : selectedB2BOrder.paymentTerms || "Contado"}</strong>
                </div>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Emisión & Despacho
                </span>
                <div className="text-slate-700 dark:text-slate-300">
                  Fecha: <strong className="text-slate-900 dark:text-white font-mono">{selectedB2BOrder.date}</strong>
                </div>
                <div className="text-slate-500 font-mono">
                  Moneda: MXN
                </div>
              </div>
            </div>

            {/* Items List (Double-Line Standard Layout) */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Partidas & Artículos del Pedido
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(selectedB2BOrder.items || []).map((item, idx) => {
                  const qty = item.qty || 1;
                  const price = Number(item.unitPrice || 0);
                  const discount = Number(item.discountPct || 0);
                  const netTotal = qty * price * (1 - discount / 100);

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs space-y-2"
                    >
                      {/* Fila 1: SKU & Nombre */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50 shrink-0">
                          {item.productCode || `SKU-${item.productId}`}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate">
                            {item.productName}
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Cantidad, Precio, Descuento y Total */}
                      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-white/5 items-center text-xs font-mono">
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
                            Precio
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {formatCurrency(price)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">
                            Descuento
                          </span>
                          <span className={discount > 0 ? "font-bold text-emerald-600" : "text-slate-400"}>
                            {discount}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-sans block">
                            Importe Neto
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(netTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes & Financial Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Notas de Entrega / Despacho
                </span>
                <p className="text-slate-600 dark:text-slate-300 italic">
                  {selectedB2BOrder.notes || "Sin instrucciones especiales de entrega"}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Neto:</span>
                  <span>{formatCurrency(selectedB2BOrder.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA Trasladado (16%):</span>
                  <span>{formatCurrency(selectedB2BOrder.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                  <span>Total Pedido:</span>
                  <span className="text-etiserv-blue">{formatCurrency(selectedB2BOrder.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setB2bOrderDetailModalOpen(false);
                  setSelectedB2BOrder(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
            {/* MODAL: VER DETALLE & TRAZABILIDAD DE FACTURA FISCAL */}
      <Modal
        isOpen={invoiceDetailModalOpen}
        onClose={() => {
          setInvoiceDetailModalOpen(false);
          setSelectedInvoice(null);
        }}
        title={
          selectedInvoice
            ? `🧾 Factura Fiscal & Trazabilidad: ${selectedInvoice.invoiceSeq}`
            : "Detalle de Factura"
        }
        maxWidth="2xl"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            {/* Header Status Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                  {selectedInvoice.invoiceSeq}
                </span>
                <Badge
                  variant={selectedInvoice.amountRemaining <= 0 ? "success" : "warning"}
                  dot
                >
                  {selectedInvoice.amountRemaining <= 0 ? "Pagada / Liquidada" : "Por Cobrar / Abierta"}
                </Badge>
                <Badge
                  variant={selectedInvoice.tracking?.isDirectSale ? "neutral" : "primary"}
                >
                  {selectedInvoice.tracking?.isDirectSale ? "⚡ Venta Directa (Sin antecedentes)" : "🏢 Flujo Comercial B2B"}
                </Badge>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Factura</span>
                <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  {formatCurrency(selectedInvoice.total || 0)}
                </span>
              </div>
            </div>

            {/* SECCIÓN DE TRAZABILIDAD COMERCIAL (TIMELINE / STEPPER) */}
            <div className="bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4 text-etiserv-blue" />
                  <span>Árbol de Trazabilidad Comercial (Ciclo de Venta)</span>
                </span>
                {selectedInvoice.tracking?.isDirectSale ? (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 dark:bg-white/10 px-2 py-0.5 rounded">
                    Factura Directa
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/40">
                    Ciclo B2B Trazable
                  </span>
                )}
              </div>

              {selectedInvoice.tracking?.isDirectSale ? (
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <strong className="block font-semibold">Venta Directa de Mostrador / POS</strong>
                    <span className="text-[11px] text-amber-700/90 dark:text-amber-300/90">
                      Esta factura fue emitida directamente en caja o venta rápida, por lo cual no cuenta con cotización comercial ni pedido previo asociado.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Step 1: Cotización */}
                  <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                    selectedInvoice.tracking?.quote
                      ? "bg-white dark:bg-white/[0.04] border-blue-200/80 dark:border-blue-900/40"
                      : "bg-slate-100/60 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/5 opacity-60"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-500 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-etiserv-blue" />
                        <span>1. Cotización</span>
                      </span>
                      {selectedInvoice.tracking?.quote ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">N/A</span>
                      )}
                    </div>
                    {selectedInvoice.tracking?.quote ? (
                      <>
                        <span className="font-mono font-bold text-xs text-etiserv-blue block">
                          {selectedInvoice.tracking.quote.quoteSeq}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Fecha: {selectedInvoice.tracking.quote.date}
                        </div>
                        <div className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                          Monto: {formatCurrency(selectedInvoice.tracking.quote.total)}
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic block">Sin cotización previa</span>
                    )}
                  </div>

                  {/* Step 2: Pedido */}
                  <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                    selectedInvoice.tracking?.order
                      ? "bg-white dark:bg-white/[0.04] border-purple-200/80 dark:border-purple-900/40"
                      : "bg-slate-100/60 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/5 opacity-60"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-500 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-purple-500" />
                        <span>2. Pedido B2B</span>
                      </span>
                      {selectedInvoice.tracking?.order ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">N/A</span>
                      )}
                    </div>
                    {selectedInvoice.tracking?.order ? (
                      <>
                        <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400 block">
                          {selectedInvoice.tracking.order.orderSeq}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Fecha: {selectedInvoice.tracking.order.date}
                        </div>
                        <div className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {selectedInvoice.tracking.order.paymentTerms || "30 Días Crédito"}
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic block">Facturación directa</span>
                    )}
                  </div>

                  {/* Step 3: Factura */}
                  <div className="p-3 rounded-lg border bg-white dark:bg-white/[0.04] border-emerald-200/80 dark:border-emerald-900/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-500 flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-emerald-500" />
                        <span>3. Factura Fiscal</span>
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 block">
                      {selectedInvoice.invoiceSeq}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Emitida: {selectedInvoice.date}
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                      Total: {formatCurrency(selectedInvoice.total)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Datos del Cliente y Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Receptor / Cliente Fiscal
                </span>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {selectedInvoice.partnerName}
                </span>
                <span className="text-slate-400 text-[11px]">
                  Empresa Emisora: {activeCompany?.name || "Distribuidora Nacional PyME S.A."}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Fecha Emisión
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white block">
                    {selectedInvoice.date}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Vencimiento
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white block">
                    {selectedInvoice.dueDate || selectedInvoice.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Partidas Facturadas */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Conceptos & Partidas Facturadas ({selectedInvoice.items?.length || 1} artículos)
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                  selectedInvoice.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                            {it.productCode || `SKU-${it.productId}`}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {it.productName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Cantidad: {it.qty} • P. Unit: {formatCurrency(it.unitPrice)} {it.discountPct > 0 ? `• Dto: ${it.discountPct}%` : ""}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(it.qty * it.unitPrice * (1 - (it.discountPct || 0) / 100))}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {selectedInvoice.notes || "Facturación Comercial de Mercancía / Servicios B2B"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">1 Partida General</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(selectedInvoice.subtotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Totales y Estado de Cartera */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs space-y-1 font-mono">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Estado de Cobranza (CxC)
                </span>
                <div className="flex justify-between text-slate-500">
                  <span>Monto Pagado / Acreditado:</span>
                  <span className="text-emerald-600 font-semibold">{formatCurrency(selectedInvoice.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Saldo Pendiente de Cobro:</span>
                  <span className={`font-bold ${selectedInvoice.amountRemaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {formatCurrency(selectedInvoice.amountRemaining || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Neto:</span>
                  <span>{formatCurrency(selectedInvoice.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA Trasladado (16%):</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                  <span>Total Factura:</span>
                  <span className="text-etiserv-blue">{formatCurrency(selectedInvoice.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePrintInvoiceDirect(selectedInvoice)}
                className="text-xs gap-1.5 text-etiserv-blue border-etiserv-blue/40"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Factura Fiscal / Ticket</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
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

      {/* MODAL: EMITIR FACTURA RÁPIDA B2B (DIRECTA) */}
      <Modal
        isOpen={directInvoiceModalOpen}
        onClose={() => setDirectInvoiceModalOpen(false)}
        title="⚡ Factura Rápida B2B (Emisión Directa)"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitDirectInvoice} className="space-y-4">
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <strong className="block font-semibold">Emisión Inmediata de Pedido y Factura</strong>
              <span className="text-[11px] text-amber-700/90 dark:text-amber-300/90">
                Esta acción genera el Pedido de Venta B2B y la Factura Fiscal en un solo paso, dejando registro en ambos grupos y enviando el saldo a Cuentas por Cobrar.
              </span>
            </div>
          </div>

          {/* Customer & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <div>
              <Autocomplete
                label="Cliente B2B / Receptor Fiscal"
                placeholder="Selecciona o busca un cliente..."
                searchPlaceholder="Escribe nombre, empresa o RFC..."
                items={partnerItems}
                value={directInvoicePartnerId}
                onChange={(item) => {
                  setDirectInvoicePartnerId(item.id);
                  const p = partners.find((pt) => Number(pt.id) === Number(item.id));
                  const plCode = p?.priceListCode || "PUBLIC";
                  const plObj = priceLists.find((pl) => pl.code === plCode);
                  const discPct = plObj ? plObj.discountPct : 0;
                  setDirectInvoiceItems((prev) =>
                    prev.map((line) => ({ ...line, discountPct: discPct }))
                  );
                }}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Condiciones Comerciales de Pago
              </label>
              <select
                value={directInvoicePaymentTerms}
                onChange={(e) => setDirectInvoicePaymentTerms(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] p-2 text-slate-900 dark:text-white"
              >
                <option value="CONTADO">Contado / Pago Inmediato</option>
                <option value="30_DIAS_CREDITO">30 Días de Crédito Comercial</option>
                <option value="15_DIAS_CREDITO">15 Días de Crédito Comercial</option>
                <option value="60_DIAS_CREDITO">60 Días de Crédito Comercial</option>
              </select>
            </div>
          </div>

          {/* Products & Lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Conceptos & Artículos a Facturar
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDirectInvoiceItem}
                className="text-xs gap-1 py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Producto</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {directInvoiceItems.map((item, idx) => (
                <SearchableProductRow
                  key={idx}
                  index={idx}
                  item={item}
                  products={products}
                  onSelect={handleDirectInvoiceProductSelect}
                  onUpdateQty={(i, q) => {
                    const u = [...directInvoiceItems];
                    u[i].qty = q;
                    setDirectInvoiceItems(u);
                  }}
                  onUpdateUnitPrice={(i, p) => {
                    const u = [...directInvoiceItems];
                    u[i].unitPrice = p;
                    setDirectInvoiceItems(u);
                  }}
                  onUpdateDiscount={(i, d) => {
                    const u = [...directInvoiceItems];
                    u[i].discountPct = d;
                    setDirectInvoiceItems(u);
                  }}
                  onRemove={handleRemoveDirectInvoiceItem}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          {(() => {
            const vLines = directInvoiceItems.filter((it) => it.productId > 0);
            const netSub = vLines.reduce(
              (sum, it) => sum + (it.qty || 1) * (it.unitPrice || 0) * (1 - (it.discountPct || 0) / 100),
              0
            );
            const vat = netSub * 0.16;
            const grandTotal = netSub + vat;

            return (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex-1">
                  <input
                    type="text"
                    value={directInvoiceNotes}
                    onChange={(e) => setDirectInvoiceNotes(e.target.value)}
                    placeholder="Notas fiscales u observaciones (opcional)..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white"
                  />
                </div>
                <div className="text-right font-mono space-y-0.5">
                  <div className="text-slate-500 text-[11px]">
                    Subtotal: {formatCurrency(netSub)} | IVA: {formatCurrency(vat)}
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    Total: <span className="text-etiserv-blue">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDirectInvoiceModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingDirectInvoice}
              glow
              className="font-semibold gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ Emitir Pedido & Factura Ahora</span>
            </Button>
          </div>
        </form>
      </Modal>

{/* Thermal Ticket & Factura Modal */}
      {ticketData && (
        <ThermalTicketModal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          ticketData={ticketData}
        />
      )}
    </div>
  );
};

export default SalesB2BView;
