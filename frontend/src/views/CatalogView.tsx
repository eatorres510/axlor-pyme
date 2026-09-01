import React, { useState, useEffect } from "react";
import {
  Package,
  Layers,
  Ruler,
  Users,
  Building2,
  Tags,
  Landmark,
  Coins,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Boxes,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Globe,
  MapPin,
  Receipt,
  Percent,
  ArrowLeftRight,
  Info,
  Check,
  Sparkles,
  Phone,
  Mail,
  FileSpreadsheet,
  Sliders,
  ShieldCheck,
  User,
  ShoppingCart,
  Star,
  PlusCircle,
  X,
  UserPlus,
  Contact2,
  Briefcase,
} from "lucide-react";
import { useCompany, CURRENCY_CONFIGS } from "../context/CompanyContext";
import { clsx } from "clsx";
import {
  catalogApi,
  ProductRecord,
  ProductCategory,
  UnitOfMeasure,
  PartnerRecord,
  PartnerContact,
  PriceListRecord,
} from "../api/catalogApi";
import { financeApi, PartnerStatement, StatementMovement } from "../api/financeApi";
import { DocumentDetailModal } from "../components/modals/DocumentDetailModal";
import { treasuryApi } from "../api/treasuryApi";
import { stockApi } from "../api/stockApi";
import { tenantApi, LATAMCompanySettings } from "../api/tenantApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

type CatalogTab =
  | "PRODUCTS"
  | "CATEGORIES"
  | "UOM"
  | "CUSTOMERS"
  | "SUPPLIERS"
  | "PRICELISTS"
  | "BANKS"
  | "COMPANY";

const POPULAR_BANKS = [
  "BBVA México",
  "Santander México",
  "Banorte",
  "Citibanamex",
  "HSBC México",
  "Scotiabank",
  "Banco Azteca",
  "Inbursa",
  "Mercado Pago",
  "Nu México",
  "JPMorgan Chase",
  "Bank of America",
];

export const LATAM_COUNTRIES: Record<
  string,
  {
    name: string;
    flag: string;
    taxIdLabel: string;
    taxIdPlaceholder: string;
    taxIdTypeDefault: string;
    defaultCurrency: string;
    defaultTaxRate: number;
    taxName: string;
    stateLabel: string;
    cityLabel: string;
    neighborhoodLabel: string;
    taxAuthority: string;
    defaultRegimes: string[];
  }
> = {
  MX: {
    name: "México",
    flag: "🇲🇽",
    taxIdLabel: "RFC (Registro Federal de Contribuyentes)",
    taxIdPlaceholder: "DNP190820XX1",
    taxIdTypeDefault: "RFC",
    defaultCurrency: "MXN",
    defaultTaxRate: 16,
    taxName: "IVA",
    stateLabel: "Estado",
    cityLabel: "Municipio / Alcaldía",
    neighborhoodLabel: "Colonia / Fraccionamiento",
    taxAuthority: "SAT (Servicio de Administración Tributaria)",
    defaultRegimes: [
      "601 - General de Ley Personas Morales",
      "612 - Personas Físicas con Actividades Empresariales",
      "626 - Régimen Simplificado de Confianza (RESICO)",
      "603 - Personas Morales con Fines no Lucrativos",
    ],
  },
  GT: {
    name: "Guatemala",
    flag: "🇬🇹",
    taxIdLabel: "NIT (Número de Identificación Tributaria)",
    taxIdPlaceholder: "1234567-8",
    taxIdTypeDefault: "NIT",
    defaultCurrency: "GTQ",
    defaultTaxRate: 12,
    taxName: "IVA",
    stateLabel: "Departamento",
    cityLabel: "Municipio",
    neighborhoodLabel: "Zona / Barrio (ej. Zona 10)",
    taxAuthority: "SAT (Superintendencia de Administración Tributaria)",
    defaultRegimes: [
      "Régimen General del IVA (12%)",
      "Régimen Opcional Simplificado sobre Ingresos",
      "Régimen de Pequeño Contribuyente (5%)",
      "Régimen Electrónico de Pequeño Contribuyente (4%)",
    ],
  },
  SV: {
    name: "El Salvador",
    flag: "🇸🇻",
    taxIdLabel: "NIT / NRC (Número de Registro de Contribuyente)",
    taxIdPlaceholder: "0614-280390-102-1",
    taxIdTypeDefault: "NIT",
    defaultCurrency: "USD",
    defaultTaxRate: 13,
    taxName: "IVA",
    stateLabel: "Departamento",
    cityLabel: "Municipio / Distrito",
    neighborhoodLabel: "Colonia / Barrio",
    taxAuthority: "Ministerio de Hacienda (DGT)",
    defaultRegimes: [
      "Contribuyente Régimen General (13% IVA)",
      "Gran Contribuyente (Agente de Retención)",
      "Mediano Contribuyente",
      "Otros Contribuyentes",
    ],
  },
  HN: {
    name: "Honduras",
    flag: "🇭🇳",
    taxIdLabel: "RTN (Registro Tributario Nacional)",
    taxIdPlaceholder: "08011990123456",
    taxIdTypeDefault: "RTN",
    defaultCurrency: "HNL",
    defaultTaxRate: 15,
    taxName: "ISV",
    stateLabel: "Departamento",
    cityLabel: "Municipio",
    neighborhoodLabel: "Colonia / Barrio / Aldea",
    taxAuthority: "SAR (Servicio de Administración de Rentas)",
    defaultRegimes: [
      "Régimen General de Facturación (15% ISV)",
      "Régimen de Facturación con CAI",
      "Pequeño y Micro Obligado Tributario",
    ],
  },
  NI: {
    name: "Nicaragua",
    flag: "🇳🇮",
    taxIdLabel: "RUC (Registro Único de Contribuyente)",
    taxIdPlaceholder: "J0310000012345",
    taxIdTypeDefault: "RUC",
    defaultCurrency: "NIO",
    defaultTaxRate: 15,
    taxName: "IVA",
    stateLabel: "Departamento",
    cityLabel: "Municipio",
    neighborhoodLabel: "Barrio / Comarca",
    taxAuthority: "DGI (Dirección General de Ingresos)",
    defaultRegimes: [
      "Régimen General Responsable de IVA",
      "Régimen de Cuota Fija",
      "Gran Contribuyente Nacional",
    ],
  },
  CR: {
    name: "Costa Rica",
    flag: "🇨🇷",
    taxIdLabel: "Cédula Jurídica / Cédula Física",
    taxIdPlaceholder: "3-101-123456",
    taxIdTypeDefault: "CEDULA_JURIDICA",
    defaultCurrency: "CRC",
    defaultTaxRate: 13,
    taxName: "IVA",
    stateLabel: "Provincia",
    cityLabel: "Cantón / Distrito",
    neighborhoodLabel: "Barrio / Caserío",
    taxAuthority: "Ministerio de Hacienda (DGT Costa Rica)",
    defaultRegimes: [
      "Régimen Tradicional General (13% IVA)",
      "Régimen de Tributación Simplificada",
      "Régimen Especial Agropecuario",
    ],
  },
  PA: {
    name: "Panamá",
    flag: "🇵🇦",
    taxIdLabel: "RUC con Dígito Verificador (DV)",
    taxIdPlaceholder: "155678901-2-2021 DV 45",
    taxIdTypeDefault: "RUC",
    defaultCurrency: "USD",
    defaultTaxRate: 7,
    taxName: "ITBMS",
    stateLabel: "Provincia / Comarca",
    cityLabel: "Distrito / Corregimiento",
    neighborhoodLabel: "Barrio / Urbanización",
    taxAuthority: "DGI (Dirección General de Ingresos Panamá)",
    defaultRegimes: [
      "Régimen General ITBMS (7%)",
      "Facturación Electrónica Panamá (SFEP / PAC)",
      "Microempresa Exenta",
    ],
  },
  CO: {
    name: "Colombia",
    flag: "🇨🇴",
    taxIdLabel: "NIT con Dígito de Verificación (DV)",
    taxIdPlaceholder: "900.123.456-7",
    taxIdTypeDefault: "NIT",
    defaultCurrency: "COP",
    defaultTaxRate: 19,
    taxName: "IVA",
    stateLabel: "Departamento",
    cityLabel: "Municipio / Ciudad",
    neighborhoodLabel: "Barrio / Localidad",
    taxAuthority: "DIAN (Dirección de Impuestos y Aduanas Nacionales)",
    defaultRegimes: [
      "Régimen Común / Responsable de IVA (19%)",
      "Régimen Simple de Tributación (SIMPLE)",
      "No Responsable de IVA",
      "Gran Contribuyente / Autorretenedor",
    ],
  },
  PE: {
    name: "Perú",
    flag: "🇵🇪",
    taxIdLabel: "RUC (Registro Único de Contribuyentes)",
    taxIdPlaceholder: "20601234567",
    taxIdTypeDefault: "RUC",
    defaultCurrency: "PEN",
    defaultTaxRate: 18,
    taxName: "IGV",
    stateLabel: "Departamento / Región",
    cityLabel: "Provincia / Distrito",
    neighborhoodLabel: "Urbanización / Sector",
    taxAuthority: "SUNAT (Superintendencia Nacional de Aduanas y de Admin. Tributaria)",
    defaultRegimes: [
      "Régimen General (18% IGV)",
      "Régimen MYPE Tributario (RMT)",
      "Régimen Especial de Renta (RER)",
      "Nuevo RUS (Régimen Único Simplificado)",
    ],
  },
  DO: {
    name: "República Dominicana",
    flag: "🇩🇴",
    taxIdLabel: "RNC (Registro Nacional de Contribuyentes)",
    taxIdPlaceholder: "1-31-12345-6",
    taxIdTypeDefault: "RNC",
    defaultCurrency: "DOP",
    defaultTaxRate: 18,
    taxName: "ITBIS",
    stateLabel: "Provincia",
    cityLabel: "Municipio / Distrito Municipal",
    neighborhoodLabel: "Sector / Barrio",
    taxAuthority: "DGII (Dirección General de Impuestos Internos)",
    defaultRegimes: [
      "Régimen General ITBIS (18%)",
      "Régimen Simplificado de Tributación (RST)",
    ],
  },
  US: {
    name: "Estados Unidos / Internacional",
    flag: "🇺🇸",
    taxIdLabel: "EIN / Tax ID (Employer Identification Number)",
    taxIdPlaceholder: "12-3456789",
    taxIdTypeDefault: "EIN",
    defaultCurrency: "USD",
    defaultTaxRate: 0,
    taxName: "Sales Tax",
    stateLabel: "State",
    cityLabel: "City / County",
    neighborhoodLabel: "Suite / Apt / Building",
    taxAuthority: "IRS (Internal Revenue Service)",
    defaultRegimes: [
      "Corporation (C-Corp / S-Corp)",
      "Limited Liability Company (LLC)",
      "Sole Proprietorship",
    ],
  },
};

