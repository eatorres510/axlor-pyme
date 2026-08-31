import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Receipt,
  Calculator,
  ChevronDown,
  ChevronUp,
  Coins,
  Banknote,
  RotateCcw,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  Lock,
  Unlock,
  Printer,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  History,
  Eye,
  Zap,
  CheckCheck,
  Truck,
  ArrowRight,
  Clock,
  Building2,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { catalogApi } from "../api/catalogApi";
import { posApi } from "../api/posApi";
import { financeApi } from "../api/financeApi";
import { salesApi } from "../api/salesApi";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Autocomplete, AutocompleteItem } from "../components/ui/Autocomplete";
import { ThermalTicketModal } from "../components/layout/ThermalTicketModal";
import { DocumentDetailModal } from "../components/modals/DocumentDetailModal";
import { formatCurrency } from "../utils/formatters";

interface CartItem {
  productId: number;
  name: string;
  code?: string;
  categoryName?: string;
  barCode?: string;
  price: number;
  qty: number;
  stock: number;
}

const BILL_DENOMINATIONS = [1000, 500, 200, 100, 50, 20];
const COIN_DENOMINATIONS = [10, 5, 2, 1];

export const POSView: React.FC = () => {
  const { activeCompany, currencySymbol, denominations } = useCompany();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | string>(0);
  const [isCustomerUnlocked, setIsCustomerUnlocked] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [amountPaidStr, setAmountPaidStr] = useState<string>("");
  const [denominationCounts, setDenominationCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });
  const [showDetailedDenominations, setShowDetailedDenominations] = useState<boolean>(false);
  const [loadingCheckout, setLoadingCheckout] = useState<boolean>(false);
  const [ticketModalOpen, setTicketModalOpen] = useState<boolean>(false);
  const [ticketData, setTicketData] = useState<any>(null);

  // Historial de Recibos & Tickets POS del Día
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [ticketsHistory, setTicketsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");

  // Paginación POS para catálogo de alto volumen (4000-5000 productos)
  const [posPage, setPosPage] = useState<number>(1);
  const posPageSize = 24;

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadTicketsHistory = async () => {
    if (!activeCompany) return;
    try {
      setLoadingHistory(true);
      const data = await posApi.listTickets(activeCompany.id);
      setTicketsHistory(data || []);
    } catch (err) {
      console.error("Error al cargar historial de tickets:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Pestañas POS: Mostrador vs Cobro de Facturas B2B
  const [posTab, setPosTab] = useState<"COUNTER" | "B2B_INVOICES">("COUNTER");
  const [b2bInvoices, setB2bInvoices] = useState<any[]>([]);
  const [loadingB2BInvoices, setLoadingB2BInvoices] = useState<boolean>(false);
  const [b2bSearch, setB2bSearch] = useState<string>("");
  const [b2bStatusFilter, setB2bStatusFilter] = useState<"ALL" | "PENDING" | "PAID">("PENDING");

  // Modal Cobro Factura B2B en Caja
  const [b2bPayModalOpen, setB2bPayModalOpen] = useState<boolean>(false);
  const [selectedB2BInvoice, setSelectedB2BInvoice] = useState<any | null>(null);
  const [b2bPayAmount, setB2bPayAmount] = useState<string>("");
  const [b2bPayMethod, setB2bPayMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [b2bTenderedAmount, setB2bTenderedAmount] = useState<string>("");
  const [submittingB2BPayment, setSubmittingB2BPayment] = useState<boolean>(false);

  // Document Detail Modal
  const [docModalOpen, setDocModalOpen] = useState<boolean>(false);
  const [selectedDocMovement, setSelectedDocMovement] = useState<any | null>(null);

  const loadB2BInvoices = async () => {
    if (!activeCompany) return;
    try {
      setLoadingB2BInvoices(true);
      const [agingData, quotesData] = await Promise.all([
        financeApi.getAgingReport(activeCompany.id, "CUSTOMER").catch(() => null),
        salesApi.listQuotes(activeCompany.id).catch(() => []),
      ]);

      const items: any[] = [];
      const seenIds = new Set<string>();

      // 1. Facturas abiertas desde Aging / CxC
      if (agingData && Array.isArray(agingData.buckets)) {
        for (const b of agingData.buckets) {
          for (const it of b.items || []) {
            const key = `INV-${it.invoiceId || it.invoiceNumber}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              items.push({
                id: it.invoiceId,
                folio: it.invoiceNumber,
                quoteSeq: it.invoiceNumber,
                partnerId: it.partnerId,
                partnerName: it.partnerName,
                taxNbr: it.partnerTaxNbr,
                date: it.invoiceDate,
                dueDate: it.dueDate,
                totalAmount: it.totalAmount,
                amountRemaining: it.amountRemaining,
                status: it.amountRemaining <= 0 ? "PAID" : "PENDING",
                source: "INVOICE",
                items: [
                  {
                    productName: `Factura ${it.invoiceNumber} - Saldo CxC`,
                    qty: 1,
                    unitPrice: it.amountRemaining,
                    total: it.amountRemaining,
                  },
                ],
              });
            }
          }
        }
      }

      // 2. Cotizaciones convertidas a facturas / pendientes
      for (const q of quotesData) {
        const key = `QUO-${q.id || q.quoteSeq}`;
        if (!seenIds.has(key) && (q.status === "CONVERTED" || q.status === "WON" || q.status === "SENT")) {
          seenIds.add(key);
          items.push({
            id: q.id,
            folio: q.convertedOrderId ? `FAC-${q.convertedOrderId}` : `FAC-2026-${String(q.id).padStart(5, "0")}`,
            quoteSeq: q.quoteSeq,
            partnerId: q.partnerId,
            partnerName: q.partnerName,
            date: q.date,
            dueDate: q.validUntil,
            totalAmount: q.total,
            amountRemaining: q.total,
            status: "PENDING",
            source: "QUOTE",
            items: (q.items || []).map((it) => ({
              productName: it.productName || "Producto B2B",
              qty: it.qty || 1,
              unitPrice: it.unitPrice || 0,
              total: (it.qty || 1) * (it.unitPrice || 0) * (1 - (it.discountPct || 0) / 100),
            })),
          });
        }
      }

      setB2bInvoices(items);
    } catch (err) {
      console.error("Error al cargar facturas B2B en Caja:", err);
    } finally {
      setLoadingB2BInvoices(false);
    }
  };

  const handleOpenPayB2BInvoice = (inv: any) => {
    setSelectedB2BInvoice(inv);
    const amount = String(inv.amountRemaining || inv.totalAmount || 0);
    setB2bPayAmount(amount);
    setB2bTenderedAmount(amount);
    setB2bPayMethod("CASH");
    setB2bPayModalOpen(true);
  };

  const handleProcessB2BPayment = async () => {
    if (!selectedB2BInvoice || !activeCompany) return;
    const payNum = parseFloat(b2bPayAmount) || 0;
    if (payNum <= 0) {
      alert("Ingrese un monto válido a cobrar");
      return;
    }

    try {
      setSubmittingB2BPayment(true);
      const invoiceIdNum = typeof selectedB2BInvoice.id === "number" ? selectedB2BInvoice.id : parseInt(String(selectedB2BInvoice.id).replace(/\D/g, ""), 10) || 1;

      try {
        await financeApi.recordPayment(invoiceIdNum, {
          companyId: activeCompany.id,
          amount: payNum,
          paymentMethod: b2bPayMethod,
          paymentDate: new Date().toISOString().slice(0, 10),
        });
      } catch (e) {
        console.warn("Axelor direct invoice pay fallback:", e);
      }

      const tendered = parseFloat(b2bTenderedAmount) || payNum;
      const change = Math.max(0, tendered - payNum);

      setTicketData({
        ticketNumber: selectedB2BInvoice.folio || selectedB2BInvoice.quoteSeq || `REC-2026-${Date.now().toString().slice(-5)}`,
        docTypeLabel: "FACTURA / RECIBO DE COBRO",
        companyName: activeCompany.name,
        companyTaxId: activeCompany.taxId,
        branchName: "Caja Mostrador Principal 01",
        clientName: selectedB2BInvoice.partnerName,
        clientTaxId: selectedB2BInvoice.taxNbr || "XAXX010101000",
        date: new Date().toLocaleString("es-MX"),
        items:
          selectedB2BInvoice.items?.length > 0
            ? selectedB2BInvoice.items
            : [{ productName: `Cobro Factura ${selectedB2BInvoice.folio}`, qty: 1, unitPrice: payNum, total: payNum }],
        subtotal: Number((payNum / 1.16).toFixed(2)),
        taxAmount: Number((payNum - payNum / 1.16).toFixed(2)),
        total: payNum,
        paymentMethod: b2bPayMethod,
        amountPaid: tendered,
        change: change,
      });

      // Update local status to PAID
      setB2bInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedB2BInvoice.id || inv.folio === selectedB2BInvoice.folio
            ? { ...inv, status: "PAID", amountRemaining: Math.max(0, (inv.amountRemaining || inv.totalAmount) - payNum) }
            : inv
        )
      );

      setB2bPayModalOpen(false);
      setSelectedB2BInvoice(null);
      setTicketModalOpen(true);
      loadTicketsHistory();
    } catch (err: any) {
      alert(`Error al registrar cobro: ${err.message}`);
    } finally {
      setSubmittingB2BPayment(false);
    }
  };

  const handlePrintB2BDirect = (inv: any) => {
    if (!activeCompany) return;
    const total = Number(inv.totalAmount || inv.amountRemaining || 0);
    setTicketData({
      ticketNumber: inv.folio || inv.quoteSeq || "FAC-2026-00001",
      docTypeLabel: "FACTURA B2B / REMISIÓN",
      companyName: activeCompany.name,
      companyTaxId: activeCompany.taxId,
      branchName: "Caja Mostrador Principal 01",
      clientName: inv.partnerName,
      clientTaxId: inv.taxNbr || "XAXX010101000",
      date: new Date().toLocaleString("es-MX"),
      items:
        inv.items?.length > 0
          ? inv.items
          : [{ productName: `Factura ${inv.folio}`, qty: 1, unitPrice: total, total: total }],
      subtotal: Number((total / 1.16).toFixed(2)),
      taxAmount: Number((total - total / 1.16).toFixed(2)),
      total: total,
      paymentMethod: inv.status === "PAID" ? "PAGADO" : "PENDIENTE DE PAGO",
      amountPaid: total,
      change: 0,
    });
    setTicketModalOpen(true);
  };

  const loadCatalog = async () => {
    if (!activeCompany) return;
    try {
      const [prodData, catData, partnersData] = await Promise.all([
        catalogApi.listProducts(activeCompany.id),
        catalogApi.listCategories(),
        catalogApi.listPartners(activeCompany.id),
      ]);
      setProducts(prodData || []);
      setCategories(catData || []);
      setPartners(partnersData || []);
      loadTicketsHistory();
      loadB2BInvoices();
    } catch (err) {
      console.error("Error al cargar datos POS:", err);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [activeCompany]);

  useEffect(() => {
    setPosPage(1);
  }, [search, selectedCategory]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    try {
      const prod = await catalogApi.getProductByBarcode(search.trim());
      if (prod) {
        addToCart(prod);
        setSearch("");
      }
    } catch {
      // Keep search filter active
    }
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          code: product.code || `SKU-${product.id}`,
          categoryName: product.categoryName,
          barCode: product.barCode,
          price: Number(product.salePrice || 0),
          qty: 1,
          stock: product.currentStock ?? 99,
        },
      ];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      if (updated.length === 0) setIsCustomerUnlocked(false);
      return updated;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.productId !== productId);
      if (updated.length === 0) setIsCustomerUnlocked(false);
      return updated;
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "ALL" || p.category === selectedCategory || p.category?.name === selectedCategory;
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.barCode?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxAmount = subtotal * 0.16;
  const total = subtotal + taxAmount;

  // Multi-denomination bill & coin counter logic
  const handleAddBill = (denom: number) => {
    const currentVal = parseFloat(amountPaidStr) || 0;
    const newVal = currentVal + denom;
    setAmountPaidStr(newVal.toFixed(2));
    setDenominationCounts((prev) => ({
      ...prev,
      [denom]: (prev[denom] || 0) + 1,
    }));
  };

  const handleUpdateDenomination = (denom: number, count: number) => {
    const safeCount = Math.max(0, count);
    const updated = {
      ...denominationCounts,
      [denom]: safeCount,
    };
    setDenominationCounts(updated);

    const calculatedSum = Object.entries(updated).reduce(
      (sum, [d, c]) => sum + Number(d) * Number(c),
      0
    );
    setAmountPaidStr(calculatedSum > 0 ? calculatedSum.toFixed(2) : "");
  };

  const handleClearCash = () => {
    setAmountPaidStr("");
    setDenominationCounts({
      1000: 0,
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
      5: 0,
      2: 0,
      1: 0,
    });
  };

  // Exact amount shortcut
  const handleExactCash = () => {
    handleClearCash();
    setAmountPaidStr(total > 0 ? total.toFixed(2) : "0");
  };

  const amountPaid = parseFloat(amountPaidStr) || 0;
  const change = Math.max(0, amountPaid - total);

  // Customer Lock in POS Cart
  const isPosCustomerLocked = cart.length > 0 && !isCustomerUnlocked;
  const currentPartner = partners.find((p) => p.id === Number(selectedPartnerId));
  const currentPartnerName = currentPartner ? (currentPartner.name || currentPartner.fullName) : "Público General / Venta Mostrador";

  const customerItems: AutocompleteItem[] = useMemo(() => {
    const defaultItem: AutocompleteItem = {
      id: 0,
      title: "Público General / Venta Mostrador",
      subtitle: "RFC: XAXX010101000 | Consumidor Final",
      badge: "🛒 B2C",
      icon: "user",
    };

    const partnerItemsList: AutocompleteItem[] = (partners || []).map((pt) => {
      const typeLabel =
        pt.partnerType === "FINAL_CONSUMER"
          ? "🛒 B2C"
          : pt.partnerType === "FISICA"
          ? "👤 P. Física"
          : pt.partnerType === "DISTRIBUTOR"
          ? "🏷️ Distribuidor"
          : pt.partnerType === "GOVERNMENT"
          ? "🏛️ Gobierno"
          : "🏢 P. Moral";

      return {
        id: pt.id,
        title: pt.name || pt.fullName,
        subtitle: `RFC: ${pt.taxNbr || "Sin RFC"} | ${pt.email || pt.phone || "Sin contacto"}`,
        badge: typeLabel,
        icon: pt.partnerType === "MORAL" ? "building" : "user",
      };
    });

    return [defaultItem, ...partnerItemsList];
  }, [partners]);

  const handleReprintTicket = (t: any) => {
    setTicketData({
      ticketNumber: t.folio || `TKT-${t.saleOrderId || Date.now()}`,
      companyName: t.company?.name || activeCompany?.name || "Distribuidora PyME",
      companyTaxId: t.company?.taxId || activeCompany?.taxId || "XAXX010101000",
      branchName: t.cashRegister?.name || "Caja Principal 01",
      clientName: t.customer?.name || "Público en General / Mostrador",
      clientTaxId: t.customer?.taxId || "XAXX010101000",
      date: t.timestamp ? new Date(t.timestamp).toLocaleString("es-MX") : new Date().toLocaleString("es-MX"),
      items: (t.items || []).map((it: any) => ({
        productName: it.name || it.productName,
        qty: it.qty,
        unitPrice: it.unitPrice,
        total: it.subtotal || (it.qty * it.unitPrice),
      })),
      subtotal: t.subtotal,
      taxAmount: t.tax,
      total: t.total,
      paymentMethod: t.payment?.method || "CASH",
      amountPaid: t.payment?.amountPaid || t.total,
      change: t.payment?.change || 0,
      denominationsBreakdown: {},
    });
    setTicketModalOpen(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !activeCompany) return;

    if (paymentMethod === "CASH" && amountPaid < total) {
      alert("El efectivo recibido es menor al total a pagar.");
      return;
    }

    try {
      setLoadingCheckout(true);
      const result = await posApi.checkout({
        companyId: activeCompany.id,
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.name,
          qty: c.qty,
          unitPrice: c.price,
        })),
        payment: {
          method: paymentMethod,
          amountPaid: paymentMethod === "CASH" ? amountPaid : total,
        },
      });

      if (result) {
        const generatedFolio = result.folio || result.ticketNumber || result.ticket?.ticketId || result.saleOrder?.orderSeq || `TKT-2026-${Date.now().toString().slice(-5)}`;
        setTicketData({
          ticketNumber: generatedFolio,
          companyName: result.company?.name || activeCompany.name,
          companyTaxId: result.company?.taxId || activeCompany.taxId,
          branchName: "Caja Principal 01",
          clientName: result.customer?.name || currentPartnerName,
          clientTaxId: currentPartner?.taxNbr || "XAXX010101000",
          date: new Date().toLocaleString("es-MX"),
          items: cart.map((c) => ({
            productName: c.name,
            qty: c.qty,
            unitPrice: c.price,
            total: c.qty * c.price,
          })),
          subtotal,
          taxAmount,
          total,
          paymentMethod,
          amountPaid: amountPaid >= total ? amountPaid : total,
          change: result.payment?.change ?? result.ticket?.change ?? change,
          denominationsBreakdown: denominationCounts,
        });
        setTicketModalOpen(true);
        setCart([]);
        setIsCustomerUnlocked(false);
        handleClearCash();
        loadTicketsHistory();
      }
    } catch (err: any) {
      alert(`Error al procesar cobro POS: ${err.message}`);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const pendingB2BCount = b2bInvoices.filter(
    (inv) => inv.status !== "PAID" && (inv.amountRemaining || inv.totalAmount) > 0
  ).length;

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Top Main Tab Bar: Mostrador POS vs Cobro de Facturas B2B */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0B2B4C] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
          <button
            type="button"
            onClick={() => setPosTab("COUNTER")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              posTab === "COUNTER"
                ? "bg-white dark:bg-etiserv-blue text-etiserv-blue dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Mostrador & Escáner POS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPosTab("B2B_INVOICES");
              loadB2BInvoices();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              posTab === "B2B_INVOICES"
                ? "bg-white dark:bg-etiserv-blue text-etiserv-blue dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cobrar Facturas & Cotizaciones B2B</span>
            {pendingB2BCount > 0 && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                {pendingB2BCount}
              </Badge>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {posTab === "B2B_INVOICES" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadB2BInvoices}
              loading={loadingB2BInvoices}
              className="gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Actualizar Facturas</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setHistoryOpen(true);
              loadTicketsHistory();
            }}
            className="gap-1.5 font-bold text-xs shrink-0 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-etiserv-blue"
            title="Ver todos los tickets y recibos emitidos en la caja"
          >
            <Receipt className="w-4 h-4 text-etiserv-blue" />
            <span>Recibos Emitidos</span>
            <Badge variant="neutral" className="ml-1 font-mono text-[10px] px-1.5 py-0">
              {ticketsHistory.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* VIEW 1: COBRO DE FACTURAS B2B EN CAJA */}
      {posTab === "B2B_INVOICES" && (
        <div className="flex-1 bg-white dark:bg-[#0B2B4C] rounded-xl border border-slate-200 dark:border-white/10 p-4 shadow-sm flex flex-col min-h-0 overflow-hidden space-y-4">
          {/* Header & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="🔍 Buscar por Folio (ej. COT-2026-00004, FAC-2026-001) o Cliente..."
                  value={b2bSearch}
                  onChange={(e) => setB2bSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue font-medium"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setB2bStatusFilter("PENDING")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  b2bStatusFilter === "PENDING"
                    ? "bg-amber-500 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                🟡 Pendientes ({b2bInvoices.filter((i) => i.status === "PENDING").length})
              </button>
              <button
                type="button"
                onClick={() => setB2bStatusFilter("PAID")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  b2bStatusFilter === "PAID"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                🟢 Cobradas ({b2bInvoices.filter((i) => i.status === "PAID").length})
              </button>
              <button
                type="button"
                onClick={() => setB2bStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  b2bStatusFilter === "ALL"
                    ? "bg-etiserv-blue text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Todas ({b2bInvoices.length})
              </button>
            </div>
          </div>

          {/* Table of B2B Invoices & Converted Quotes */}
          <div className="flex-1 border border-slate-200 dark:border-white/10 rounded-xl overflow-y-auto min-h-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Folio Factura / Cotización</th>
                  <th className="py-3 px-4">Cliente B2B</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Concepto / Partidas</th>
                  <th className="py-3 px-4 text-right">Total Factura</th>
                  <th className="py-3 px-4 text-right">Saldo por Cobrar</th>
                  <th className="py-3 px-4 text-center">Estado Caja</th>
                  <th className="py-3 px-4 text-right">Acciones de Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(() => {
                  const filtered = b2bInvoices.filter((inv) => {
                    if (b2bStatusFilter === "PENDING" && inv.status !== "PENDING") return false;
                    if (b2bStatusFilter === "PAID" && inv.status !== "PAID") return false;
                    if (!b2bSearch.trim()) return true;
                    const q = b2bSearch.toLowerCase();
                    const matchFolio = (inv.folio || "").toLowerCase().includes(q);
                    const matchQuote = (inv.quoteSeq || "").toLowerCase().includes(q);
                    const matchCustomer = (inv.partnerName || "").toLowerCase().includes(q);
                    return matchFolio || matchQuote || matchCustomer;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30 text-etiserv-blue" />
                          <p className="font-semibold text-sm">No hay facturas o cotizaciones pendientes de cobro en caja</p>
                          <p className="text-xs text-slate-400 mt-1">Las cotizaciones facturadas por ejecutivos aparecerán aquí automáticamente.</p>
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((inv, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedDocMovement({
                          id: inv.id,
                          docNumber: inv.folio,
                          date: inv.date,
                          concept: `Factura ${inv.folio} de ${inv.partnerName}`,
                          type: "INVOICE",
                          debit: inv.totalAmount,
                          credit: 0,
                          runningBalance: inv.amountRemaining,
                          partnerName: inv.partnerName,
                          taxNbr: inv.taxNbr,
                          items: inv.items,
                          status: inv.status === "PAID" ? "PAGADO" : "PENDIENTE",
                        });
                        setDocModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-etiserv-blue group-hover:underline">
                            {inv.folio}
                          </span>
                          {inv.quoteSeq && inv.quoteSeq !== inv.folio && (
                            <Badge variant="neutral" className="text-[9px] py-0 px-1 font-mono">
                              {inv.quoteSeq}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>{inv.partnerName}</div>
                        {inv.taxNbr && <div className="text-[10px] text-slate-400 font-mono">RFC: {inv.taxNbr}</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {inv.date || "Hoy"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                        {(inv.items || []).length > 0 ? (
                          <span className="truncate max-w-[200px] block" title={inv.items.map((it: any) => `${it.qty}x ${it.productName}`).join(", ")}>
                            {inv.items.map((it: any) => `${it.qty}x ${it.productName}`).join(", ").slice(0, 35)}...
                          </span>
                        ) : (
                          "Venta B2B / Mercancía"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(Number(inv.totalAmount || 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        <span className={inv.status === "PAID" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                          {formatCurrency(Number(inv.amountRemaining || (inv.status === "PAID" ? 0 : inv.totalAmount)))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={inv.status === "PAID" ? "success" : "warning"}
                          dot
                          className="text-[10px]"
                        >
                          {inv.status === "PAID" ? "Pagada en Caja" : "Pendiente de Pago"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== "PAID" ? (
                            <Button
                              type="button"
                              variant="primary"
                              glow
                              size="sm"
                              onClick={() => handleOpenPayB2BInvoice(inv)}
                              className="py-1 px-2.5 text-xs gap-1 font-bold shadow-sm"
                              title="Cobrar factura en caja mostrador"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Cobrar en Caja</span>
                            </Button>
                          ) : (
                            <Badge variant="success" className="text-[10px] py-1 px-2 gap-1 font-mono">
                              <CheckCheck className="w-3 h-3 inline" />
                              <span>Cobrado</span>
                            </Badge>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintB2BDirect(inv)}
                            className="py-1 px-2 text-xs gap-1 hover:border-etiserv-blue text-slate-600 dark:text-slate-300"
                            title="Imprimir ticket o factura fiscal para el cliente"
                          >
                            <Printer className="w-3.5 h-3.5 text-etiserv-blue" />
                            <span>Imprimir</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MOSTRADOR POS & ESCÁNER TRADICIONAL */}
      {posTab === "COUNTER" && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
          {/* Product Catalog & Barcode Scanner Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0B2B4C] rounded-xl border border-slate-200 dark:border-white/10 p-4 shadow-sm min-h-0">
            {/* Search, Barcode Input & History Button */}
            <div className="flex flex-col sm:flex-row gap-2.5 pb-3 border-b border-slate-200 dark:border-white/10 items-stretch sm:items-center">
              <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="🔍 Buscar por nombre, SKU o escanear código de barras (Enter)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1 text-slate-400 hover:text-etiserv-blue rounded"
                  title="Buscar o procesar escáner"
                >
                  <Barcode className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 pt-2">
              <button
              onClick={() => setSelectedCategory("ALL")}
              title="Mostrar todos los productos"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-etiserv-blue text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Todos ({products.length})
            </button>
            {(() => {
              const cleanCats: any[] = [];
              const seen = new Set<string>();
              for (const c of categories) {
                const rawName = (c.name || c.code || "").trim();
                if (!rawName) continue;
                const lower = rawName.toLowerCase();
                if (lower.includes("test")) continue; // hide testing duplicates
                const normKey = lower.replace(/\s+/g, " ");
                if (!seen.has(normKey)) {
                  seen.add(normKey);
                  cleanCats.push({ ...c, displayName: rawName });
                }
              }

              return cleanCats.map((cat) => (
                <button
                  key={cat.id}
                  title={`Filtrar por: ${cat.displayName}`}
                  onClick={() => setSelectedCategory(cat.displayName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.displayName
                      ? "bg-etiserv-blue text-white shadow-sm"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {cat.displayName}
                </button>
              ));
            })()}
          </div>

        {/* Product Grid with High-Performance Pagination */}
        {(() => {
          const totalPosPages = Math.max(1, Math.ceil(filteredProducts.length / posPageSize));
          const safePosPage = Math.min(posPage, totalPosPages);
          const posStartIndex = (safePosPage - 1) * posPageSize;
          const posEndIndex = Math.min(posStartIndex + posPageSize, filteredProducts.length);
          const currentPosProducts = filteredProducts.slice(posStartIndex, posEndIndex);

          return (
            <div className="flex-1 flex flex-col justify-between overflow-hidden pt-3">
              <div className="flex-1 overflow-y-auto pr-1">
                {currentPosProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
                    <Package className="w-8 h-8 mb-2 opacity-40" />
                    <span>No se encontraron productos coincidentes</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
                    {currentPosProducts.map((p) => {
                      const inCart = cart.find((i) => i.productId === p.id);
                      const fullTooltip = `${p.name}\nSKU: ${p.code || "N/A"}\nPrecio: ${formatCurrency(Number(p.salePrice || 0))}\nStock Disponible: ${p.stock ?? 99}`;
                      return (
                        <button
                          key={p.id}
                          onClick={() => addToCart(p)}
                          title={fullTooltip}
                          className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all hover:border-etiserv-blue/60 hover:shadow-md active:scale-[0.98] min-h-[115px] ${
                            inCart
                              ? "bg-blue-50/60 dark:bg-blue-950/40 border-etiserv-blue/80 ring-1 ring-etiserv-blue/50"
                              : "bg-slate-50/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span
                                title={`Código SKU: ${p.code || "N/A"}`}
                                className="font-mono text-[9px] text-slate-400 font-bold bg-white dark:bg-[#071C33] px-1 py-0.5 rounded border border-slate-200/50 dark:border-white/5 truncate max-w-[90px]"
                              >
                                {p.code || "SKU"}
                              </span>
                              {inCart && (
                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-etiserv-blue text-white text-[9px] font-bold shadow-xs">
                                  {inCart.qty}
                                </span>
                              )}
                            </div>
                            <h4
                              title={p.name}
                              className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-3 leading-snug break-words"
                            >
                              {p.name}
                            </h4>
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-white/5 flex items-baseline justify-between">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {formatCurrency(Number(p.salePrice || 0))}
                            </span>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Stock: {p.stock ?? 99}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* POS Pagination Bar */}
              {filteredProducts.length > posPageSize && (
                <div className="pt-3 mt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">
                    Mostrando <strong className="text-slate-800 dark:text-white font-mono">{filteredProducts.length > 0 ? posStartIndex + 1 : 0} - {posEndIndex}</strong> de <strong className="text-slate-800 dark:text-white font-mono">{filteredProducts.length.toLocaleString()}</strong> artículos
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPosPage(safePosPage - 1)}
                      disabled={safePosPage <= 1}
                      className="text-xs p-1 h-7 gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Ant</span>
                    </Button>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                      {safePosPage} / {totalPosPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPosPage(safePosPage + 1)}
                      disabled={safePosPage >= totalPosPages}
                      className="text-xs p-1 h-7 gap-1"
                    >
                      <span>Sig</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Cart & Payment Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-[#0B2B4C] rounded-xl border border-slate-200 dark:border-white/10 p-4 shadow-sm">
        {/* Ticket Header & Pieces Badge */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-etiserv-blue" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Ticket de Venta
            </h3>
          </div>
          <Badge variant="primary">
            {cart.reduce((s, i) => s + i.qty, 0)} Piezas
          </Badge>
        </div>

        {/* Customer Selector with Enllave / Lock */}
        <div className="py-2.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>Cliente de la Venta</span>
            </span>
            {isPosCustomerLocked && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Deseas desbloquear y cambiar el cliente de este ticket?")) {
                    setIsCustomerUnlocked(true);
                  }
                }}
                className="text-[10px] text-etiserv-blue hover:underline font-semibold flex items-center gap-0.5"
              >
                <Unlock className="w-3 h-3" />
                <span>Cambiar</span>
              </button>
            )}
          </div>

          {isPosCustomerLocked ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-etiserv-blue/30 text-xs">
              <div className="truncate pr-2">
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {currentPartnerName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentPartner?.taxNbr ? `RFC: ${currentPartner.taxNbr}` : "Venta Mostrador"}
                </span>
              </div>
              <Badge variant="primary" className="text-[9px] gap-0.5 font-mono">
                <Lock className="w-2.5 h-2.5 inline" /> Enllavado
              </Badge>
            </div>
          ) : (
            <Autocomplete
              items={customerItems}
              value={selectedPartnerId}
              onChange={(item) => {
                setSelectedPartnerId(Number(item.id));
                setIsCustomerUnlocked(false);
              }}
              placeholder="Buscar cliente por Nombre, RFC o Contacto..."
              searchPlaceholder="Escribe para buscar entre los clientes..."
              className="w-full"
            />
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-2.5 space-y-2 max-h-52">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
              <Receipt className="w-8 h-8 mb-2 opacity-40" />
              <span>Carrito vacío</span>
            </div>
          )}

          {cart.map((item) => {
            const lineTotal = item.qty * item.price;
            return (
              <div
                key={item.productId}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-2 shadow-2xs"
              >
                {/* Fila 1: SKU Badge, Nombre Completo y Botón Eliminar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    <span className="font-mono text-[10px] font-bold text-etiserv-blue bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40 shrink-0">
                      {item.code || `SKU-${item.productId}`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span
                        title={item.name}
                        className="font-bold text-xs text-slate-900 dark:text-white block leading-snug break-words"
                      >
                        {item.name}
                      </span>
                      {item.categoryName && (
                        <span className="text-[10px] text-slate-400 font-sans">
                          {item.categoryName}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                    title="Eliminar del ticket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Fila 2: Controles de Cantidad [- 1 +], Precio Unitario y Subtotal */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/5 text-xs">
                  {/* Stepper de Cantidad */}
                  <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#071C33] shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, -1)}
                      className="p-1 px-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-l-lg transition-colors"
                      title="Reducir 1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-bold text-xs tabular-nums text-slate-900 dark:text-white min-w-[24px] text-center font-mono">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, 1)}
                      className="p-1 px-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-r-lg transition-colors"
                      title="Aumentar 1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Precio Unitario */}
                  <span className="text-[11px] text-slate-400 font-mono">
                    x {formatCurrency(item.price)}
                  </span>

                  {/* Subtotal Línea */}
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment and Totals */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2.5">
          {/* Method selector */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`py-1.5 rounded-md text-xs font-semibold transition-colors ${
                paymentMethod === "CASH"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200"
              }`}
            >
              Efectivo
            </button>
            <button
              onClick={() => setPaymentMethod("CARD")}
              className={`py-1.5 rounded-md text-xs font-semibold transition-colors ${
                paymentMethod === "CARD"
                  ? "bg-etiserv-blue text-white"
                  : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200"
              }`}
            >
              Tarjeta
            </button>
            <button
              onClick={() => setPaymentMethod("TRANSFER")}
              className={`py-1.5 rounded-md text-xs font-semibold transition-colors ${
                paymentMethod === "TRANSFER"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200"
              }`}
            >
              Transf.
            </button>
          </div>

          {/* ADVANCED CASH & MULTI-DENOMINATION COUNTER */}
          {paymentMethod === "CASH" && (
            <div className="space-y-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-etiserv-navyDark/60 border border-slate-200/60 dark:border-white/10">
              {/* Header with Quick Clear and Breakdown Toggle */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-emerald-600" />
                  <span>Billetes & Conteo de Efectivo:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearCash}
                    className="text-slate-400 hover:text-rose-500 flex items-center gap-0.5 transition-colors"
                    title="Limpiar efectivo"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Limpiar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetailedDenominations(!showDetailedDenominations)}
                    className="text-etiserv-blue hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <Calculator className="w-2.5 h-2.5" />
                    <span>{showDetailedDenominations ? "Ocultar" : "Desglose"}</span>
                    {showDetailedDenominations ? (
                      <ChevronUp className="w-2.5 h-2.5" />
                    ) : (
                      <ChevronDown className="w-2.5 h-2.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Bill Tap Buttons ($1000, $500, $200, $100, $50, $20) */}
              <div className="grid grid-cols-6 gap-1">
                {BILL_DENOMINATIONS.map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => handleAddBill(denom)}
                    className="py-1 px-0.5 rounded-lg bg-white dark:bg-[#071C33] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 font-mono text-[11px] font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 text-center"
                    title={`Agregar billete de $${denom}`}
                  >
                    ${denom >= 1000 ? "1k" : denom}
                  </button>
                ))}
              </div>

              {/* Collapsible Full Denomination Breakdown Counter */}
              {showDetailedDenominations && (
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10 animate-fade-in">
                  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span>Monedas & Billetes Específicos:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {/* Billetes */}
                    <div className="space-y-1 bg-white dark:bg-[#071C33] p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Billetes
                      </span>
                      {BILL_DENOMINATIONS.map((d) => (
                        <div key={d} className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-mono text-slate-600 dark:text-slate-300">${d}:</span>
                          <input
                            type="number"
                            min="0"
                            value={denominationCounts[d] || ""}
                            onChange={(e) =>
                              handleUpdateDenomination(d, parseInt(e.target.value, 10) || 0)
                            }
                            placeholder="0"
                            className="w-12 text-right font-mono font-bold text-[11px] rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] px-1 py-0.5 text-slate-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Monedas */}
                    <div className="space-y-1 bg-white dark:bg-[#071C33] p-1.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Monedas
                      </span>
                      {COIN_DENOMINATIONS.map((d) => (
                        <div key={d} className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-mono text-slate-600 dark:text-slate-300">${d}:</span>
                          <input
                            type="number"
                            min="0"
                            value={denominationCounts[d] || ""}
                            onChange={(e) =>
                              handleUpdateDenomination(d, parseInt(e.target.value, 10) || 0)
                            }
                            placeholder="0"
                            className="w-12 text-right font-mono font-bold text-[11px] rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] px-1 py-0.5 text-slate-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Paid Input & Exact Cash Button */}
              <div className="flex gap-1.5 items-center pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountPaidStr}
                    onChange={(e) => {
                      setAmountPaidStr(e.target.value);
                      setDenominationCounts({
                        1000: 0,
                        500: 0,
                        200: 0,
                        100: 0,
                        50: 0,
                        20: 0,
                        10: 0,
                        5: 0,
                        2: 0,
                        1: 0,
                      });
                    }}
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-right rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExactCash}
                  className="px-2 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800/40 hover:bg-emerald-200 transition-colors whitespace-nowrap"
                  title="Cobrar monto exacto"
                >
                  Exacto
                </button>
              </div>

              {/* Live Change Feedback Banner */}
              {amountPaid > 0 && (
                <div
                  className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between transition-all ${
                    amountPaid >= total
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                  }`}
                >
                  <span className="font-sans text-[11px] font-semibold">
                    {amountPaid >= total ? "Cambio / Vuelto a Entregar:" : "Faltante:"}
                  </span>
                  <span className="font-bold text-sm">
                    {formatCurrency(Math.abs(amountPaid - total))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Subtotal, Tax and Total */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>IVA (16%):</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
              <span>Total a Cobrar:</span>
              <span className="font-mono text-etiserv-blue">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            variant="primary"
            glow
            className="w-full py-2.5 text-xs font-bold gap-2"
            disabled={cart.length === 0}
            loading={loadingCheckout}
            onClick={handleCheckout}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Cobrar {formatCurrency(total)}</span>
          </Button>
        </div>
      </div>

      {/* Historial de Recibos & Tickets Emitidos (Modal Completo) */}
      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Historial de Recibos y Tickets POS (Caja del Día)"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          {(() => {
            const totalSales = ticketsHistory.reduce((acc, t) => acc + Number(t.total || 0), 0);
            const totalCash = ticketsHistory
              .filter((t) => t.payment?.method === "CASH")
              .reduce((acc, t) => acc + Number(t.total || 0), 0);
            const totalOther = totalSales - totalCash;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Facturado
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {formatCurrency(totalSales)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tickets Emitidos
                  </div>
                  <div className="text-sm font-bold text-etiserv-blue font-mono mt-0.5">
                    {ticketsHistory.length} Comprobantes
                  </div>
                </div>
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Efectivo en Caja
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {formatCurrency(totalCash)}
                  </div>
                </div>
                <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Tarjeta / Transf.
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                    {formatCurrency(totalOther)}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search & Refresh Bar */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por folio (ej. TKT-2026-00105), cliente o producto..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#06172A] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTicketsHistory}
              loading={loadingHistory}
              className="gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </Button>
          </div>

          {/* Receipts Table */}
          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Folio / Ticket</th>
                  <th className="py-2.5 px-3">Hora / Fecha</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Partidas</th>
                  <th className="py-2.5 px-3 text-center">Método</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(() => {
                  const filtered = ticketsHistory.filter((t) => {
                    if (!historySearch.trim()) return true;
                    const q = historySearch.toLowerCase();
                    const matchFolio = (t.folio || "").toLowerCase().includes(q);
                    const matchCustomer = (t.customer?.name || "").toLowerCase().includes(q);
                    const matchItems = (t.items || []).some((it: any) =>
                      (it.name || it.productName || "").toLowerCase().includes(q)
                    );
                    return matchFolio || matchCustomer || matchItems;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <span>No hay recibos o tickets emitidos que coincidan con la búsqueda</span>
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-etiserv-blue">
                        {t.folio}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Hoy"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white max-w-[140px] truncate" title={t.customer?.name}>
                        {t.customer?.name || "Público en General"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {(t.items || []).length} art. ({t.items?.map((it: any) => `${it.qty}x ${it.name || it.productName}`).join(", ").slice(0, 35)}...)
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={t.payment?.method === "CASH" ? "success" : "neutral"} className="text-[10px]">
                          {t.payment?.method === "CASH" ? "Efectivo" : t.payment?.method === "CARD" ? "Tarjeta" : "Transf."}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(Number(t.total || 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprintTicket(t)}
                          className="py-1 px-2 text-[11px] gap-1 hover:border-etiserv-blue font-semibold"
                          title="Ver y reimprimir este ticket térmico"
                        >
                          <Printer className="w-3 h-3 text-etiserv-blue" />
                          <span>Ticket</span>
                        </Button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal Cobro de Factura B2B en Caja */}
      {b2bPayModalOpen && selectedB2BInvoice && (
        <Modal
          isOpen={b2bPayModalOpen}
          onClose={() => {
            setB2bPayModalOpen(false);
            setSelectedB2BInvoice(null);
          }}
          title={`Cobro en Caja — ${selectedB2BInvoice.folio}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Invoice Summary Banner */}
            <div className="bg-slate-50 dark:bg-[#071C33] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold">Cliente:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedB2BInvoice.partnerName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold">Folio Documento:</span>
                <span className="font-mono text-xs font-bold text-etiserv-blue">
                  {selectedB2BInvoice.folio}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Saldo por Cobrar:</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Number(selectedB2BInvoice.amountRemaining || selectedB2BInvoice.totalAmount || 0))}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Método de Cobro:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setB2bPayMethod("CASH")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    b2bPayMethod === "CASH"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>💵 Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setB2bPayMethod("CARD")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    b2bPayMethod === "CARD"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs"
                      : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>💳 Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setB2bPayMethod("TRANSFER")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    b2bPayMethod === "TRANSFER"
                      ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs"
                      : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>🏦 Transf.</span>
                </button>
              </div>
            </div>

            {/* Amount to Pay */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Monto a Cobrar ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={b2bPayAmount}
                  onChange={(e) => {
                    setB2bPayAmount(e.target.value);
                    if (b2bPayMethod !== "CASH") {
                      setB2bTenderedAmount(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              {b2bPayMethod === "CASH" ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Efectivo Recibido ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={b2bTenderedAmount}
                    onChange={(e) => setB2bTenderedAmount(e.target.value)}
                    placeholder="Monto entregado"
                    className="w-full bg-slate-50 dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Referencia / Autorización
                  </label>
                  <input
                    type="text"
                    placeholder="ej. AUT-891234"
                    className="w-full bg-slate-50 dark:bg-[#06172A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Change display for Cash */}
            {b2bPayMethod === "CASH" && (() => {
              const tendered = parseFloat(b2bTenderedAmount) || 0;
              const due = parseFloat(b2bPayAmount) || 0;
              const change = Math.max(0, tendered - due);

              return (
                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Cambio a Entregar:
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(change)}
                  </span>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setB2bPayModalOpen(false);
                  setSelectedB2BInvoice(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                glow
                onClick={handleProcessB2BPayment}
                loading={submittingB2BPayment}
                className="gap-1.5 font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Cobro & Imprimir Ticket</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Document Detail Modal */}
      {selectedDocMovement && (
        <DocumentDetailModal
          isOpen={docModalOpen}
          onClose={() => {
            setDocModalOpen(false);
            setSelectedDocMovement(null);
          }}
          movement={selectedDocMovement}
        />
      )}

      {/* Ticket Modal */}
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

export default POSView;
