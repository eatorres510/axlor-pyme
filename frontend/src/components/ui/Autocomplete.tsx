import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Check, ChevronDown, X, Building2, User, Landmark, Briefcase } from "lucide-react";
import { clsx } from "clsx";

export interface AutocompleteItem {
  id: number | string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: "user" | "building" | "bank" | "briefcase";
}

interface AutocompleteProps {
  label?: string;
  items: AutocompleteItem[];
  value: number | string;
  onChange: (item: AutocompleteItem) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  items = [],
  value,
  onChange,
  placeholder = "Seleccionar o buscar...",
  searchPlaceholder = "Escribe para filtrar opciones...",
  autoFocus = false,
  required = false,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected item (tolerant to number/string IDs)
  const selectedItem = useMemo(() => {
    if (!value && value !== 0) return null;
    return items.find((i) => String(i.id) === String(value)) || null;
  }, [items, value]);

  // Filter items dynamically based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const titleMatch = (item.title || "").toLowerCase().includes(q);
      const subtitleMatch = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      const badgeMatch = item.badge ? item.badge.toLowerCase().includes(q) : false;
      const idMatch = String(item.id).toLowerCase().includes(q);
      return titleMatch || subtitleMatch || badgeMatch || idMatch;
    });
  }, [items, searchQuery]);

  // When opening dropdown, auto focus the search input and reset highlighted index
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[highlightedIndex]) {
        selectItem(filteredItems[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectItem = (item: AutocompleteItem) => {
    onChange(item);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderIcon = (iconType?: string) => {
    switch (iconType) {
      case "building":
        return <Building2 className="w-3.5 h-3.5 text-etiserv-blue shrink-0" />;
      case "user":
        return <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case "bank":
        return <Landmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case "briefcase":
        return <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={clsx("space-y-1 relative", className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button / Input Box */}
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
        className={clsx(
          "w-full min-h-[38px] bg-white dark:bg-[#071C33] border rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 text-xs transition-all cursor-pointer select-none",
          isOpen
            ? "border-etiserv-blue ring-1 ring-etiserv-blue"
            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
          disabled
            ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed border-slate-200 dark:border-white/5"
            : "text-slate-900 dark:text-white"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedItem ? (
            <>
              {renderIcon(selectedItem.icon)}
              <div className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {selectedItem.title}
                </span>
                {selectedItem.subtitle && (
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    {selectedItem.subtitle}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-slate-400 italic truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <ChevronDown
            className={clsx("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180 text-etiserv-blue")}
          />
        </div>
      </div>

      {/* Floating Suggestions & Search Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-100">
          {/* Internal Live Search Input */}
          <div className="p-2 border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full bg-white dark:bg-[#061527] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-etiserv-blue focus:border-etiserv-blue font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-400">
              <span>{filteredItems.length} opciones disponibles</span>
              {searchQuery && <span>Filtrado por "{searchQuery}"</span>}
            </div>
          </div>

          {/* Scrollable Items List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 py-1 flex-1">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No se encontraron resultados para "{searchQuery}"
                </p>
                <p className="text-[10px]">Verifica el nombre, RFC, código o intenta una búsqueda más amplia.</p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = String(item.id) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={clsx(
                      "w-full text-left px-3 py-2 transition-colors flex items-center justify-between gap-2 text-xs",
                      isHighlighted
                        ? "bg-blue-50 dark:bg-blue-950/50 text-etiserv-blue"
                        : "hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-900 dark:text-white",
                      isSelected && "bg-blue-50/60 dark:bg-blue-950/30 font-semibold"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {renderIcon(item.icon)}
                        <span className={clsx("truncate", isSelected ? "font-bold text-etiserv-blue" : "font-medium")}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-etiserv-blue shrink-0 font-bold" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