export interface CatalogViewProps {
  initialTab?: CatalogTab;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ initialTab }) => {
  const { activeCompany, currencyCode, currencySymbol, setCompanyCurrency } = useCompany();
  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab || "PRODUCTS");

  useEffect(() => {
    if (initialTab) {
      if ((initialTab as string) === "PRICE_LISTS") {
        setActiveTab("PRICELISTS");
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const DEFAULT_CATEGORIES: ProductCategory[] = [
    { id: 1, name: "Bebidas y Refrescos", code: "BEB", description: "Bebidas, aguas y refrescos embotellados" },
    { id: 2, name: "Snacks y Botanas", code: "SNK", description: "Frituras, papas, galletas y botanas" },
    { id: 3, name: "Empaques y Embalaje", code: "EMP", description: "Cajas de cartón, cinta y rollos de emplaye" },
    { id: 4, name: "Servicios y Fletes", code: "SRV", description: "Servicios de transporte, maniobra y flete" },
  ];

  const DEFAULT_UOMS_LIST: UnitOfMeasure[] = [
    { code: "PZA", name: "Pieza / Unidad", symbol: "pza", category: "UNIT" },
    { code: "KGM", name: "Kilogramo", symbol: "kg", category: "WEIGHT" },
    { code: "LTR", name: "Litro", symbol: "lt", category: "VOLUME" },
    { code: "MTR", name: "Metro", symbol: "m", category: "LENGTH" },
    { code: "XBX", name: "Caja", symbol: "cj", category: "UNIT" },
    { code: "XPK", name: "Paquete", symbol: "paq", category: "UNIT" },
    { code: "E48", name: "Unidad de Servicio", symbol: "srv", category: "SERVICE" },
    { code: "HUR", name: "Hora de Servicio", symbol: "hr", category: "SERVICE" },
  ];

  const INITIAL_PRODUCTS: ProductRecord[] = [
    { id: 1, name: "Agua Mineral 600ml", code: "7501055312345", barCode: "7501055312345", salePrice: 15.0, purchasePrice: 10.5, costPrice: 10.5, categoryId: 1, categoryName: "Bebidas y Refrescos", uomCode: "PZA", uomName: "Pieza", taxRate: 16 },
    { id: 2, name: "Refresco Cola 600ml", code: "7501055300011", barCode: "7501055300011", salePrice: 17.5, purchasePrice: 11.0, costPrice: 11.0, categoryId: 1, categoryName: "Bebidas y Refrescos", uomCode: "PZA", uomName: "Pieza", taxRate: 16 },
    { id: 3, name: "Agua Purificada 1.5L", code: "7501055312352", barCode: "7501055312352", salePrice: 20.0, purchasePrice: 12.0, costPrice: 12.0, categoryId: 1, categoryName: "Bebidas y Refrescos", uomCode: "PZA", uomName: "Pieza", taxRate: 16 },
    { id: 4, name: "Papas Fritas Sal 170g", code: "7501000111223", barCode: "7501000111223", salePrice: 38.0, purchasePrice: 26.0, costPrice: 26.0, categoryId: 2, categoryName: "Snacks y Botanas", uomCode: "PZA", uomName: "Pieza", taxRate: 16 },
    { id: 5, name: "Galletas Chocolate 120g", code: "7501000222334", barCode: "7501000222334", salePrice: 22.0, purchasePrice: 14.5, costPrice: 14.5, categoryId: 2, categoryName: "Snacks y Botanas", uomCode: "PZA", uomName: "Pieza", taxRate: 16 },
    { id: 6, name: "Caja Cartón 40x40x40 (Paq 25)", code: "EMP-CJ-01", barCode: "7502220101010", salePrice: 320.0, purchasePrice: 210.0, costPrice: 210.0, categoryId: 3, categoryName: "Empaques y Embalaje", uomCode: "XPK", uomName: "Paquete", taxRate: 16 },
  ];

  const [products, setProducts] = useState<ProductRecord[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>(DEFAULT_UOMS_LIST);
  const [customers, setCustomers] = useState<PartnerRecord[]>([]);
  const [suppliers, setSuppliers] = useState<PartnerRecord[]>([]);
  const [priceLists, setPriceLists] = useState<PriceListRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [stockLevels, setStockLevels] = useState<Record<number, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [modalType, setModalType] = useState<CatalogTab | null>(null);

  const [prodForm, setProdForm] = useState({
    name: "",
    code: "",
    barCode: "",
    salePrice: 0,
    purchasePrice: 0,
    categoryId: 1,
    subCategory: "General",
    costType: "WEIGHTED_AVERAGE",
    imageUrl: "",
    uomCode: "PZA",
    taxRate: 16,
  });

  const [catForm, setCatForm] = useState({ name: "", code: "", description: "" });
  const [uomForm, setUomForm] = useState({ code: "", name: "", symbol: "", category: "UNIT" });

  const [partnerForm, setPartnerForm] = useState<{
    name: string;
    taxNbr: string;
    partnerType: "MORAL" | "FISICA" | "FINAL_CONSUMER" | "DISTRIBUTOR" | "GOVERNMENT";
    fiscalRegime: string;
    cfdiUsage: string;
    contactPerson: string;
    contactJobTitle: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    priceListCode: string;
    creditLimit: number;
    creditDays: number;
    contacts: PartnerContact[];
  }>({
    name: "",
    taxNbr: "",
    partnerType: "MORAL",
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G03 - Gastos en general",
    contactPerson: "",
    contactJobTitle: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    priceListCode: "PUBLIC",
    creditLimit: 0,
    creditDays: 0,
    contacts: [],
  });

  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("ALL");
  const [viewContactsModalOpen, setViewContactsModalOpen] = useState(false);
  const [selectedPartnerForContacts, setSelectedPartnerForContacts] = useState<PartnerRecord | null>(null);

  const handleAddContactToForm = () => {
    setPartnerForm((prev) => {
      const isFirst = prev.contacts.length === 0;
      return {
        ...prev,
        contacts: [
          ...prev.contacts,
          {
            id: Date.now(),
            name: "",
            jobTitle: "",
            department: "Compras",
            email: "",
            phone: "",
            isPrimary: isFirst,
          },
        ],
      };
    });
  };

  const handleRemoveContactFromForm = (idx: number) => {
    setPartnerForm((prev) => {
      const updated = prev.contacts.filter((_, i) => i !== idx);
      if (updated.length > 0 && !updated.some((c) => c.isPrimary)) {
        updated[0].isPrimary = true;
      }
      const primary = updated.find((c) => c.isPrimary) || updated[0];
      return {
        ...prev,
        contacts: updated,
        contactPerson: primary?.name || "",
        contactJobTitle: primary?.jobTitle || "",
        email: primary?.email || "",
        phone: primary?.phone || "",
      };
    });
  };

  const handleUpdateContactField = (idx: number, field: keyof PartnerContact, value: any) => {
    setPartnerForm((prev) => {
      const updated = prev.contacts.map((c, i) => {
        if (i !== idx) return c;
        return { ...c, [field]: value };
      });
      const primary = updated.find((c) => c.isPrimary) || updated[0];
      return {
        ...prev,
        contacts: updated,
        contactPerson: primary?.name || prev.contactPerson,
        contactJobTitle: primary?.jobTitle || prev.contactJobTitle,
        email: primary?.email || prev.email,
        phone: primary?.phone || prev.phone,
      };
    });
  };

  const handleSetPrimaryContactInForm = (idx: number) => {
    setPartnerForm((prev) => {
      const updated = prev.contacts.map((c, i) => ({
        ...c,
        isPrimary: i === idx,
      }));
      const primary = updated[idx];
      return {
        ...prev,
        contacts: updated,
        contactPerson: primary?.name || "",
        contactJobTitle: primary?.jobTitle || "",
        email: primary?.email || "",
        phone: primary?.phone || "",
      };
    });
  };

  const [priceListForm, setPriceListForm] = useState({
    code: "",
    name: "",
    discountPct: 0,
    description: "",
  });

  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementPartner, setStatementPartner] = useState<PartnerRecord | null>(null);
  const [statementData, setStatementData] = useState<PartnerStatement | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<"MONTHLY" | "DAILY">("MONTHLY");

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StatementMovement | null>(null);

  const handleOpenDocDetailFromCatalog = (mov: StatementMovement) => {
    setSelectedMovement(mov);
    setDocModalOpen(true);
  };

  const handleOpenPartnerStatement = async (p: PartnerRecord) => {
    setStatementPartner(p);
    setStatementModalOpen(true);
    if (!activeCompany) return;
    try {
      setLoadingStatement(true);
      const data = await financeApi.getPartnerStatement(p.id, activeCompany.id);
      setStatementData(data);
    } catch (err) {
      console.error("Error al cargar estado de cuenta:", err);
    } finally {
      setLoadingStatement(false);
    }
  };

  const [bankForm, setBankForm] = useState({
    bankName: "BBVA México",
    accountNumber: "",
    currencyCode: "MXN",
    initialBalance: 0,
  });

  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode);
  const [savingCurrency, setSavingCurrency] = useState(false);

  // Sub-pestañas de Configuración de Empresa
  type CompanySubTab = "IDENTIDAD" | "DOMICILIO" | "FACTURACION" | "DIVISAS" | "MEMBRETE";
  const [companySubTab, setCompanySubTab] = useState<CompanySubTab>("IDENTIDAD");

  // Estado Integral de Empresa LATAM & Centroamérica
  const [companyForm, setCompanyForm] = useState<LATAMCompanySettings>({
    companyId: activeCompany?.id || 13,
    country: "MX",
    name: activeCompany?.name || "Distribuidora Nacional PyME S.A. de C.V.",
    commercialName: "Distribuidora PyME",
    code: activeCompany?.code || "DISTR857",
    taxId: activeCompany?.taxId || "DNP190820XX1",
    taxIdType: "RFC",
    giro: "Comercio al por mayor y menor de abarrotes, bienes de consumo y tecnología",
    regimenFiscal: "601 - General de Ley Personas Morales",
    patronalNumber: "Y583920110",
    repName: "Lic. Fernando Garza Salinas",
    repDoc: "GASF850312HDFRRN01",
    address: "Av. Chapultepec 480, Piso 3",
    neighborhood: "Col. Americana",
    postalCode: "44100",
    city: "Guadalajara",
    state: "Jalisco",
    phone: "33 3615 4800",
    whatsapp: "+52 33 1289 9000",
    email: "facturacion@distribuidorapyme.com",
    website: "https://distribuidorapyme.com",
    resolutionNumber: "SAT-DTE-2026-098231",
    resolutionPrefix: "FAC-A",
    resolutionRangeFrom: "001-001-01-00000001",
    resolutionRangeTo: "001-001-01-00100000",
    resolutionExpiry: "2027-12-31",
    defaultTaxRate: 16,
    currency: currencyCode || "MXN",
    secondaryCurrency: "USD",
    exchangeRate: 18.25,
    enableDualCurrency: true,
    exchangeRateUpdated: new Date().toISOString(),
    logoUrl: "",
    ticketHeader: "¡BIENVENIDO A DISTRIBUIDORA PYME!",
    ticketFooter: "¡Gracias por su preferencia! Documento emitido con validez fiscal. No se aceptan devoluciones sin ticket original después de 30 días.",
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySavedToast, setCompanySavedToast] = useState(false);
  const [calcUsdAmount, setCalcUsdAmount] = useState<string>("100");

  useEffect(() => {
    const fetchCompanySettings = async () => {
      if (!activeCompany) return;
      try {
        const data = await tenantApi.getCompanySettings(activeCompany.id);
        if (data) {
          const safeCur =
            typeof data.currency === "object" && data.currency
              ? (data.currency as any).code || "MXN"
              : typeof data.currency === "string"
              ? data.currency
              : typeof currencyCode === "string"
              ? currencyCode
              : "MXN";
          const safeSecCur =
            typeof data.secondaryCurrency === "object" && data.secondaryCurrency
              ? (data.secondaryCurrency as any).code || "USD"
              : typeof data.secondaryCurrency === "string"
              ? data.secondaryCurrency
              : "USD";

          setCompanyForm((prev) => ({
            ...prev,
            ...data,
            name: typeof data.name === "string" ? data.name : activeCompany.name,
            code: typeof data.code === "string" ? data.code : activeCompany.code || "DISTR857",
            taxId: typeof data.taxId === "string" ? data.taxId : activeCompany.taxId || "DNP190820XX1",
            currency: safeCur,
            secondaryCurrency: safeSecCur,
          }));
          setSelectedCurrency(safeCur);
        }
      } catch (err) {
        console.error("Error al cargar configuración de empresa:", err);
      }
    };
    fetchCompanySettings();
  }, [activeCompany, currencyCode]);

  const handleCountryChange = (countryKey: string) => {
    const meta = LATAM_COUNTRIES[countryKey] || LATAM_COUNTRIES.MX;
    setCompanyForm((prev) => ({
      ...prev,
      country: countryKey,
      taxIdType: meta.taxIdTypeDefault,
      defaultTaxRate: meta.defaultTaxRate,
      regimenFiscal: meta.defaultRegimes[0] || prev.regimenFiscal,
      currency: meta.defaultCurrency,
    }));
    setSelectedCurrency(meta.defaultCurrency);
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    try {
      setSavingCompany(true);
      await tenantApi.updateCompanySettings({
        ...companyForm,
        companyId: activeCompany.id,
        currency: selectedCurrency,
      });

      if (selectedCurrency !== currencyCode) {
        await setCompanyCurrency(selectedCurrency);
      }

      setCompanySavedToast(true);
      setTimeout(() => setCompanySavedToast(false), 3000);
      alert("¡Configuración fiscal, divisas y datos de la empresa guardados exitosamente!");
    } catch (err: any) {
      alert(`Error al guardar datos de empresa: ${err.message}`);
    } finally {
      setSavingCompany(false);
    }
  };

  // Paginación y Filtros para Catálogo Masivo (4000-5000 productos)
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(25);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | "ALL">("ALL");

  const loadTabData = async (tabToLoad: CatalogTab = activeTab) => {
    const compId = activeCompany?.id || 13;
    try {
      setLoading(true);
      if (tabToLoad === "CUSTOMERS") {
        const allPartners = await catalogApi.listPartners(compId).catch(() => []);
        const rawCust = allPartners.filter((p: any) => p.isCustomer !== false);
        const seenCust = new Set<string>();
        const uniqueCust = rawCust.filter((c: any) => {
          const nameKey = (c.name || c.fullName || "").trim().toLowerCase();
          const taxKey = (c.taxNbr || "").trim().toUpperCase();
          const key = nameKey ? `${nameKey}_${taxKey}` : String(c.id);
          if (seenCust.has(key)) return false;
          seenCust.add(key);
          return true;
        }).map((c: any, idx: number) => ({
          ...c,
          id: c.id || idx + 1,
          name: c.name || c.fullName || `Cliente ${idx + 1}`,
          taxNbr: c.taxNbr || "XAXX010101000",
          partnerType: c.partnerType || "MORAL",
          priceListCode: c.priceListCode || "PUBLIC",
          creditLimit: Number(c.creditLimit || 0),
          creditDays: Number(c.creditDays || 0),
          contacts: Array.isArray(c.contacts) ? c.contacts : [],
        }));
        setCustomers(uniqueCust);
      } else if (tabToLoad === "SUPPLIERS") {
        const allPartners = await catalogApi.listPartners(compId).catch(() => []);
        const rawSupp = allPartners.filter((p: any) => p.isSupplier === true);
        const seenSupp = new Set<string>();
        const uniqueSupp = rawSupp.filter((s: any) => {
          const nameKey = (s.name || s.fullName || "").trim().toLowerCase();
          const taxKey = (s.taxNbr || "").trim().toUpperCase();
          const key = nameKey ? `${nameKey}_${taxKey}` : String(s.id);
          if (seenSupp.has(key)) return false;
          seenSupp.add(key);
          return true;
        }).map((s: any, idx: number) => ({
          ...s,
          id: s.id || idx + 1,
          name: s.name || s.fullName || `Proveedor ${idx + 1}`,
          taxNbr: s.taxNbr || "XAXX010101000",
          partnerType: s.partnerType || "MORAL",
          creditDays: Number(s.creditDays || 0),
          contacts: Array.isArray(s.contacts) ? s.contacts : [],
        }));
        setSuppliers(uniqueSupp);
      } else if (tabToLoad === "PRODUCTS") {
        const [prodData, catData, uomData, stockData] = await Promise.all([
          catalogApi.listProducts(compId).catch(() => []),
          catalogApi.listCategories().catch(() => []),
          catalogApi.listUoMs().catch(() => []),
          stockApi.getStockLevels(compId).catch(() => []),
        ]);
        const stockMap: Record<number, number> = {};
        (stockData || []).forEach((s: any) => {
          if (s.productId) stockMap[s.productId] = s.currentStock;
        });
        setStockLevels(stockMap);
        setProducts(prodData && prodData.length > 0 ? prodData : INITIAL_PRODUCTS);
        setCategories(catData && catData.length > 0 ? catData : DEFAULT_CATEGORIES);
        setUoms(uomData && uomData.length > 0 ? uomData : DEFAULT_UOMS_LIST);
      } else if (tabToLoad === "CATEGORIES") {
        const catData = await catalogApi.listCategories().catch(() => []);
        const defaultCats = [
          { id: 1, name: "Bebidas y Refrescos", code: "BEB", description: "Bebidas, aguas y refrescos embotellados" },
          { id: 2, name: "Snacks y Botanas", code: "SNK", description: "Frituras, papas, galletas y botanas" },
          { id: 3, name: "Empaques y Embalaje", code: "EMP", description: "Cajas de cartón, cinta y rollos de emplaye" },
          { id: 4, name: "Servicios y Fletes", code: "SRV", description: "Servicios de transporte, maniobra y flete" },
        ];
        const combinedCats = catData && catData.length > 0 ? catData : defaultCats;
        const seenCat = new Set<string>();
        const uniqueCats = combinedCats.filter((c: any) => {
          const key = (c.name || c.code || "").trim().toLowerCase() || String(c.id);
          if (!key || seenCat.has(key)) return false;
          seenCat.add(key);
          return true;
        }).map((c: any, idx: number) => ({
          ...c,
          id: c.id || idx + 1,
          name: c.name || `Categoría ${idx + 1}`,
          code: c.code || `CAT-${c.id || idx + 1}`,
          description: c.description || "Familia comercial para ventas e inventarios",
        }));
        setCategories(uniqueCats);
      } else if (tabToLoad === "UOM") {
        const uomData = await catalogApi.listUoMs().catch(() => []);
        const fallbackUoms = [
          { code: "PZA", name: "Pieza / Unidad", symbol: "pza", category: "UNIT" as const },
          { code: "KGM", name: "Kilogramo", symbol: "kg", category: "WEIGHT" as const },
          { code: "LTR", name: "Litro", symbol: "lt", category: "VOLUME" as const },
          { code: "MTR", name: "Metro", symbol: "m", category: "LENGTH" as const },
          { code: "XBX", name: "Caja", symbol: "cj", category: "UNIT" as const },
          { code: "XPK", name: "Paquete", symbol: "paq", category: "UNIT" as const },
          { code: "E48", name: "Unidad de Servicio", symbol: "srv", category: "SERVICE" as const },
          { code: "HUR", name: "Hora de Servicio", symbol: "hr", category: "SERVICE" as const },
        ];
        setUoms(uomData && uomData.length > 0 ? uomData : fallbackUoms);
      } else if (tabToLoad === "PRICELISTS") {
        const priceData = await catalogApi.listPriceLists().catch(() => []);
        setPriceLists(priceData || []);
      } else if (tabToLoad === "BANKS") {
        const bankData = await treasuryApi.listBankAccounts(compId).catch(() => []);
        setBankAccounts(bankData || []);
      }
    } catch (err) {
      console.error("Error al cargar datos de pestaña:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = () => loadTabData(activeTab);

  useEffect(() => {
    loadTabData(activeTab);
    setSelectedCurrency(currencyCode);
  }, [activeTab, activeCompany?.id, currencyCode]);

  const [editingId, setEditingId] = useState<number | string | null>(null);

  const handleOpenCreate = (tab: CatalogTab) => {
    setEditingId(null);
    if (tab === "PRODUCTS") {
      setProdForm({
        name: "",
        code: "",
        barCode: "",
        salePrice: 0,
        purchasePrice: 0,
        categoryId: categories[0]?.id || 1,
        subCategory: "General",
        costType: "WEIGHTED_AVERAGE",
        imageUrl: "",
        uomCode: "PZA",
        taxRate: 16,
      });
    } else if (tab === "CATEGORIES") {
      setCatForm({ name: "", code: "", description: "" });
    } else if (tab === "UOM") {
      setUomForm({ code: "", name: "", symbol: "", category: "UNIT" });
    } else if (tab === "CUSTOMERS" || tab === "SUPPLIERS") {
      setPartnerForm({
        name: "",
        taxNbr: "",
        partnerType: "MORAL",
        fiscalRegime: "601 - General de Ley Personas Morales",
        cfdiUsage: "G03 - Gastos en general",
        contactPerson: "",
        contactJobTitle: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        priceListCode: "PUBLIC",
        creditLimit: 0,
        creditDays: 0,
        contacts: [
          {
            id: 1,
            name: "",
            jobTitle: "Representante / Contacto",
            department: "General",
            email: "",
            phone: "",
            isPrimary: true,
          },
        ],
      });
    } else if (tab === "PRICELISTS") {
      setPriceListForm({ code: "", name: "", discountPct: 0, description: "" });
    } else if (tab === "BANKS") {
      setBankForm({
        bankName: "BBVA México",
        accountNumber: "",
        currencyCode: "MXN",
        initialBalance: 0,
      });
    }
    setModalType(tab);
  };

  const handleOpenEditProduct = (p: ProductRecord) => {
    setEditingId(p.id);
    const catId = p.categoryId || (typeof (p as any).category === "object" ? (p as any).category?.id : categories[0]?.id) || 1;
    setProdForm({
      name: p.name || "",
      code: p.code || "",
      barCode: p.barCode || "",
      salePrice: p.salePrice || 0,
      purchasePrice: p.purchasePrice || p.costPrice || 0,
      categoryId: catId,
      subCategory: (p as any).subCategory || "General",
      costType: (p as any).costType || "WEIGHTED_AVERAGE",
      imageUrl: (p as any).imageUrl || "",
      uomCode: p.uomCode || "PZA",
      taxRate: 16,
    });
    setModalType("PRODUCTS");
  };

  const handleDeleteProduct = async (p: ProductRecord) => {
    if (!confirm(`¿Deseas eliminar el producto "${p.name}"?`)) return;
    try {
      await catalogApi.deleteProduct(p.id);
      loadAllData();
    } catch (err: any) {
      alert(`Error al eliminar producto: ${err.message}`);
    }
  };

  const handleOpenEditCategory = (c: ProductCategory) => {
    setEditingId(c.id);
    setCatForm({
      name: c.name || "",
      code: c.code || "",
      description: c.description || "",
    });
    setModalType("CATEGORIES");
  };

  const handleDeleteCategory = async (c: ProductCategory) => {
    if (!confirm(`¿Deseas eliminar la familia "${c.name}"?`)) return;
    try {
      await catalogApi.deleteCategory(c.id);
      loadAllData();
    } catch (err: any) {
      alert(`Error al eliminar categoría: ${err.message}`);
    }
  };

  const handleOpenEditUoM = (u: UnitOfMeasure) => {
    setEditingId(u.code);
    setUomForm({
      code: u.code,
      name: u.name,
      symbol: u.symbol,
      category: u.category || "UNIT",
    });
    setModalType("UOM");
  };

  const handleDeleteUoM = async (u: UnitOfMeasure) => {
    if (!confirm(`¿Deseas eliminar la unidad de medida "${u.name}"?`)) return;
    try {
      await catalogApi.deleteUoM(u.code);
      loadAllData();
    } catch (err: any) {
      alert(`Error al eliminar UoM: ${err.message}`);
    }
  };

  const handleOpenEditPartner = (p: PartnerRecord) => {
    setEditingId(p.id);
    const initialContacts =
      Array.isArray(p.contacts) && p.contacts.length > 0
        ? p.contacts
        : p.contactPerson || p.email || p.phone
        ? [
            {
              id: 1,
              name: p.contactPerson || p.name,
              jobTitle: p.contactJobTitle || "Representante",
              department: "General",
              email: p.email || "",
              phone: p.phone || "",
              isPrimary: true,
            },
          ]
        : [];

    setPartnerForm({
      name: p.name || "",
      taxNbr: p.taxNbr || "",
      partnerType: p.partnerType || "MORAL",
      fiscalRegime: p.fiscalRegime || "601 - General de Ley Personas Morales",
      cfdiUsage: p.cfdiUsage || "G03 - Gastos en general",
      contactPerson: p.contactPerson || "",
      contactJobTitle: p.contactJobTitle || "",
      email: p.email || "",
      phone: p.phone || "",
      address: p.address || "",
      city: p.city || "",
      priceListCode: p.priceListCode || "PUBLIC",
      creditLimit: p.creditLimit || 0,
      creditDays: p.creditDays || 0,
      contacts: initialContacts,
    });
    setModalType(p.isCustomer ? "CUSTOMERS" : "SUPPLIERS");
  };

  const handleDeletePartner = async (p: PartnerRecord) => {
    if (!confirm(`¿Deseas eliminar el contacto "${p.name}"?`)) return;
    try {
      await catalogApi.deletePartner(p.id);
      loadAllData();
    } catch (err: any) {
      alert(`Error al eliminar contacto: ${err.message}`);
    }
  };

  const handleOpenEditPriceList = (pl: PriceListRecord) => {
    setEditingId(pl.code);
    setPriceListForm({
      code: pl.code,
      name: pl.name,
      discountPct: pl.discountPct,
      description: pl.description || "",
    });
    setModalType("PRICELISTS");
  };

  const handleDeletePriceList = async (pl: PriceListRecord) => {
    if (!confirm(`¿Deseas eliminar la lista de precios "${pl.name}"?`)) return;
    try {
      await catalogApi.deletePriceList(pl.code);
      loadAllData();
    } catch (err: any) {
      alert(`Error al eliminar lista: ${err.message}`);
    }
  };

  const handleDeleteBankAccount = async (b: any) => {
    if (!confirm(`¿Deseas eliminar la cuenta "${b.bank?.name || b.label}"?`)) return;
    try {
      await treasuryApi.deleteBankAccount(b.id);
      loadAllData();
    } catch (err: any) {
      alert(`Error al eliminar cuenta bancaria: ${err.message}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    const cat = categories.find((c) => c.id === Number(prodForm.categoryId));
    const uom = uoms.find((u) => u.code === prodForm.uomCode);

    try {
      if (editingId) {
        await catalogApi.updateProduct(Number(editingId), {
          ...prodForm,
          categoryId: Number(prodForm.categoryId),
          categoryName: cat?.name,
          uomName: uom?.name,
        });
      } else {
        await catalogApi.createProduct({
          ...prodForm,
          categoryId: Number(prodForm.categoryId),
          categoryName: cat?.name,
          uomName: uom?.name,
          companyId: activeCompany.id,
        });
      }
      setModalType(null);
      setEditingId(null);
      loadAllData();
    } catch (err: any) {
      alert(`Error al guardar producto: ${err.message}`);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await catalogApi.updateCategory(Number(editingId), catForm);
      } else {
        await catalogApi.createCategory(catForm);
      }
      setModalType(null);
      setEditingId(null);
      loadAllData();
    } catch (err: any) {
      alert(`Error al guardar categoría: ${err.message}`);
    }
  };

  const handleSaveUoM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await catalogApi.updateUoM(String(editingId), uomForm);
      } else {
        await catalogApi.createUoM(uomForm);
      }
      setModalType(null);
      setEditingId(null);
      loadAllData();
    } catch (err: any) {
      alert(`Error al guardar UoM: ${err.message}`);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    try {
      if (editingId) {
        await catalogApi.updatePartner(Number(editingId), {
          ...partnerForm,
          isCustomer: true,
          isSupplier: false,
        });
      } else {
        await catalogApi.createPartner({
          ...partnerForm,
          isCustomer: true,
          isSupplier: false,
          companyId: activeCompany.id,
        });
      }
      setModalType(null);
      setEditingId(null);
      loadAllData();
    } catch (err: any) {
      alert(`Error al guardar cliente: ${err.message}`);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    try {
      if (editingId) {
        await catalogApi.updatePartner(Number(editingId), {
          ...partnerForm,
          isCustomer: false,
          isSupplier: true,
        });
      } else {
        await catalogApi.createPartner({
          ...partnerForm,
          isCustomer: false,
          isSupplier: true,
          companyId: activeCompany.id,
        });
      }
      setModalType(null);
      setEditingId(null);
      loadAllData();
    } catch (err: any) {
      alert(`Error al guardar proveedor: ${err.message}`);
    }
  };

  const handleSavePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await catalogApi.updatePriceList(String(editingId), priceListForm);
      } else {
        await catalogApi.createPriceList(priceListForm);
      }
      setModalType(null);
      setEditingId(null);
      loadAllData();
    } catch (err: any) {
      alert(`Error al guardar lista: ${err.message}`);
    }
  };

  const handleCreateBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    try {
      await treasuryApi.createBankAccount({
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber,
        companyId: activeCompany.id,
      });
      setModalType(null);
      setBankForm({
        bankName: "BBVA México",
        accountNumber: "",
        currencyCode: "MXN",
        initialBalance: 0,
      });
      loadAllData();
      alert("¡Cuenta bancaria registrada exitosamente!");
    } catch (err: any) {
      alert(`Error al crear cuenta bancaria: ${err.message}`);
    }
  };

  const handleSaveCurrency = async () => {
    try {
      setSavingCurrency(true);
      await setCompanyCurrency(selectedCurrency);
      alert("¡Moneda oficial guardada exitosamente!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCurrency(false);
    }
  };

const TAB_CONFIGS: Record<
  CatalogTab,
  {
    title: string;
    subtitle: string;
    badge: string;
    badgeVariant: "primary" | "info" | "success" | "warning" | "danger" | "neutral";
    actionLabel: string;
    searchPlaceholder: string;
  }
> = {
  PRODUCTS: {
    title: "Catálogo de Productos & Servicios",
    subtitle: "Inventario de artículos comerciales, códigos de barras, precios de venta, costos y stock actual",
    badge: "Inventario & Almacén",
    badgeVariant: "primary",
    actionLabel: "Nuevo Producto",
    searchPlaceholder: "Buscar por nombre, código de barras o SKU...",
  },
  CATEGORIES: {
    title: "Familias & Categorías de Producto",
    subtitle: "Estructura jerárquica de artículos, familias comerciales y valorización de inventario por categoría",
    badge: "Inventario & Almacén",
    badgeVariant: "primary",
    actionLabel: "Nueva Familia",
    searchPlaceholder: "Buscar familia o categoría...",
  },
  UOM: {
    title: "Unidades de Medida (UoM)",
    subtitle: "Catálogo estándar de unidades de medida (Piezas, Cajas, Kilos, Litros, Metros, etc.)",
    badge: "Inventario & Almacén",
    badgeVariant: "primary",
    actionLabel: "Nueva Unidad",
    searchPlaceholder: "Buscar unidad o símbolo...",
  },
  CUSTOMERS: {
    title: "Directorio de Clientes",
    subtitle: "Gestión de clientes, RFC, límites de crédito, plazos de pago y listas de precios asignadas",
    badge: "Comercial & Ventas",
    badgeVariant: "success",
    actionLabel: "Nuevo Cliente",
    searchPlaceholder: "Buscar cliente por nombre, RFC o correo...",
  },
  SUPPLIERS: {
    title: "Padrón de Proveedores (CxP)",
    subtitle: "Directorio de proveedores, RFC, condiciones de pago, cuentas bancarias y plazos de crédito",
    badge: "Compras & Abastecimiento",
    badgeVariant: "warning",
    actionLabel: "Nuevo Proveedor",
    searchPlaceholder: "Buscar proveedor por razón social, RFC o contacto...",
  },
  PRICELISTS: {
    title: "Listas de Precios & Tarifas",
    subtitle: "Control de políticas de precios: Público, Mayoreo, Distribuidores y reglas de descuento",
    badge: "Comercial & Ventas",
    badgeVariant: "success",
    actionLabel: "Nueva Lista de Precios",
    searchPlaceholder: "Buscar lista de precios...",
  },
  BANKS: {
    title: "Cuentas Bancarias & Cajas",
    subtitle: "Cuentas de banco para cobros y pagos de tesorería",
    badge: "Finanzas & Contabilidad",
    badgeVariant: "neutral",
    actionLabel: "Nueva Cuenta Bancaria",
    searchPlaceholder: "Buscar cuenta bancaria...",
  },
  COMPANY: {
    title: "Datos Fiscales & Configuración de Empresa",
    subtitle: "Razón social, RFC, régimen fiscal, logotipo y moneda operativa del sistema (MXN, USD)",
    badge: "Configuración & Empresa",
    badgeVariant: "neutral",
    actionLabel: "Guardar Configuración",
    searchPlaceholder: "",
  },
};

  const currentConfig = TAB_CONFIGS[activeTab] || TAB_CONFIGS.PRODUCTS;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dedicated Header per View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              {currentConfig.title}
            </h2>
            <Badge variant={currentConfig.badgeVariant}>{currentConfig.badge}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentConfig.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAllData} loading={loading} className="gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          {activeTab !== "COMPANY" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreate(activeTab)}
              className="gap-1.5 text-xs font-semibold"
              glow
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{currentConfig.actionLabel}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Input for Data Tabs */}
      {activeTab !== "COMPANY" && activeTab !== "CUSTOMERS" && activeTab !== "SUPPLIERS" && currentConfig.searchPlaceholder && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentConfig.searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-etiserv-blue"
          />
        </div>
      )}

      {/* TAB 1: PRODUCTS (CON PAGINACIÓN MASIVA Y FILTRO DE CATEGORÍAS) */}
      {activeTab === "PRODUCTS" && (() => {
        const filteredProducts = products.filter((p) => {
          const q = searchQuery.toLowerCase().trim();
          const matchesSearch =
            !q ||
            (p.name || "").toLowerCase().includes(q) ||
            (p.code || "").toLowerCase().includes(q) ||
            (p.barCode || "").toLowerCase().includes(q) ||
            (p.categoryName || "").toLowerCase().includes(q);

          const matchesCategory =
            selectedCategoryFilter === "ALL" ||
            p.categoryId === selectedCategoryFilter ||
            (p.categoryName &&
              (categories.find((c) => c.id === selectedCategoryFilter)?.name || "").toLowerCase() ===
                (p.categoryName || "").toLowerCase());

          return matchesSearch && matchesCategory;
        });

        const totalItems = filteredProducts.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / productPageSize));
        const safePage = Math.min(productPage, totalPages);
        const startIndex = (safePage - 1) * productPageSize;
        const endIndex = Math.min(startIndex + productPageSize, totalItems);
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        return (
          <div className="space-y-3">
            {/* Top Filter & Pagination Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter Dropdown */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-etiserv-blue" />
                  <span className="text-slate-500 font-semibold">Familia:</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) =>
                      setSelectedCategoryFilter(
                        e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                      )
                    }
                    className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-etiserv-blue"
                  >
                    <option value="ALL">Todas las Familias ({products.length})</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="ml-2 font-semibold">Ver:</span>
                  {[25, 50, 100, 250].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setProductPageSize(size);
                        setProductPage(1);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                        productPageSize === size
                          ? "bg-etiserv-blue text-white shadow-xs"
                          : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <span className="text-[11px]">por pág</span>
                </div>
              </div>

              {/* Total counter info */}
              <div className="text-xs font-medium text-slate-500">
                Mostrando{" "}
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {totalItems > 0 ? startIndex + 1 : 0} - {endIndex}
                </span>{" "}
                de{" "}
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {totalItems.toLocaleString()}
                </span>{" "}
                artículos
              </div>
            </div>

            {/* Products Table Card */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="py-2.5 px-4">Código / SKU</th>
                      <th className="py-2.5 px-4">Nombre del Producto / Servicio</th>
                      <th className="py-2.5 px-4">Familia / Categoría</th>
                      <th className="py-2.5 px-4">UoM</th>
                      <th className="py-2.5 px-4 text-right">Precio Venta</th>
                      <th className="py-2.5 px-4 text-right">Costo Est.</th>
                      <th className="py-2.5 px-4 text-center">IVA</th>
                      <th className="py-2.5 px-4 text-center">Estado</th>
                      <th className="py-2.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {paginatedProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-12 text-center text-slate-400 text-xs font-medium"
                        >
                          No se encontraron artículos con los criterios seleccionados
                        </td>
                      </tr>
                    )}
                    {paginatedProducts.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-etiserv-blue">
                          {p.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {p.imageUrl && (
                              <img
                                src={p.imageUrl}
                                alt=""
                                className="w-6 h-6 rounded object-cover border border-slate-200 dark:border-white/10"
                                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                              />
                            )}
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral">{p.categoryName || "General"}</Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {p.uomCode || "PZA"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white font-mono">
                          {currencySymbol}
                          {p.salePrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                          {currencySymbol}
                          {(p.purchasePrice || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-semibold">
                            16%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="success" dot>
                            Activo
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1 text-slate-400 hover:text-etiserv-blue hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                              title="Editar Producto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                              title="Eliminar Producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination Control */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">
                    Página{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {safePage}
                    </strong>{" "}
                    de{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {totalPages}
                    </strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage(1)}
                      disabled={safePage <= 1}
                      className="text-xs p-1.5"
                      title="Primera Página"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="text-xs p-1.5 gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </Button>

                    <span className="px-3 py-1 bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md font-mono font-bold text-slate-800 dark:text-white shadow-xs">
                      {safePage} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="text-xs p-1.5 gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage(totalPages)}
                      disabled={safePage >= totalPages}
                      className="text-xs p-1.5"
                      title="Última Página"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        );
      })()}

      {/* TAB 2: CATEGORIES */}
      {activeTab === "CATEGORIES" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories
              .filter((c) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase().trim();
                return (
                  (c.name || "").toLowerCase().includes(q) ||
                  (c.code || "").toLowerCase().includes(q) ||
                  (c.description || "").toLowerCase().includes(q)
                );
              })
              .map((cat, idx) => {
                const safeCatName = (cat.name || "").toLowerCase().trim();
                const catProducts = products.filter(
                  (p) =>
                    p.categoryId === cat.id ||
                    (p.categoryName && (p.categoryName || "").toLowerCase().trim() === safeCatName)
                );
                const catTotalStock = catProducts.reduce(
                  (sum, p) => sum + (stockLevels[p.id] !== undefined ? Number(stockLevels[p.id]) || 0 : 0),
                  0
                );
                const catInventoryValue = catProducts.reduce((sum, p) => {
                  const stock = stockLevels[p.id] !== undefined ? Number(stockLevels[p.id]) || 0 : 0;
                  const cost = Number(p.purchasePrice || p.costPrice || (Number(p.salePrice || 0) * 0.6) || 0);
                  return sum + stock * cost;
                }, 0);

                return (
                  <Card
                    key={`${cat.id}-${cat.code || idx}`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryModalOpen(true);
                    }}
                    className="p-4 flex flex-col justify-between cursor-pointer hover:border-etiserv-blue dark:hover:border-etiserv-blue transition-all group hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-etiserv-blue font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40">
                          {cat.code || `CAT-${cat.id}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="primary" className="text-[10px]">
                            {catProducts.length} {catProducts.length === 1 ? "Producto" : "Productos"}
                          </Badge>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditCategory(cat);
                            }}
                            className="p-1 text-slate-400 hover:text-etiserv-blue rounded transition-colors"
                            title="Editar Familia"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar Familia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-etiserv-blue transition-colors">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {cat.description || "Familia comercial para ventas e inventarios"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Boxes className="w-3.5 h-3.5 text-slate-400" /> Stock Total:
                        </span>
                        <span className="font-semibold font-mono text-slate-900 dark:text-white">
                          {catTotalStock.toLocaleString()} {catTotalStock === 1 ? "unidad" : "unidades"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Valor Inventario:
                        </span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {currencySymbol}{catInventoryValue.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end text-[11px] font-semibold text-etiserv-blue group-hover:translate-x-0.5 transition-transform gap-1">
                        <span>Ver Productos &amp; Inventario</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>

          {categories.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#0B2B4C] rounded-xl border border-slate-200 dark:border-white/10">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                No hay familias o categorías registradas
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Crea categorías para clasificar productos comerciales, materias primas y servicios.
              </p>
              <Button
                variant="primary"
                size="sm"
                glow
                onClick={() => handleOpenCreate("CATEGORIES")}
                className="mt-4 gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Primera Familia</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UOM */}
      {activeTab === "UOM" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Clave ISO / SAT</th>
                  <th className="py-2.5 px-5">Nombre de la Unidad</th>
                  <th className="py-2.5 px-5">Símbolo</th>
                  <th className="py-2.5 px-5">Tipo de Magnitud</th>
                  <th className="py-2.5 px-5 text-center">Estado</th>
                  <th className="py-2.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(() => {
                  const filteredUoms = uoms.filter(
                    (u) =>
                      !searchQuery.trim() ||
                      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                      (u.code || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                      (u.symbol || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
                  );

                  if (filteredUoms.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                          <Ruler className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                          <span>No se encontraron unidades de medida {searchQuery ? `coincidentes con "${searchQuery}"` : "registradas"}</span>
                          <div className="mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              glow
                              onClick={() => handleOpenCreate("UOM")}
                              className="text-xs gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Nueva Unidad</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return filteredUoms.map((u, idx) => (
                    <tr key={`${u.code || idx}`} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5 font-mono text-xs font-bold text-etiserv-blue">
                        {u.code}
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-500">
                        {u.symbol || (u.code ? u.code.toLowerCase() : "-")}
                      </td>
                      <td className="py-3 px-5">
                        <Badge variant="neutral">
                          {typeof u.category === "object"
                            ? (u.category as any)?.name || (u.category as any)?.code || "Unidad"
                            : u.category || "Unidad"}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <Badge variant="success" dot>Disponible</Badge>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUoM(u)}
                            className="p-1 text-slate-400 hover:text-etiserv-blue hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                            title="Editar Unidad"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUoM(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                            title="Eliminar Unidad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: CUSTOMERS */}
      {activeTab === "CUSTOMERS" && (
        <div className="space-y-3">
          {/* Top Filter & Search Bar for Customers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#071C33] p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente por nombre, RFC o correo..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-etiserv-blue"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-etiserv-blue shrink-0" />
              <span className="text-slate-500 font-semibold shrink-0">Tipo de Cliente:</span>
              <select
                value={customerTypeFilter}
                onChange={(e) => setCustomerTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-etiserv-blue"
              >
                <option value="ALL">Todos los Tipos ({customers.length})</option>
                <option value="MORAL">🏢 Empresas / Personas Morales ({customers.filter(c => (c.partnerType || 'MORAL') === 'MORAL').length})</option>
                <option value="FISICA">👤 Personas Físicas ({customers.filter(c => c.partnerType === 'FISICA').length})</option>
                <option value="FINAL_CONSUMER">🛒 Público General / B2C ({customers.filter(c => c.partnerType === 'FINAL_CONSUMER').length})</option>
                <option value="DISTRIBUTOR">🏷️ Distribuidores ({customers.filter(c => c.partnerType === 'DISTRIBUTOR').length})</option>
                <option value="GOVERNMENT">🏛️ Gobierno ({customers.filter(c => c.partnerType === 'GOVERNMENT').length})</option>
              </select>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-4">Razón Social / Cliente</th>
                    <th className="py-2.5 px-4">Tipo de Cliente</th>
                    <th className="py-2.5 px-4">RFC / Tax ID</th>
                    <th className="py-2.5 px-4">Tarifa Asignada</th>
                    <th className="py-2.5 px-4 text-right">Límite Crédito</th>
                    <th className="py-2.5 px-4 text-center">Días Crédito</th>
                    <th className="py-2.5 px-4">Contacto</th>
                    <th className="py-2.5 px-4 text-center">Estado</th>
                    <th className="py-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(() => {
                    const filteredCustomers = customers.filter((c) => {
                      const q = searchQuery.toLowerCase().trim();
                      const matchesSearch =
                        !q ||
                        (c.name || "").toLowerCase().includes(q) ||
                        (c.taxNbr || "").toLowerCase().includes(q) ||
                        (c.contactPerson || "").toLowerCase().includes(q) ||
                        (c.email || "").toLowerCase().includes(q) ||
                        (c.phone || "").toLowerCase().includes(q) ||
                        (c.city || "").toLowerCase().includes(q) ||
                        (c.address || "").toLowerCase().includes(q) ||
                        (c.priceListCode || "").toLowerCase().includes(q);

                      const pType = c.partnerType || "MORAL";
                      const matchesType = customerTypeFilter === "ALL" || pType === customerTypeFilter;

                      return matchesSearch && matchesType;
                    });

                    if (filteredCustomers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-medium">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                            <span>No se encontraron clientes {searchQuery ? `coincidentes con "${searchQuery}"` : "registrados"}</span>
                            {(searchQuery || customerTypeFilter !== "ALL") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery("");
                                  setCustomerTypeFilter("ALL");
                                }}
                                className="block mx-auto mt-2 text-xs text-etiserv-blue font-semibold hover:underline"
                              >
                                Limpiar filtros
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }

                    return filteredCustomers.map((c, idx) => (
                      <tr key={`${c.id}-${c.taxNbr || idx}`} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-3 px-4">
                          {c.partnerType === "FINAL_CONSUMER" ? (
                            <Badge variant="neutral" className="text-[10px] gap-1 font-semibold whitespace-nowrap">
                              <ShoppingCart className="w-3 h-3 text-slate-500" /> Público General (B2C)
                            </Badge>
                          ) : c.partnerType === "FISICA" ? (
                            <Badge variant="info" className="text-[10px] gap-1 font-semibold whitespace-nowrap">
                              <User className="w-3 h-3 text-cyan-600" /> Persona Física (B2B)
                            </Badge>
                          ) : c.partnerType === "DISTRIBUTOR" ? (
                            <Badge variant="success" className="text-[10px] gap-1 font-semibold whitespace-nowrap">
                              <Tags className="w-3 h-3 text-emerald-600" /> Distribuidor
                            </Badge>
                          ) : c.partnerType === "GOVERNMENT" ? (
                            <Badge variant="warning" className="text-[10px] gap-1 font-semibold whitespace-nowrap">
                              <Landmark className="w-3 h-3 text-amber-600" /> Gobierno
                            </Badge>
                          ) : (
                            <Badge variant="primary" className="text-[10px] gap-1 font-semibold whitespace-nowrap">
                              <Building2 className="w-3 h-3 text-etiserv-blue" /> Empresa / P. Moral
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-etiserv-blue font-semibold">
                          {c.taxNbr}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral">{c.priceListCode || "PUBLIC"}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                          {c.creditLimit && c.creditLimit > 0 ? `${currencySymbol}${c.creditLimit.toLocaleString()}` : "Sin Límite"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {c.creditDays ? `${c.creditDays} días` : "Contado"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {c.contacts && c.contacts.length > 0 ? (
                            <div>
                              {(() => {
                                const primary = c.contacts.find((ct) => ct.isPrimary) || c.contacts[0];
                                return (
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                      <Users className="w-3 h-3 text-etiserv-blue shrink-0" />
                                      <span>{primary.name}</span>
                                      {primary.jobTitle && (
                                        <span className="text-[10px] text-slate-400 font-normal">({primary.jobTitle})</span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                                      {primary.phone && <span title={`Teléfono: ${primary.phone}`}>📞 {primary.phone}</span>}
                                      {primary.email && <span className="truncate max-w-[180px]" title={`Correo: ${primary.email}`}>✉️ {primary.email}</span>}
                                    </div>
                                  </div>
                                );
                              })()}
                              {c.contacts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPartnerForContacts(c);
                                    setViewContactsModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-etiserv-blue hover:text-etiserv-lightBlue bg-etiserv-blue/10 hover:bg-etiserv-blue/20 px-2 py-0.5 rounded-full transition-colors"
                                  title="Ver todos los contactos registrados"
                                >
                                  <Users className="w-2.5 h-2.5" />
                                  <span>+{c.contacts.length - 1} contacto{c.contacts.length - 1 > 1 ? "s" : ""}</span>
                                </button>
                              )}
                            </div>
                          ) : c.contactPerson ? (
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                <Users className="w-3 h-3 text-etiserv-blue shrink-0" />
                                <span>{c.contactPerson}</span>
                                {c.contactJobTitle && (
                                  <span className="text-[10px] text-slate-400 font-normal">({c.contactJobTitle})</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                                {c.phone && <span title={`Teléfono: ${c.phone}`}>📞 {c.phone}</span>}
                                {c.email && <span className="truncate max-w-[200px]" title={`Correo: ${c.email}`}>✉️ {c.email}</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 font-mono">
                              {c.phone && <div title={`Teléfono: ${c.phone}`}>📞 {c.phone}</div>}
                              {c.email && <div className="truncate max-w-[200px]" title={`Correo: ${c.email}`}>✉️ {c.email}</div>}
                              {!c.phone && !c.email && <span className="italic text-slate-400">Sin contacto</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="success" dot>Activo</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPartnerForContacts(c);
                                setViewContactsModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded transition-colors"
                              title="Directorio de Contactos"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPartnerStatement(c)}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition-colors"
                              title="Ver Estado de Cuenta y Límite"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPartner(c)}
                              className="p-1 text-slate-400 hover:text-etiserv-blue hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                              title="Editar Cliente"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePartner(c)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                              title="Eliminar Cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: SUPPLIERS */}
      {activeTab === "SUPPLIERS" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-etiserv-navyDark text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-5">Razón Social / Proveedor</th>
                  <th className="py-2.5 px-5">RFC / Tax ID</th>
                  <th className="py-2.5 px-5">Días de Crédito Compra</th>
                  <th className="py-2.5 px-5">Contacto Principal</th>
                  <th className="py-2.5 px-5 text-center">Estado</th>
                  <th className="py-2.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(() => {
                  const filteredSuppliers = suppliers.filter((s) => {
                    const q = searchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (s.name || "").toLowerCase().includes(q) ||
                      (s.taxNbr || "").toLowerCase().includes(q) ||
                      (s.contactPerson || "").toLowerCase().includes(q) ||
                      (s.email || "").toLowerCase().includes(q) ||
                      (s.phone || "").toLowerCase().includes(q) ||
                      (s.city || "").toLowerCase().includes(q) ||
                      (s.address || "").toLowerCase().includes(q)
                    );
                  });

                  if (filteredSuppliers.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                          <span>No se encontraron proveedores {searchQuery ? `coincidentes con "${searchQuery}"` : "registrados"}</span>
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="block mx-auto mt-2 text-xs text-etiserv-blue font-semibold hover:underline"
                            >
                              Limpiar búsqueda
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  return filteredSuppliers.map((s, idx) => (
                    <tr key={`${s.id}-${s.taxNbr || idx}`} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-etiserv-blue font-semibold">
                        {s.taxNbr}
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-500">
                        {s.creditDays ? `${s.creditDays} días` : "Contado"}
                      </td>
                      <td className="py-3 px-5 text-slate-500 text-xs">
                        {s.contacts && s.contacts.length > 0 ? (
                          <div>
                            {(() => {
                              const primary = s.contacts.find((ct) => ct.isPrimary) || s.contacts[0];
                              return (
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                    <Users className="w-3 h-3 text-etiserv-blue shrink-0" />
                                    <span>{primary.name}</span>
                                    {primary.jobTitle && (
                                      <span className="text-[10px] text-slate-400 font-normal">({primary.jobTitle})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                                    {primary.phone && <span title={`Teléfono: ${primary.phone}`}>📞 {primary.phone}</span>}
                                    {primary.email && <span className="truncate max-w-[180px]" title={`Correo: ${primary.email}`}>✉️ {primary.email}</span>}
                                  </div>
                                </div>
                              );
                            })()}
                            {s.contacts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPartnerForContacts(s);
                                  setViewContactsModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-etiserv-blue hover:text-etiserv-lightBlue bg-etiserv-blue/10 hover:bg-etiserv-blue/20 px-2 py-0.5 rounded-full transition-colors"
                                title="Ver todos los contactos registrados"
                              >
                                <Users className="w-2.5 h-2.5" />
                                <span>+{s.contacts.length - 1} contacto{s.contacts.length - 1 > 1 ? "s" : ""}</span>
                              </button>
                            )}
                          </div>
                        ) : s.contactPerson ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                              <Users className="w-3 h-3 text-etiserv-blue shrink-0" />
                              <span>{s.contactPerson}</span>
                              {s.contactJobTitle && (
                                <span className="text-[10px] text-slate-400 font-normal">({s.contactJobTitle})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                              {s.phone && <span title={`Teléfono: ${s.phone}`}>📞 {s.phone}</span>}
                              {s.email && <span className="truncate max-w-[200px]" title={`Correo Electrónico: ${s.email}`}>✉️ {s.email}</span>}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {s.phone && <div title={`Teléfono: ${s.phone}`}>📞 {s.phone}</div>}
                            {s.email && <div className="truncate max-w-[200px]" title={`Correo Electrónico: ${s.email}`}>✉️ {s.email}</div>}
                            {!s.phone && !s.email && <span className="italic text-slate-400">Sin contacto</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <Badge variant="success" dot>Activo</Badge>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartnerForContacts(s);
                              setViewContactsModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded transition-colors"
                            title="Directorio de Contactos"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPartnerStatement(s)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition-colors"
                            title="Ver Estado de Cuenta y Límite"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPartner(s)}
                            className="p-1 text-slate-400 hover:text-etiserv-blue hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                            title="Editar Proveedor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePartner(s)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                            title="Eliminar Proveedor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 6: PRICELISTS */}
      {activeTab === "PRICELISTS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              .map((p) => (
                <Card key={p.code} className="p-4 flex flex-col justify-between hover:border-etiserv-blue/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={p.discountPct > 0 ? "success" : "neutral"}>
                        {p.discountPct > 0 ? `-${p.discountPct}% Descuento` : "Precio Base"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPriceList(p)}
                          className="p-1 text-slate-400 hover:text-etiserv-blue rounded transition-colors"
                          title="Editar Tarifa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {p.code !== "PUBLIC" && (
                          <button
                            type="button"
                            onClick={() => handleDeletePriceList(p)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar Tarifa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-1">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {p.description || "Tarifa comercial aplicable a cotizaciones y clientes"}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Código:</span>
                    <span className="font-mono font-bold text-etiserv-blue">{p.code}</span>
                  </div>
                </Card>
              ))}
          </div>

          {priceLists.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-[#0B2B4C] rounded-xl border border-slate-200 dark:border-white/10">
              <Tags className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                No hay listas de precios registradas
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Crea listas de precios con descuentos automáticos para mayoreo, distribuidores o clientes VIP.
              </p>
              <Button
                variant="primary"
                size="sm"
                glow
                onClick={() => handleOpenCreate("PRICELISTS")}
                className="mt-4 gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Tarifa</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: BANKS & CASH REGISTERS */}
      {activeTab === "BANKS" && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-etiserv-blue" /> Cuentas Bancarias de la Empresa (Sin IBAN)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreate("BANKS")}
                className="text-xs gap-1"
              >
                <Plus className="w-3 h-3" /> Agregar Cuenta Bancaria
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankAccounts.map((b) => (
                <Card key={b.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                      {b.bank?.name || b.label || "Cuenta Bancaria"}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="success" dot>Activa</Badge>
                      <button
                        type="button"
                        onClick={() => handleDeleteBankAccount(b)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors ml-1"
                        title="Eliminar Cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    No. Cuenta: <strong className="text-slate-800 dark:text-white">{typeof b.code === 'string' ? b.code : (b.code?.code || b.iban || "0192837465")}</strong>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Tipo de Cuenta:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cheques / Operativa</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" /> Cajas de Cobro & Terminales POS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cashRegisters.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                      {c.name}
                    </span>
                    <Badge variant="primary">{c.code || "POS-01"}</Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Caja asignada a Punto de Venta y arqueos de turno
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: COMPANY & FISCAL SETTINGS (SUB-PESTAÑAS LATAM & DOBLE MONEDA) */}
      {activeTab === "COMPANY" && (() => {
        const currentCountry = companyForm.country || "MX";
        const countryMeta = LATAM_COUNTRIES[currentCountry] || LATAM_COUNTRIES.MX;

        return (
          <div className="space-y-4 max-w-5xl">
            {/* Subtabs Header Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
              {[
                { id: "IDENTIDAD", label: "Identidad Fiscal & Legal", icon: Building2 },
                { id: "DOMICILIO", label: "Domicilio & Contacto", icon: MapPin },
                { id: "FACTURACION", label: "Facturación & CAI", icon: Receipt },
                { id: "DIVISAS", label: "Doble Moneda & Tasa de Cambio", icon: Coins, highlight: true },
                { id: "MEMBRETE", label: "Membrete & Tickets", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = companySubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCompanySubTab(tab.id as CompanySubTab)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white dark:bg-[#0B2B4C] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-etiserv-blue" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                    {tab.highlight && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-etiserv-blue animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveCompanySettings} className="space-y-4">
              {/* SUBTAB 1: IDENTIDAD FISCAL & LEGAL */}
              {companySubTab === "IDENTIDAD" && (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-etiserv-blue" />
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                          Identidad Fiscal & Legal por País
                        </h3>
                        <p className="text-xs text-slate-400">
                          Catálogo tributario oficial adaptado para Latinoamérica y América Central
                        </p>
                      </div>
                    </div>
                    <Badge variant="primary">{countryMeta.flag} {countryMeta.name}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Selector de País */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        País de Operación Tributaria (LATAM)
                      </label>
                      <select
                        value={companyForm.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-etiserv-blue"
                      >
                        {Object.entries(LATAM_COUNTRIES).map(([k, c]) => (
                          <option key={k} value={k}>
                            {c.flag} {c.name} ({c.taxName} {c.defaultTaxRate}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Código Interno / Clave de Empresa"
                      placeholder="DISTR857"
                      value={companyForm.code}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, code: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Razón Social / Nombre Legal Completo"
                      placeholder="Distribuidora Nacional PyME S.A. de C.V."
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Nombre Comercial / Marca de Fantasía"
                      placeholder="Distribuidora PyME"
                      value={companyForm.commercialName || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, commercialName: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={countryMeta.taxIdLabel}
                      placeholder={countryMeta.taxIdPlaceholder}
                      value={companyForm.taxId}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, taxId: e.target.value.toUpperCase() })
                      }
                      required
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Régimen Tributario ({countryMeta.taxAuthority.split(" ")[0]})
                      </label>
                      <select
                        value={companyForm.regimenFiscal}
                        onChange={(e) =>
                          setCompanyForm({ ...companyForm, regimenFiscal: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-etiserv-blue"
                      >
                        {countryMeta.defaultRegimes.map((reg, idx) => (
                          <option key={idx} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Giro Comercial / Actividad Económica Principal (CIIU)"
                      placeholder="Comercio al por mayor de abarrotes y víveres"
                      value={companyForm.giro || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, giro: e.target.value })}
                    />
                    <Input
                      label="No. de Registro Patronal / Seguro Social"
                      placeholder="IMSS / IGSS / ISSS / CCSS / CSS"
                      value={companyForm.patronalNumber || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, patronalNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                    <Input
                      label="Representante Legal / Apoderado"
                      placeholder="Lic. Fernando Garza Salinas"
                      value={companyForm.repName || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, repName: e.target.value })}
                    />
                    <Input
                      label="Documento de Identidad del Representante (DPI / DNI / Cédula)"
                      placeholder="Documento oficial del representante"
                      value={companyForm.repDoc || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, repDoc: e.target.value })}
                    />
                  </div>
                </Card>
              )}

              {/* SUBTAB 2: DOMICILIO & CONTACTO */}
              {companySubTab === "DOMICILIO" && (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                        Domicilio Fiscal & Canales de Contacto
                      </h3>
                      <p className="text-xs text-slate-400">
                        Ubicación legal y líneas de atención comercial para clientes y proveedores
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Calle, Número Exterior / Interior y Edificio"
                      placeholder="Av. Chapultepec 480, Piso 3"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      required
                    />
                    <Input
                      label={countryMeta.neighborhoodLabel}
                      placeholder="Col. Americana / Zona 10 / San Benito"
                      value={companyForm.neighborhood || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, neighborhood: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label={countryMeta.cityLabel}
                      placeholder="Ciudad / Municipio"
                      value={companyForm.city}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                      required
                    />
                    <Input
                      label={countryMeta.stateLabel}
                      placeholder="Departamento / Estado / Provincia"
                      value={companyForm.state}
                      onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                      required
                    />
                    <Input
                      label="Código Postal / Apartado Postal"
                      placeholder="44100"
                      value={companyForm.postalCode}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, postalCode: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                    <Input
                      label="Teléfono PBX / Fijo"
                      placeholder="33 3615 4800"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    />
                    <Input
                      label="WhatsApp Comercial"
                      placeholder="+52 33 1289 9000"
                      value={companyForm.whatsapp || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, whatsapp: e.target.value })}
                    />
                    <Input
                      label="Correo Electrónico para Facturación"
                      type="email"
                      placeholder="facturacion@empresa.com"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <Input
                    label="Sitio Web Oficial / Tienda en Línea"
                    placeholder="https://www.miempresa.com"
                    value={companyForm.website || ""}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  />
                </Card>
              )}

              {/* SUBTAB 3: FACTURACION & CAI */}
              {companySubTab === "FACTURACION" && (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-etiserv-blue" />
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                          Facturación Electrónica, CAI & Resoluciones Fiscales
                        </h3>
                        <p className="text-xs text-slate-400">
                          Parámetros de autorización y numeración fiscal oficial ({countryMeta.taxAuthority})
                        </p>
                      </div>
                    </div>
                    <Badge variant="neutral">{countryMeta.taxAuthority}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="No. de Resolución Fiscal / CAI / DTE"
                      placeholder="SAT-DTE-2026-098231 / SAR-CAI-1234"
                      value={companyForm.resolutionNumber || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, resolutionNumber: e.target.value })
                      }
                    />
                    <Input
                      label="Serie o Prefijo Autorizado por Defecto"
                      placeholder="FAC-A / POS-01 / SERIE-1"
                      value={companyForm.resolutionPrefix || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, resolutionPrefix: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Rango Autorizado: Desde"
                      placeholder="001-001-01-00000001"
                      value={companyForm.resolutionRangeFrom || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, resolutionRangeFrom: e.target.value })
                      }
                    />
                    <Input
                      label="Rango Autorizado: Hasta"
                      placeholder="001-001-01-00100000"
                      value={companyForm.resolutionRangeTo || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, resolutionRangeTo: e.target.value })
                      }
                    />
                    <Input
                      label="Fecha Límite de Emisión (Vencimiento)"
                      type="date"
                      value={companyForm.resolutionExpiry || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, resolutionExpiry: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tasa de Impuesto Principal Predeterminada (% {countryMeta.taxName})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={companyForm.defaultTaxRate ?? countryMeta.defaultTaxRate}
                          onChange={(e) =>
                            setCompanyForm({
                              ...companyForm,
                              defaultTaxRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-etiserv-blue pr-8"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* SUBTAB 4: DIVISAS & TASA DE CAMBIO (DOBLE MONEDA) */}
              {companySubTab === "DIVISAS" && (
                <div className="space-y-4">
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <div>
                          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                            Configuración Bimoneda & Tasa de Cambio Operativa
                          </h3>
                          <p className="text-xs text-slate-400">
                            Gestión de divisa principal, moneda secundaria (USD) y factor de conversión en vivo
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Bimoneda Activa</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Moneda Primaria Oficial del Tenant
                        </label>
                        <select
                          value={selectedCurrency}
                          onChange={(e) => setSelectedCurrency(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-etiserv-blue"
                        >
                          {Object.entries(CURRENCY_CONFIGS).map(([code, conf]) => (
                            <option key={code} value={code}>
                              {conf.flag} {code} - {conf.name} ({conf.symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Moneda Secundaria / Alternativa de Cobro
                        </label>
                        <select
                          value={companyForm.secondaryCurrency || "USD"}
                          onChange={(e) =>
                            setCompanyForm({ ...companyForm, secondaryCurrency: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-etiserv-blue"
                        >
                          <option value="USD">🇺🇸 USD - Dólar Estadounidense ($)</option>
                          <option value="EUR">🇪🇺 EUR - Euro (€)</option>
                          <option value="MXN">🇲🇽 MXN - Peso Mexicano ($)</option>
                          <option value="GTQ">🇬🇹 GTQ - Quetzal (Q)</option>
                          <option value="HNL">🇭🇳 HNL - Lempira (L)</option>
                          <option value="CRC">🇨🇷 CRC - Colón Costarricense (₡)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1.5">
                          Tasa de Cambio Oficial (1 {companyForm.secondaryCurrency || "USD"} = ? {selectedCurrency})
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            value={companyForm.exchangeRate ?? 18.25}
                            onChange={(e) =>
                              setCompanyForm({
                                ...companyForm,
                                exchangeRate: parseFloat(e.target.value) || 1,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-etiserv-blue"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Factor multiplicador aplicado a pagos en moneda extranjera y conversiones POS.
                        </span>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={companyForm.enableDualCurrency !== false}
                            onChange={(e) =>
                              setCompanyForm({
                                ...companyForm,
                                enableDualCurrency: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-etiserv-blue focus:ring-etiserv-blue"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-white">
                            Habilitar cobro y visualización en doble moneda en tickets y POS
                          </span>
                        </label>
                        <span className="text-[10px] text-slate-400 ml-6 mt-0.5">
                          Muestra el total en {selectedCurrency} y su equivalente en {companyForm.secondaryCurrency || "USD"}.
                        </span>
                      </div>
                    </div>

                    {/* Live Currency Calculator Simulator */}
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <h4 className="font-heading font-bold text-xs text-amber-900 dark:text-amber-200">
                          Simulador de Conversión de Moneda en Tiempo Real
                        </h4>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Si pagas:</span>
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              value={calcUsdAmount}
                              onChange={(e) => setCalcUsdAmount(e.target.value)}
                              className="w-full pl-6 pr-2 py-1 bg-white dark:bg-[#071C33] rounded-lg border border-slate-200 dark:border-white/10 text-xs font-mono font-bold"
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{companyForm.secondaryCurrency || "USD"}</span>
                        </div>
                        <ArrowLeftRight className="w-4 h-4 text-slate-400 hidden sm:block" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Equivale a:</span>
                          <span className="text-sm font-heading font-bold text-slate-900 dark:text-white font-mono bg-white dark:bg-[#071C33] px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                            {currencySymbol}
                            {(Number(calcUsdAmount || 0) * (companyForm.exchangeRate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                            <strong className="text-xs text-etiserv-blue">{selectedCurrency}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* SUBTAB 5: MEMBRETE & TICKETS */}
              {companySubTab === "MEMBRETE" && (
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                        Identidad Visual, Membrete & Tickets Térmicos
                      </h3>
                      <p className="text-xs text-slate-400">
                        Personalización de encabezado, logotipo y pie de página en comprobantes de venta
                      </p>
                    </div>
                  </div>

                  <div>
                    <Input
                      label="URL del Logotipo (PNG / JPG con fondo transparente)"
                      placeholder="https://empresa.com/logo.png"
                      value={companyForm.logoUrl || ""}
                      onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
                    />
                    {companyForm.logoUrl && (
                      <div className="mt-2.5 flex items-center gap-3 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 w-fit">
                        <img
                          src={companyForm.logoUrl}
                          alt="Logo preview"
                          className="h-10 max-w-[140px] object-contain rounded"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                        <span className="text-xs font-semibold text-slate-500">Logotipo cargado</span>
                      </div>
                    )}
                  </div>

                  <Input
                    label="Mensaje Comercial de Cabecera / Slogan en Tickets"
                    placeholder="¡BIENVENIDO A DISTRIBUIDORA PYME!"
                    value={companyForm.ticketHeader || ""}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, ticketHeader: e.target.value })
                    }
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pie de Página / Leyenda Legal y Términos de Garantía en Tickets y Facturas
                    </label>
                    <textarea
                      rows={3}
                      value={companyForm.ticketFooter || ""}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, ticketFooter: e.target.value })
                      }
                      placeholder="¡Gracias por su preferencia! Documento emitido con validez fiscal..."
                      className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white p-3 text-xs focus:ring-1 focus:ring-etiserv-blue"
                    />
                  </div>
                </Card>
              )}

              {/* Botón de Guardado Global */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-400">
                  {companySavedToast
                    ? "✅ Configuración tributaria, divisas y datos fiscales guardados con éxito."
                    : "Los cambios se aplicarán inmediatamente a tickets de venta, cotizaciones y reportes."}
                </span>
                <Button
                  variant="primary"
                  glow
                  size="lg"
                  type="submit"
                  loading={savingCompany}
                  className="px-8 text-xs font-bold gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Guardar Configuración de Empresa</span>
                </Button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* MODALS */}
      {/* 1. Modal Producto */}
      <Modal
        isOpen={modalType === "PRODUCTS"}
        onClose={() => {
          setModalType(null);
          setEditingId(null);
        }}
        title={editingId ? "Editar Producto / Servicio" : "Dar de Alta Nuevo Producto / Servicio"}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre del Producto"
              placeholder="Ej: Agua Mineral Gasificada 600ml"
              value={prodForm.name}
              onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
              required
            />
            <Input
              label="Código / SKU"
              placeholder="SKU-1001 o Código interno"
              value={prodForm.code}
              onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })}
              required
            />
          </div>

          {/* Categorías y Subcategorías */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Familia / Categoría Principal"
              value={prodForm.categoryId}
              onChange={(e) => setProdForm({ ...prodForm, categoryId: Number(e.target.value) })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>

            <Input
              label="Subfamilia / Subcategoría"
              placeholder="ej. Aguas Minerales, Refrescos, Snacks..."
              value={prodForm.subCategory}
              onChange={(e) => setProdForm({ ...prodForm, subCategory: e.target.value })}
            />

            <Select
              label="Unidad de Medida (UoM)"
              value={prodForm.uomCode}
              onChange={(e) => setProdForm({ ...prodForm, uomCode: e.target.value })}
            >
              {uoms.map((u) => (
                <option key={u.code} value={u.code}>
                  {u.code} - {u.name} ({u.symbol})
                </option>
              ))}
            </Select>
          </div>

          {/* Precios, Tipo de Costo y Valuación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <div>
              <Select
                label="Tipo de Costo / Valuación"
                value={prodForm.costType}
                onChange={(e) => setProdForm({ ...prodForm, costType: e.target.value })}
              >
                <option value="WEIGHTED_AVERAGE">Costo Promedio Ponderado (CPP)</option>
                <option value="LAST_PURCHASE">Último Costo de Compra</option>
                <option value="STANDARD">Costo Estándar Fijo</option>
                <option value="FIFO">PEPS (Primeras Entradas)</option>
              </Select>
            </div>

            <Input
              label="Costo Promedio / Unitario ($)"
              type="number"
              step="0.01"
              value={prodForm.purchasePrice}
              onChange={(e) => setProdForm({ ...prodForm, purchasePrice: Number(e.target.value) })}
            />

            <div>
              <Input
                label="Precio de Venta ($)"
                type="number"
                step="0.01"
                value={prodForm.salePrice}
                onChange={(e) => setProdForm({ ...prodForm, salePrice: Number(e.target.value) })}
                required
              />
              {prodForm.salePrice > 0 && prodForm.purchasePrice > 0 && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-1 font-mono">
                  Margen: {(((prodForm.salePrice - prodForm.purchasePrice) / prodForm.salePrice) * 100).toFixed(1)}% (${(prodForm.salePrice - prodForm.purchasePrice).toFixed(2)})
                </span>
              )}
            </div>
          </div>

          {/* Código de Barras y URL de Imagen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Código de Barras (EAN / UPC)"
              placeholder="7501055169031"
              value={prodForm.barCode}
              onChange={(e) => setProdForm({ ...prodForm, barCode: e.target.value })}
            />

            <div>
              <Input
                label="URL de Imagen del Producto"
                placeholder="https://images.unsplash.com/..."
                value={prodForm.imageUrl}
                onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
              />
              {prodForm.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={prodForm.imageUrl}
                    alt="Vista previa"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                  <span className="text-[10px] text-slate-400">Vista previa de imagen</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              Valuación activa por <strong>{prodForm.costType === "WEIGHTED_AVERAGE" ? "Costo Promedio Ponderado (CPP)" : prodForm.costType}</strong>. Sincronizado en Axelor Open Suite.
            </span>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setModalType(null);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              {editingId ? "Actualizar Producto" : "Guardar Producto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Familia */}
      <Modal
        isOpen={modalType === "CATEGORIES"}
        onClose={() => {
          setModalType(null);
          setEditingId(null);
        }}
        title={editingId ? "Editar Familia / Categoría" : "Crear Nueva Familia / Categoría"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Nombre de la Familia"
            placeholder="Ej: Materiales Eléctricos"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
          <Input
            label="Código de Categoría (Opcional)"
            placeholder="ELEC"
            value={catForm.code}
            onChange={(e) => setCatForm({ ...catForm, code: e.target.value })}
          />
          <Input
            label="Descripción Comercial"
            placeholder="Cables, interruptores, cajas y canaletas"
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
          />
          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setModalType(null);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              {editingId ? "Actualizar Familia" : "Guardar Familia"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal Unidad de Medida */}
      <Modal
        isOpen={modalType === "UOM"}
        onClose={() => {
          setModalType(null);
          setEditingId(null);
        }}
        title={editingId ? "Editar Unidad de Medida" : "Registrar Nueva Unidad de Medida"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUoM} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Clave ISO / SAT"
              placeholder="XBX"
              value={uomForm.code}
              onChange={(e) => setUomForm({ ...uomForm, code: e.target.value.toUpperCase() })}
              disabled={!!editingId}
              required
            />
            <Input
              label="Símbolo"
              placeholder="cj"
              value={uomForm.symbol}
              onChange={(e) => setUomForm({ ...uomForm, symbol: e.target.value })}
              required
            />
          </div>
          <Input
            label="Nombre de la Unidad"
            placeholder="Caja de 24 Unidades"
            value={uomForm.name}
            onChange={(e) => setUomForm({ ...uomForm, name: e.target.value })}
            required
          />
          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setModalType(null);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              {editingId ? "Actualizar Unidad" : "Guardar Unidad"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal Cliente */}
      <Modal
        isOpen={modalType === "CUSTOMERS"}
        onClose={() => {
          setModalType(null);
          setEditingId(null);
        }}
        title={editingId ? "Editar Cliente (B2B / B2C)" : "Dar de Alta Nuevo Cliente (B2B / B2C)"}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          {/* Tipo de Cliente & Datos Fiscales */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Tipo de Cliente / Segmento Fiscal *
              </label>
              <select
                value={partnerForm.partnerType || "MORAL"}
                onChange={(e) => {
                  const type = e.target.value as any;
                  let reg = partnerForm.fiscalRegime;
                  let cfdi = partnerForm.cfdiUsage;
                  let rfc = partnerForm.taxNbr;
                  let pl = partnerForm.priceListCode;

                  if (type === "MORAL") {
                    reg = "601 - General de Ley Personas Morales";
                    cfdi = "G03 - Gastos en general";
                  } else if (type === "FISICA") {
                    reg = "612 - Personas Físicas con Actividades Empresariales y Profesionales";
                    cfdi = "G03 - Gastos en general";
                  } else if (type === "FINAL_CONSUMER") {
                    rfc = rfc || "XAXX010101000";
                    reg = "616 - Sin obligaciones fiscales";
                    cfdi = "S01 - Sin efectos fiscales";
                  } else if (type === "DISTRIBUTOR") {
                    pl = "DISTRIBUTOR";
                    reg = "601 - General de Ley Personas Morales";
                  } else if (type === "GOVERNMENT") {
                    reg = "603 - Personas Morales con Fines no Lucrativos";
                    cfdi = "G03 - Gastos en general";
                  }

                  setPartnerForm((prev) => ({
                    ...prev,
                    partnerType: type,
                    fiscalRegime: reg,
                    cfdiUsage: cfdi,
                    taxNbr: rfc,
                    priceListCode: pl,
                  }));
                }}
                className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
              >
                <option value="MORAL">🏢 Empresa / Persona Moral (B2B)</option>
                <option value="FISICA">👤 Persona Física con Act. Empresarial (B2B)</option>
                <option value="FINAL_CONSUMER">🛒 Público en General / Mostrador (B2C)</option>
                <option value="DISTRIBUTOR">🏷️ Distribuidor Mayorista</option>
                <option value="GOVERNMENT">🏛️ Gobierno / Entidad Pública</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Razón Social / Nombre Completo *"
                placeholder="ej. Constructora del Norte S.A. de C.V."
                value={partnerForm.name}
                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                required
              />
              <Input
                label="RFC / Tax ID *"
                placeholder="ej. CNO980421XX3"
                value={partnerForm.taxNbr}
                onChange={(e) => setPartnerForm({ ...partnerForm, taxNbr: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Régimen Fiscal (SAT / Hacienda)
                </label>
                <select
                  value={partnerForm.fiscalRegime}
                  onChange={(e) => setPartnerForm({ ...partnerForm, fiscalRegime: e.target.value })}
                  className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                >
                  <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                  <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales</option>
                  <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - Régimen Simplificado de Confianza (RESICO)</option>
                  <option value="603 - Personas Morales con Fines no Lucrativos">603 - Fines no Lucrativos / Institucional</option>
                  <option value="616 - Sin obligaciones fiscales">616 - Sin obligaciones fiscales (Público General)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Uso de CFDI / Facturación
                </label>
                <select
                  value={partnerForm.cfdiUsage}
                  onChange={(e) => setPartnerForm({ ...partnerForm, cfdiUsage: e.target.value })}
                  className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                >
                  <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                  <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                  <option value="P01 - Por definir">P01 - Por definir</option>
                  <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
                  <option value="I01 - Construcciones">I01 - Construcciones</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <div>
              <Select
                label="Lista de Precios Asignada"
                value={partnerForm.priceListCode || "PUBLIC"}
                onChange={(e) => setPartnerForm({ ...partnerForm, priceListCode: e.target.value })}
              >
                {(priceLists.length > 0
                  ? priceLists
                  : [
                      { code: "PUBLIC", name: "Lista General (Precio Público)", discountPct: 0 },
                      { code: "WHOLESALE", name: "Lista Mayoreo (10% Descuento)", discountPct: 10 },
                      { code: "DISTRIBUTOR", name: "Lista Distribuidor (20% Descuento)", discountPct: 20 },
                    ]
                ).map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.discountPct > 0 ? `-${p.discountPct}%` : "Base"})
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Límite de Crédito ($)"
              type="number"
              value={partnerForm.creditLimit}
              onChange={(e) => setPartnerForm({ ...partnerForm, creditLimit: Number(e.target.value) })}
            />
            <Input
              label="Días de Crédito"
              type="number"
              placeholder="0 para contado"
              value={partnerForm.creditDays}
              onChange={(e) => setPartnerForm({ ...partnerForm, creditDays: Number(e.target.value) })}
            />
          </div>

          {/* Directorio de Múltiples Contactos */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <Users className="w-3.5 h-3.5 text-etiserv-blue" />
                <span>Directorio de Contactos de la Empresa ({partnerForm.contacts.length})</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContactToForm}
                className="gap-1 text-[11px] h-7 px-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-etiserv-blue" />
                <span>Agregar Contacto</span>
              </Button>
            </div>

            {partnerForm.contacts.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-white/10 rounded-lg">
                <span>No hay contactos registrados. Haz clic en "Agregar Contacto".</span>
              </div>
            ) : (
              <div className="space-y-3">
                {partnerForm.contacts.map((contact, cIdx) => (
                  <div
                    key={contact.id || cIdx}
                    className={clsx(
                      "p-3 rounded-lg border text-xs space-y-2.5 transition-all",
                      contact.isPrimary
                        ? "bg-etiserv-blue/[0.03] border-etiserv-blue/40 dark:border-etiserv-blue/30"
                        : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryContactInForm(cIdx)}
                          className={clsx(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                            contact.isPrimary
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-white/10 text-slate-500 hover:bg-slate-200"
                          )}
                          title={contact.isPrimary ? "Contacto Principal" : "Establecer como Contacto Principal"}
                        >
                          <Star className={clsx("w-3 h-3", contact.isPrimary ? "fill-white" : "")} />
                          <span>{contact.isPrimary ? "Principal" : "Hacer Principal"}</span>
                        </button>

                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          Contacto #{cIdx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={contact.department || "General"}
                          onChange={(e) => handleUpdateContactField(cIdx, "department", e.target.value)}
                          className="bg-slate-100 dark:bg-white/10 border-0 rounded px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <option value="Compras">Compras</option>
                          <option value="Facturación">Facturación / CxC</option>
                          <option value="Pagos / Tesorería">Pagos / Tesorería</option>
                          <option value="Logística / Almacén">Logística / Almacén</option>
                          <option value="Dirección">Dirección / Gerencia</option>
                          <option value="General">General / Atención</option>
                        </select>

                        {partnerForm.contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContactFromForm(cIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar este contacto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Nombre del Contacto *
                        </label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => handleUpdateContactField(cIdx, "name", e.target.value)}
                          placeholder="ej. Lic. Roberto Garza"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Cargo / Puesto
                        </label>
                        <input
                          type="text"
                          value={contact.jobTitle || ""}
                          onChange={(e) => handleUpdateContactField(cIdx, "jobTitle", e.target.value)}
                          placeholder="ej. Gerente de Compras"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Teléfono Directo / Celular
                        </label>
                        <input
                          type="text"
                          value={contact.phone || ""}
                          onChange={(e) => handleUpdateContactField(cIdx, "phone", e.target.value)}
                          placeholder="ej. 55 1234 5678"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          value={contact.email || ""}
                          onChange={(e) => handleUpdateContactField(cIdx, "email", e.target.value)}
                          placeholder="ej. contacto@empresa.com"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Domicilio Fiscal / Comercial */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <Input
                    label="Domicilio / Dirección Comercial"
                    placeholder="ej. Av. López Mateos 1200, Col. Chapalita"
                    value={partnerForm.address}
                    onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="Ciudad / Municipio"
                    placeholder="ej. Guadalajara, Jal."
                    value={partnerForm.city}
                    onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setModalType(null);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              {editingId ? "Actualizar Cliente" : "Guardar Cliente"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal Proveedor */}
      <Modal
        isOpen={modalType === "SUPPLIERS"}
        onClose={() => {
          setModalType(null);
          setEditingId(null);
        }}
        title={editingId ? "Editar Proveedor" : "Dar de Alta Nuevo Proveedor"}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Razón Social del Proveedor *"
              placeholder="ej. Acero y Perfiles Nacionales S.A."
              value={partnerForm.name}
              onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
              required
            />
            <Input
              label="RFC / Tax ID *"
              placeholder="ej. APN920101XX1"
              value={partnerForm.taxNbr}
              onChange={(e) => setPartnerForm({ ...partnerForm, taxNbr: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            <Input
              label="Días de Crédito de Compra"
              type="number"
              placeholder="30 días"
              value={partnerForm.creditDays}
              onChange={(e) => setPartnerForm({ ...partnerForm, creditDays: Number(e.target.value) })}
            />
            <Input
              label="Límite de Crédito Otorgado ($)"
              type="number"
              value={partnerForm.creditLimit}
              onChange={(e) => setPartnerForm({ ...partnerForm, creditLimit: Number(e.target.value) })}
            />
          </div>

          {/* Directorio de Múltiples Contactos del Proveedor */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <Users className="w-3.5 h-3.5 text-etiserv-blue" />
                <span>Directorio de Contactos del Proveedor ({partnerForm.contacts.length})</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContactToForm}
                className="gap-1 text-[11px] h-7 px-2"
              >
                <PlusCircle className="w-3.5 h-3.5 text-etiserv-blue" />
                <span>Agregar Contacto</span>
              </Button>
            </div>

            {partnerForm.contacts.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-white/10 rounded-lg">
                <span>No hay contactos registrados. Haz clic en "Agregar Contacto".</span>
              </div>
            ) : (
              <div className="space-y-3">
                {partnerForm.contacts.map((contact, cIdx) => (
                  <div
                    key={contact.id || cIdx}
                    className={clsx(
                      "p-3 rounded-lg border text-xs space-y-2.5 transition-all",
                      contact.isPrimary
                        ? "bg-etiserv-blue/[0.03] border-etiserv-blue/40 dark:border-etiserv-blue/30"
                        : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryContactInForm(cIdx)}
                          className={clsx(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                            contact.isPrimary
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-white/10 text-slate-500 hover:bg-slate-200"
                          )}
                          title={contact.isPrimary ? "Contacto Principal" : "Establecer como Contacto Principal"}
                        >
                          <Star className={clsx("w-3 h-3", contact.isPrimary ? "fill-white" : "")} />
                          <span>{contact.isPrimary ? "Principal" : "Hacer Principal"}</span>
                        </button>

                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          Contacto #{cIdx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={contact.department || "Ventas"}
                          onChange={(e) => handleUpdateContactField(cIdx, "department", e.target.value)}
                          className="bg-slate-100 dark:bg-white/10 border-0 rounded px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <option value="Ventas">Ventas / Abastecimiento</option>
                          <option value="Facturación">Facturación / Cobranza</option>
                          <option value="Logística / Embarques">Logística / Embarques</option>
                          <option value="Soporte Técnico">Soporte / Calidad</option>
                          <option value="Dirección">Dirección / Gerencia</option>
                          <option value="General">General</option>
                        </select>

                        {partnerForm.contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContactFromForm(cIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar este contacto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Nombre del Contacto *
                        </label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => handleUpdateContactField(cIdx, "name", e.target.value)}
                          placeholder="ej. Lic. Roberto Garza"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Cargo / Puesto
                        </label>
                        <input
                          type="text"
                          value={contact.jobTitle || ""}
                          onChange={(e) => handleUpdateContactField(cIdx, "jobTitle", e.target.value)}
                          placeholder="ej. Ejecutivo de Cuentas Clave"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Teléfono Directo / Celular
                        </label>
                        <input
                          type="text"
                          value={contact.phone || ""}
                          onChange={(e) => handleUpdateContactField(cIdx, "phone", e.target.value)}
                          placeholder="ej. 55 8765 4321"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          value={contact.email || ""}
                          onChange={(e) => handleUpdateContactField(cIdx, "email", e.target.value)}
                          placeholder="ej. ventas@proveedor.com"
                          className="w-full bg-white dark:bg-[#071C33] border border-slate-200 dark:border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-etiserv-blue"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Domicilio / Planta del Proveedor */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <Input
                    label="Domicilio / Planta / Bodega del Proveedor"
                    placeholder="ej. Calz. Vallejo 1020, Parque Industrial, CDMX"
                    value={partnerForm.address}
                    onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    label="Ciudad / Municipio"
                    placeholder="ej. CDMX"
                    value={partnerForm.city}
                    onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setModalType(null);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              {editingId ? "Actualizar Proveedor" : "Guardar Proveedor"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal Lista de Precios */}
      <Modal
        isOpen={modalType === "PRICELISTS"}
        onClose={() => {
          setModalType(null);
          setEditingId(null);
        }}
        title={editingId ? "Editar Tarifa / Lista de Precios" : "Crear Nueva Lista de Precios"}
        maxWidth="md"
      >
        <form onSubmit={handleSavePriceList} className="space-y-4">
          <Input
            label="Nombre de la Lista"
            placeholder="Ej: Distribuidor Platino"
            value={priceListForm.name}
            onChange={(e) => setPriceListForm({ ...priceListForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código de Tarifa"
              placeholder="PLATINUM"
              value={priceListForm.code}
              onChange={(e) => setPriceListForm({ ...priceListForm, code: e.target.value.toUpperCase() })}
              disabled={!!editingId}
              required
            />
            <Input
              label="% Descuento sobre Precio Base"
              type="number"
              placeholder="25"
              value={priceListForm.discountPct}
              onChange={(e) => setPriceListForm({ ...priceListForm, discountPct: Number(e.target.value) })}
              required
            />
          </div>
          <Input
            label="Descripción"
            placeholder="Para compras mayores a 100 toneladas mensuales"
            value={priceListForm.description}
            onChange={(e) => setPriceListForm({ ...priceListForm, description: e.target.value })}
          />
          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              variant="outline"
              className="flex-1"
              type="button"
              onClick={() => {
                setModalType(null);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              {editingId ? "Actualizar Lista" : "Guardar Lista"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Modal Nueva Cuenta Bancaria (Sin IBAN) */}
      <Modal
        isOpen={modalType === "BANKS"}
        onClose={() => setModalType(null)}
        title="Registrar Cuenta Bancaria de la Empresa"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBankAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Institución Bancaria
            </label>
            <input
              list="bankList"
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              placeholder="Escribe o selecciona tu banco..."
              className="w-full rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#071C33] text-slate-900 dark:text-white px-3 py-2 text-xs font-semibold"
              required
            />
            <datalist id="bankList">
              {POPULAR_BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <Input
            label="Número de Cuenta / CLABE"
            placeholder="0123456789 o 012180001234567890"
            value={bankForm.accountNumber}
            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
            required
          />

          <p className="text-[11px] text-slate-400">
            🔒 <strong>Sin IBAN requerido</strong>: La cuenta queda habilitada de inmediato para transferencias, cobros y arqueos.
          </p>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setModalType(null)}>
              Cancelar
            </Button>
            <Button variant="primary" glow className="flex-1" type="submit">
              Guardar Cuenta Bancaria
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Modal Detalle de Familia / Productos & Inventario */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        title={`Familia: ${selectedCategory?.name || "Detalle de Familia"}`}
        maxWidth="lg"
      >
        {selectedCategory && (() => {
          const catProducts = products.filter(
            (p) =>
              p.categoryId === selectedCategory.id ||
              (p.categoryName && (p.categoryName || "").toLowerCase() === (selectedCategory.name || "").toLowerCase())
          );
          const totalStock = catProducts.reduce(
            (sum, p) => sum + (stockLevels[p.id] !== undefined ? stockLevels[p.id] : 0),
            0
          );
          const totalInventoryValue = catProducts.reduce((sum, p) => {
            const stock = stockLevels[p.id] !== undefined ? stockLevels[p.id] : 0;
            const cost = p.purchasePrice || p.costPrice || p.salePrice * 0.6 || 0;
            return sum + stock * cost;
          }, 0);

          return (
            <div className="space-y-4">
              {/* KPI Summary Banner */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-etiserv-navyDark/60 border border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Total Productos
                  </span>
                  <span className="text-base font-heading font-bold text-slate-900 dark:text-white">
                    {catProducts.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Stock en Existencia
                  </span>
                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                    {totalStock.toLocaleString()} uds
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Valor del Inventario
                  </span>
                  <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{totalInventoryValue.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-white/10 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#071C33] text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">UoM</th>
                      <th className="py-2.5 px-3 text-right">Existencia</th>
                      <th className="py-2.5 px-3 text-right">Costo Est.</th>
                      <th className="py-2.5 px-3 text-right">Precio Venta</th>
                      <th className="py-2.5 px-3 text-right">Valor Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {catProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                          No hay productos registrados en esta familia.
                        </td>
                      </tr>
                    ) : (
                      catProducts.map((p) => {
                        const stock = stockLevels[p.id] !== undefined ? stockLevels[p.id] : 0;
                        const cost = p.purchasePrice || p.costPrice || p.salePrice * 0.6 || 0;
                        const itemVal = stock * cost;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-etiserv-blue">
                              {p.code}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {p.name}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                              {p.uomCode || "PZA"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                              <span className={stock > 0 ? "text-slate-900 dark:text-white" : "text-amber-500 font-semibold"}>
                                {stock.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                              {currencySymbol}{cost.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {currencySymbol}{p.salePrice.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {currencySymbol}{itemVal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 9. Modal Estado de Cuenta del Socio */}
      <Modal
        isOpen={statementModalOpen}
        onClose={() => {
          setStatementModalOpen(false);
          setStatementPartner(null);
          setStatementData(null);
        }}
        title={`Estado de Cuenta: ${statementPartner?.name || ""}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {loadingStatement && (
            <div className="py-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-etiserv-blue" />
              <span>Cargando movimientos contables y límite crediticio...</span>
            </div>
          )}

          {!loadingStatement && statementData && (
            <div className="space-y-4">
              {/* Top Credit KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-etiserv-navyDark border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Límite de Crédito</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ${statementData.creditLimit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {statementData.creditDays > 0 ? `${statementData.creditDays} días plazo` : "Contado"}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-etiserv-navyDark border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Deudor Actual</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    ${statementData.currentBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {statementData.creditUsagePct}% utilizado
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-etiserv-navyDark border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Crédito Disponible</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ${statementData.availableCredit.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Disponible</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-etiserv-navyDark border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Crediticio</span>
                  <Badge
                    variant={
                      statementData.riskStatus === "NORMAL"
                        ? "success"
                        : statementData.riskStatus === "WARNING"
                        ? "warning"
                        : "danger"
                    }
                    className="text-[10px] mt-1"
                  >
                    {statementData.riskStatus === "NORMAL"
                      ? "Crédito Ok"
                      : statementData.riskStatus === "WARNING"
                      ? "Límite Alto"
                      : "⛔ Excedido"}
                  </Badge>
                </div>
              </div>

              {/* HISTORIAL DE DOCUMENTOS & DIAGNÓSTICO (TOGGLE MENSUAL / DIARIO) */}
              {statementData.creditHealth && (
                <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-etiserv-blue/10 text-etiserv-blue dark:bg-etiserv-blue/20">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                            {statementData.isSupplier
                              ? chartTimeframe === "MONTHLY"
                                ? "Historial de Compras Semestral (6 Meses)"
                                : "Evolución Diaria de Compras (Últimos 30 Días)"
                              : chartTimeframe === "MONTHLY"
                                ? "Historial de Facturación Semestral (6 Meses)"
                                : "Evolución Diaria de Ventas (Últimos 30 Días)"}
                          </span>
                          <Badge
                            variant={
                              statementData.creditHealth.trend === "GROWING"
                                ? "success"
                                : statementData.creditHealth.trend === "COOLING_DOWN"
                                ? "warning"
                                : statementData.creditHealth.trend === "INACTIVE"
                                ? "danger"
                                : "primary"
                            }
                            className="text-[9px] py-0.5"
                          >
                            {statementData.creditHealth.trend === "GROWING" && (statementData.isSupplier ? "🚀 Compras al Alza (+)" : "🚀 Creciendo (+)")}
                            {statementData.creditHealth.trend === "COOLING_DOWN" && (statementData.isSupplier ? "📉 Desacelerando Compras (-)" : "📉 Desacelerando / Aflojando (-)")}
                            {statementData.creditHealth.trend === "INACTIVE" && "⛔ Inactivo"}
                            {statementData.creditHealth.trend === "STABLE" && "⚖️ Estable"}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {chartTimeframe === "MONTHLY" ? (
                            <>
                              {statementData.isSupplier ? "Compra promedio:" : "Venta promedio:"}{" "}
                              <strong className="font-mono text-slate-900 dark:text-white">
                                ${statementData.creditHealth.avgMonthlySales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}/mes
                              </strong>{" "}
                              • Cobertura Límite: <strong className="font-mono">{statementData.creditHealth.creditCoverageRatio}x</strong>
                            </>
                          ) : (
                            <>
                              Frecuencia de pedidos: <strong className="font-mono text-slate-900 dark:text-white">Cada {statementData.creditHealth.avgOrderFrequencyDays} días</strong> • Ticket Promedio: <strong className="font-mono text-slate-900 dark:text-white">${statementData.creditHealth.avgTicket.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</strong>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* TIMEFRAME TOGGLE BUTTONS */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 dark:bg-white/10 rounded-lg shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setChartTimeframe("MONTHLY")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          chartTimeframe === "MONTHLY"
                            ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        📆 6 Meses
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartTimeframe("DAILY")}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          chartTimeframe === "DAILY"
                            ? "bg-white dark:bg-[#071C33] text-etiserv-blue shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        📅 30 Días (Día a Día)
                      </button>
                    </div>
                  </div>

                  {/* VISTA 1: MENSUAL (6 MESES) */}
                  {chartTimeframe === "MONTHLY" && (() => {
                    const maxVal = Math.max(
                      ...statementData.creditHealth!.salesHistory.map((s) => s.totalSales),
                      statementData.creditLimit || 1,
                      1000
                    );

                    return (
                      <div className="space-y-1.5 pt-1">
                        <div className="grid grid-cols-6 gap-2 items-end h-24 pt-4 px-2 bg-white dark:bg-[#071C33] rounded-lg border border-slate-100 dark:border-white/5 relative">
                          {statementData.creditLimit > 0 && statementData.creditLimit <= maxVal * 1.2 && (
                            <div
                              className="absolute left-2 right-2 border-b border-dashed border-rose-400/50 z-0 flex justify-end"
                              style={{ bottom: `${Math.min(95, (statementData.creditLimit / maxVal) * 80)}%` }}
                              title={`Límite de Crédito: $${statementData.creditLimit.toLocaleString("es-MX")}`}
                            >
                              <span className="text-[8px] font-mono text-rose-500 bg-white/90 dark:bg-[#071C33]/90 px-1 rounded -translate-y-2">
                                Límite: ${statementData.creditLimit.toLocaleString("es-MX")}
                              </span>
                            </div>
                          )}

                          {statementData.creditHealth!.salesHistory.map((item, i) => {
                            const pct = Math.max(12, Math.min(100, (item.totalSales / maxVal) * 100));
                            const isLatest = i === 5;
                            const isDown = isLatest && statementData.creditHealth!.trend === "COOLING_DOWN";
                            const isUp = isLatest && statementData.creditHealth!.trend === "GROWING";

                            return (
                              <div key={item.month} className="flex flex-col items-center h-full justify-end group relative z-10">
                                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap shadow-lg z-20">
                                  {item.monthLabel}: ${item.totalSales.toLocaleString("es-MX")} ({item.invoiceCount} docs)
                                </div>
                                <span className="text-[9px] font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1 group-hover:text-etiserv-blue">
                                  ${Math.round(item.totalSales / 1000)}k
                                </span>
                                <div className="w-full max-w-[32px] bg-slate-100 dark:bg-white/5 rounded-t-md h-full flex items-end">
                                  <div
                                    className={`w-full rounded-t-md transition-all duration-500 ${
                                      isDown
                                        ? "bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500 shadow-xs"
                                        : isUp
                                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-700 group-hover:to-emerald-500 shadow-xs"
                                        : "bg-gradient-to-t from-etiserv-blue to-cyan-500 group-hover:from-blue-700 group-hover:to-cyan-400"
                                    }`}
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-semibold mt-1.5 ${isLatest ? "text-etiserv-blue font-bold" : "text-slate-500"}`}>
                                  {item.shortLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* VISTA 2: DIARIA (ÚLTIMOS 30 DÍAS) */}
                  {chartTimeframe === "DAILY" && (() => {
                    const daily = statementData.creditHealth!.dailyHistory || [];
                    const maxVal = Math.max(...daily.map((d) => d.totalSales), 5000);

                    return (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-end gap-1 h-28 pt-4 px-2 bg-white dark:bg-[#071C33] rounded-lg border border-slate-100 dark:border-white/5 overflow-x-auto">
                          {daily.map((d) => {
                            const pct = d.totalSales > 0 ? Math.max(15, Math.min(100, (d.totalSales / maxVal) * 100)) : 0;
                            const hasActivity = d.totalSales > 0;

                            return (
                              <div
                                key={d.date}
                                className="flex flex-col items-center h-full justify-end group relative min-w-[20px] flex-1"
                              >
                                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-mono py-0.5 px-2 rounded pointer-events-none whitespace-nowrap shadow-xl z-30">
                                  <strong>{d.dayLabel} ({d.weekday}):</strong> {hasActivity ? `$${d.totalSales.toLocaleString("es-MX")} (${d.docNumbers.join(", ")})` : "Sin operaciones"}
                                </div>
                                <div className="w-full max-w-[12px] bg-slate-100 dark:bg-white/5 rounded-t-sm h-full flex items-end">
                                  {hasActivity && (
                                    <div
                                      className="w-full rounded-t-sm bg-gradient-to-t from-etiserv-blue to-teal-400 group-hover:from-blue-600 group-hover:to-teal-300 transition-all shadow-xs"
                                      style={{ height: `${pct}%` }}
                                    />
                                  )}
                                </div>
                                <span className={`text-[8px] font-mono mt-1 ${hasActivity ? "text-etiserv-blue font-bold" : "text-slate-400"}`}>
                                  {d.date.slice(8, 10)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recommendation Note */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] bg-white dark:bg-[#071C33] border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300">
                    <span className="shrink-0 text-xs">
                      {statementData.creditHealth.recommendation === "COMMERCIAL_ACTION_REQUIRED" ? "⚠️" : statementData.creditHealth.recommendation === "INCREASE_LIMIT" ? "🚀" : statementData.creditHealth.recommendation === "REDUCE_LIMIT" ? "🟡" : "💡"}
                    </span>
                    <span className="font-medium leading-tight">
                      {statementData.creditHealth.recommendationText}
                    </span>
                  </div>
                </div>
              )}

              {/* Movements Table */}
              <div className="overflow-x-auto max-h-72 border border-slate-200 dark:border-white/10 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#071C33] text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3">Folio</th>
                      <th className="py-2 px-3">Concepto</th>
                      <th className="py-2 px-3 text-right">Cargo (+)</th>
                      <th className="py-2 px-3 text-right">Abono (-)</th>
                      <th className="py-2 px-3 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {statementData.movements.map((mov) => (
                      <tr
                        key={mov.id}
                        onClick={() => handleOpenDocDetailFromCatalog(mov)}
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                      >
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{mov.date}</td>
                        <td className="py-2 px-3">
                          <Badge
                            variant={mov.type === "INVOICE" ? "primary" : mov.type === "PAYMENT" ? "success" : "neutral"}
                            className="text-[9px] py-0.5 px-1.5"
                          >
                            {mov.type === "INVOICE" ? "Factura" : mov.type === "PAYMENT" ? "Pago" : "Nota Crédito"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDocDetailFromCatalog(mov);
                            }}
                            className="font-mono font-bold text-xs text-etiserv-blue group-hover:underline hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-left"
                            title="Ver Detalle Completo del Documento"
                          >
                            <FileText className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                            <span>{mov.docNumber}</span>
                          </button>
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-xs" title={mov.concept}>{mov.concept}</td>
                        <td className="py-2 px-3 text-right font-medium tabular-nums text-slate-900 dark:text-white">
                          {mov.debit > 0 ? `$${mov.debit.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {mov.credit > 0 ? `-$${mov.credit.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                          ${mov.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/10">
                <span className="text-xs font-semibold text-slate-500">
                  Saldo Neto Acumulado: <strong className="text-etiserv-blue font-mono">${statementData.summary.netBalance.toFixed(2)}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatementModalOpen(false);
                    setStatementPartner(null);
                    setStatementData(null);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        isOpen={docModalOpen}
        onClose={() => {
          setDocModalOpen(false);
          setSelectedMovement(null);
        }}
        movement={selectedMovement}
        partnerName={statementPartner?.name || statementData?.partnerName || "Cliente Comercial"}
        partnerTaxId={statementPartner?.taxNbr || statementData?.taxNbr || "XAXX010101000"}
        companyName={activeCompany?.name || "Distribuidora Nacional PyME S.A."}
        companyTaxId={activeCompany?.taxId || "DNP180520AB1"}
        currencySymbol={currencySymbol || "$"}
      />

      {/* 10. Modal Directorio Completo de Contactos */}
      <Modal
        isOpen={viewContactsModalOpen}
        onClose={() => {
          setViewContactsModalOpen(false);
          setSelectedPartnerForContacts(null);
        }}
        title={`Directorio de Contactos: ${selectedPartnerForContacts?.name || ""}`}
        maxWidth="lg"
      >
        {selectedPartnerForContacts && (() => {
          const p = selectedPartnerForContacts;
          const contactsList =
            Array.isArray(p.contacts) && p.contacts.length > 0
              ? p.contacts
              : p.contactPerson || p.email || p.phone
              ? [
                  {
                    id: 1,
                    name: p.contactPerson || p.name,
                    jobTitle: p.contactJobTitle || "Representante",
                    email: p.email || "",
                    phone: p.phone || "",
                    department: "General",
                    isPrimary: true,
                  },
                ]
              : [];

          return (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                    <Badge variant="primary" className="text-[10px]">
                      {p.isCustomer ? "Cliente" : "Proveedor"}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    RFC: {p.taxNbr} | {p.city || "Sin ciudad registrada"}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setViewContactsModalOpen(false);
                    handleOpenEditPartner(p);
                  }}
                  className="gap-1 text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Gestionar Contactos</span>
                </Button>
              </div>

              {contactsList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <span>No hay contactos registrados para este socio comercial.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contactsList.map((contact, idx) => (
                    <div
                      key={contact.id || idx}
                      className={clsx(
                        "p-3.5 rounded-xl border space-y-2 relative transition-all",
                        contact.isPrimary
                          ? "bg-etiserv-blue/[0.03] border-etiserv-blue/40 shadow-xs dark:border-etiserv-blue/30"
                          : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {contact.name}
                            </span>
                            {contact.isPrimary && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-white" /> Principal
                              </span>
                            )}
                          </div>
                          {contact.jobTitle && (
                            <span className="text-[11px] text-slate-500 block">
                              {contact.jobTitle}
                            </span>
                          )}
                        </div>

                        {contact.department && (
                          <Badge variant="neutral" className="text-[9px]">
                            {contact.department}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1 text-xs">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-etiserv-blue transition-colors font-mono"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{contact.phone}</span>
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-etiserv-blue transition-colors font-mono truncate"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{contact.email}</span>
                          </a>
                        )}
                        {!contact.phone && !contact.email && (
                          <span className="text-[11px] italic text-slate-400">Sin teléfono ni correo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewContactsModalOpen(false);
                    setSelectedPartnerForContacts(null);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
