import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Receipt,
  Clock,
  Printer,
  X,
  Keyboard,
} from "lucide-react";
import { useCompany } from "../../context/CompanyContext";
import { catalogApi } from "../../api/catalogApi";
import { salesApi } from "../../api/salesApi";
import { Autocomplete, AutocompleteItem } from "../ui/Autocomplete";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Select } from "../ui/Select";

interface ExpressInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ExpressInvoiceModal: React.FC<ExpressInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeCompany } = useCompany();
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | string>("");
  const [selectedPriceList, setSelectedPriceList] = useState<string>("PUBLIC");
  const [items, setItems] = useState<any[]>([
    { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 },
  ]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [activeProductSearchIdx, setActiveProductSearchIdx] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Telemetry & TTF Stopwatch
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<string>("0.0");
  const [resultData, setResultData] = useState<any | null>(null);
  const timerRef = useRef<any>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeCompany) {
      setResultData(null);
      setStartTime(performance.now());
      setItems([{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 }]);
      setNotes("");
      setBarcodeInput("");

      // Load Partners & Products with strict deduplication
      Promise.all([
        catalogApi.listPartners(activeCompany.id),
        catalogApi.listProducts(activeCompany.id),
      ]).then(([partData, prodData]) => {
        const seenP = new Set<string>();
        const uniquePartners: any[] = [];
        for (const p of partData || []) {
          const key = p.id ? String(p.id) : `${p.name || ""}-${p.taxNbr || ""}`;
          if (!seenP.has(key)) {
            seenP.add(key);
            uniquePartners.push(p);
          }
        }

        const seenPr = new Set<string>();
        const uniqueProducts: any[] = [];
        for (const p of prodData || []) {
          const key = p.id ? String(p.id) : `${p.code || ""}-${p.name || ""}`;
          if (!seenPr.has(key)) {
            seenPr.add(key);
            uniqueProducts.push(p);
          }
        }

        // Add standard "Público en General" if not present
        if (!uniquePartners.some((p) => (p.taxNbr || "").toUpperCase() === "XAXX010101000")) {
          uniquePartners.unshift({
            id: 999999,
            name: "Público en General",
            taxNbr: "XAXX010101000",
            email: "ventas@empresa.com",
            creditLimit: 0,
            creditDays: 0,
          });
        }

        setPartners(uniquePartners);
        setProducts(uniqueProducts);
        if (uniquePartners.length > 0) {
          setSelectedPartnerId(uniquePartners[0].id);
          if (uniquePartners[0].priceListCode) {
            setSelectedPriceList(uniquePartners[0].priceListCode);
          }
        }
      });

      // Start TTF Live Timer
      const t0 = performance.now();
      timerRef.current = setInterval(() => {
        const sec = ((performance.now() - t0) / 1000).toFixed(1);
        setElapsedSeconds(sec);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, activeCompany]);

  // When selected partner changes, auto-select their default price list
  useEffect(() => {
    if (selectedPartnerId) {
      const p = partners.find((x) => x.id === selectedPartnerId);
      if (p?.priceListCode) {
        handlePriceListChange(p.priceListCode);
      }
    }
  }, [selectedPartnerId]);

  const handlePriceListChange = (newPriceList: string) => {
    setSelectedPriceList(newPriceList);
    const discount = newPriceList === "WHOLESALE" ? 10 : newPriceList === "DISTRIBUTOR" ? 20 : 0;
    setItems((prev) =>
      prev.map((it) =>
        it.productId > 0
          ? {
              ...it,
              discountPct: discount,
            }
          : it
      )
    );
  };

  // Global Ctrl+Enter shortcut inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items, selectedPartnerId, selectedPriceList]);

  if (!isOpen) return null;

  const partnerItems: AutocompleteItem[] = partners.map((p) => ({
    id: p.id,
    title: p.name || p.fullName,
    subtitle: `RFC: ${p.taxNbr || "XAXX010101000"} | ${p.email || "Sin email"}`,
    badge: p.taxNbr ? "RFC Válido" : undefined,
  }));

  const handleSelectPublicPartner = () => {
    const pub = partners.find((p) => (p.taxNbr || "").toUpperCase() === "XAXX010101000") || partners[0];
    if (pub) {
      setSelectedPartnerId(pub.id);
    }
  };

  const handleProductSelect = (index: number, prod: any) => {
    const discount = selectedPriceList === "WHOLESALE" ? 10 : selectedPriceList === "DISTRIBUTOR" ? 20 : 0;

    const updated = [...items];
    updated[index] = {
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      qty: updated[index]?.qty || 1,
      unitPrice: Number(prod.salePrice || 0),
      discountPct: discount,
    };
    setItems(updated);
    setActiveProductSearchIdx(null);
    setProductSearchQuery("");
  };

  // Quick Barcode / SKU Scanner Handler
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
      const discount = selectedPriceList === "WHOLESALE" ? 10 : selectedPriceList === "DISTRIBUTOR" ? 20 : 0;
      // Check if product is already in items
      const existingIdx = items.findIndex((it) => it.productId === found.id);
      if (existingIdx >= 0) {
        const updated = [...items];
        updated[existingIdx].qty += 1;
        setItems(updated);
      } else {
        // If first item is empty, replace it
        if (items.length === 1 && items[0].productId === 0) {
          setItems([
            {
              productId: found.id,
              productName: found.name,
              productCode: found.code,
              qty: 1,
              unitPrice: Number(found.salePrice || 0),
              discountPct: discount,
            },
          ]);
        } else {
          setItems([
            ...items,
            {
              productId: found.id,
              productName: found.name,
              productCode: found.code,
              qty: 1,
              unitPrice: Number(found.salePrice || 0),
              discountPct: discount,
            },
          ]);
        }
      }
      setBarcodeInput("");
    } else {
      alert(`No se encontró producto con código o SKU: ${barcodeInput}`);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setItems([{ productId: 0, productName: "", productCode: "", qty: 1, unitPrice: 0, discountPct: 0 }]);
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const discounted = item.unitPrice * (1 - item.discountPct / 100);
      return sum + discounted * (item.qty || 1);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!activeCompany || !selectedPartnerId) return;

    const validItems = items.filter((it) => it.productId > 0);
    if (validItems.length === 0) {
      alert("Por favor agrega al menos un producto a la factura");
      return;
    }

    try {
      setSubmitting(true);
      const partner = partners.find((p) => p.id === selectedPartnerId);

      const res = await salesApi.createOrder({
        companyId: activeCompany.id,
        partnerId: Number(selectedPartnerId),
        partnerName: partner?.name || partner?.fullName || "Cliente Mostrador",
        paymentTerms: "CONTADO",
        items: validItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          productCode: it.productCode,
          qty: it.qty,
          unitPrice: it.unitPrice,
          discountPct: it.discountPct,
        })),
        notes: notes || "Factura Express de Mostrador",
      });

      const ttf = ((performance.now() - startTime) / 1000).toFixed(2);

      setResultData({
        invoiceSeq: res.orderSeq.replace("PED", "FACT"),
        invoiceId: res.id,
        partnerName: partner?.name || "Cliente Mostrador",
        total,
        ttfSeconds: ttf,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(`Error al emitir factura express: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#071C33] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Facturación Express
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
                  [F4]
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Emisión ultrarrápida con escaneo de código de barras y atajo [Ctrl + Enter]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!resultData && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-etiserv-blue text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 animate-spin text-etiserv-blue" />
                <span>{elapsedSeconds}s</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!resultData ? (
          <div className="p-6 space-y-4">
            {/* Row 1: Client Autocomplete + Quick Button & Price List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Cliente / Razón Social o RFC <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectPublicPartner}
                    className="text-[10px] font-bold text-etiserv-blue hover:underline bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/40"
                  >
                    👤 Público General
                  </button>
                </div>
                <Autocomplete
                  placeholder="Escribe para buscar cliente o RFC..."
                  items={partnerItems}
                  value={selectedPartnerId}
                  onChange={(item) => setSelectedPartnerId(item.id)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <Select
                  label="Lista de Precios"
                  value={selectedPriceList}
                  onChange={(e) => handlePriceListChange(e.target.value)}
                >
                  <option value="PUBLIC">Público (Base)</option>
                  <option value="WHOLESALE">Mayoreo (-10%)</option>
                  <option value="DISTRIBUTOR">Distribuidor (-20%)</option>
                </Select>
              </div>
            </div>

            {/* Fast Barcode / SKU Scanner Bar */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="📷 Escanear Código de Barras o Escribir SKU y presionar Enter..."
                  className="w-full bg-slate-50 dark:bg-[#06172A] border border-etiserv-blue/30 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue focus:bg-white dark:focus:bg-[#071C33] transition-all font-mono"
                />
                <Zap className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
              </div>
              <Button type="submit" variant="outline" size="sm" className="text-xs px-3 font-semibold">
                + Agregar
              </Button>
            </form>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Partidas de la Factura ({items.filter((it) => it.productId > 0).length})
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-etiserv-blue font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Fila Manual
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const filteredRowProds = products.filter((p) => {
                    if (!productSearchQuery) return true;
                    const q = productSearchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      (p.code && p.code.toLowerCase().includes(q)) ||
                      (p.barCode && p.barCode.toLowerCase().includes(q))
                    );
                  });

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-etiserv-navyDark p-2 rounded-lg text-xs border border-slate-100 dark:border-white/5"
                    >
                      {/* Product Search Combobox */}
                      <div className="col-span-5 relative">
                        {item.productId > 0 ? (
                          <div
                            onClick={() => {
                              setActiveProductSearchIdx(idx);
                              setProductSearchQuery("");
                            }}
                            className="flex items-center justify-between p-1.5 px-2 bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded cursor-pointer hover:border-etiserv-blue"
                          >
                            <span className="font-semibold text-slate-800 dark:text-white truncate">
                              {item.productName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                              ${item.unitPrice}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              placeholder="Buscar producto..."
                              value={activeProductSearchIdx === idx ? productSearchQuery : ""}
                              onFocus={() => {
                                setActiveProductSearchIdx(idx);
                                setProductSearchQuery("");
                              }}
                              onChange={(e) => {
                                setActiveProductSearchIdx(idx);
                                setProductSearchQuery(e.target.value);
                              }}
                              className="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-2 py-1 text-xs focus:ring-1 focus:ring-etiserv-blue"
                            />
                          </div>
                        )}

                        {/* Floating Product Suggestions */}
                        {activeProductSearchIdx === idx && (
                          <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#0B2B4C] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl py-1 text-xs divide-y divide-slate-100 dark:divide-white/5">
                            {filteredRowProds.slice(0, 15).map((prod) => (
                              <div
                                key={prod.id}
                                onMouseDown={() => handleProductSelect(idx, prod)}
                                className="px-2.5 py-1.5 cursor-pointer hover:bg-etiserv-blue/10 dark:hover:bg-etiserv-blue/20 flex items-center justify-between transition-colors"
                              >
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-900 dark:text-white block truncate">
                                    {prod.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    SKU: {prod.code || prod.barCode || "—"}
                                  </span>
                                </div>
                                <span className="font-bold text-etiserv-blue shrink-0 ml-2 font-mono">
                                  ${prod.salePrice?.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].qty = Math.max(1, Number(e.target.value));
                            setItems(updated);
                          }}
                          className="w-full text-center rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-1 py-1 text-xs font-mono font-bold"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Precio"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].unitPrice = Number(e.target.value);
                            setItems(updated);
                          }}
                          className="w-full text-right rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-1 py-1 text-xs font-mono"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="col-span-2 text-right font-bold tabular-nums text-slate-900 dark:text-white font-mono">
                        ${((item.unitPrice * (1 - item.discountPct / 100)) * item.qty).toFixed(2)}
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar partida"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Summary & Footer Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="text-xs space-y-0.5">
                <div className="text-slate-400">
                  Subtotal: <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                <div className="text-slate-400">
                  IVA (16%): <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">${tax.toFixed(2)}</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Total: <span className="text-etiserv-blue tabular-nums font-mono">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose} type="button">
                  Cancelar [Esc]
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  loading={submitting}
                  glow
                  className="gap-2 font-bold px-4"
                >
                  <Keyboard className="w-3.5 h-3.5" /> Facturar [Ctrl + Enter]
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Post-Emission TTF Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono mb-2">
                ⚡ TTF: {resultData.ttfSeconds}s • Velocidad Óptima
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                ¡Factura {resultData.invoiceSeq} Emitida con Éxito!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Cliente: <strong className="text-slate-700 dark:text-slate-200">{resultData.partnerName}</strong> • Total: <strong className="text-emerald-600">${resultData.total?.toFixed(2)}</strong>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-etiserv-navyDark rounded-xl text-xs space-y-1 max-w-sm mx-auto text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Folio Interno:</span>
                <span className="font-mono font-bold text-etiserv-blue">{resultData.invoiceSeq}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asiento Contable:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">Move #{resultData.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Latencia Backend:</span>
                <span className="font-mono font-bold text-emerald-600">&lt; 250 ms</span>
              </div>
            </div>

            <div className="flex gap-2.5 max-w-sm mx-auto pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs gap-1.5"
                onClick={() => {
                  setResultData(null);
                  setStartTime(performance.now());
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Nueva Factura
              </Button>
              <Button variant="primary" glow className="flex-1 text-xs gap-1.5" onClick={onClose}>
                <Receipt className="w-3.5 h-3.5" /> Cerrar [Esc]
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
