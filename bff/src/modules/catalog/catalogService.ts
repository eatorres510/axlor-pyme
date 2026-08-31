import { axelor } from "../../services/axelor/axelorClient.js";
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_SUPPLIERS,
  SEED_CUSTOMERS,
} from "../../data/masterRelationalSeed.js";
import {
  ProductCategory,
  ProductInput,
  PartnerInput,
  UnitOfMeasure,
  PriceListInput,
} from "./catalogTypes.js";

export const DEFAULT_UOMS: UnitOfMeasure[] = [
  { code: "PZA", name: "Pieza / Unidad", symbol: "pza", category: "UNIT" },
  { code: "KGM", name: "Kilogramo", symbol: "kg", category: "WEIGHT" },
  { code: "LTR", name: "Litro", symbol: "lt", category: "VOLUME" },
  { code: "MTR", name: "Metro", symbol: "m", category: "LENGTH" },
  { code: "XBX", name: "Caja", symbol: "cj", category: "UNIT" },
  { code: "XPK", name: "Paquete", symbol: "paq", category: "UNIT" },
  { code: "E48", name: "Unidad de Servicio", symbol: "srv", category: "SERVICE" },
  { code: "HUR", name: "Hora de Servicio", symbol: "hr", category: "SERVICE" },
];

export const DEFAULT_PRICE_LISTS: PriceListInput[] = [
  { code: "PUBLIC", name: "Lista General (Precio Público)", discountPct: 0, description: "Precios de lista estándar para mostrador y venta directa" },
  { code: "WHOLESALE", name: "Lista Mayoreo (10% Descuento)", discountPct: 10, description: "Aplica para compras por volumen o clientes frecuentes" },
  { code: "DISTRIBUTOR", name: "Lista Distribuidor (20% Descuento)", discountPct: 20, description: "Tarifa preferencial para revendedores y distribuidores autorizados" },
  { code: "VIP", name: "Tarifa Especial VIP (15% Descuento)", discountPct: 15, description: "Tarifa preferencial exclusiva para clientes clave y cuentas estratégicas" },
  { code: "GOV", name: "Tarifa Gobierno & Institucional (5% Descuento)", discountPct: 5, description: "Tarifa especial para licitaciones públicas y dependencias gubernamentales" },
];

export const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  agua: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=70",
  gasificada: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&auto=format&fit=crop&q=70",
  cola: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=70",
  refresco: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=70",
  caja: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&auto=format&fit=crop&q=70",
  galleta: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&auto=format&fit=crop&q=70",
  chocolate: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&auto=format&fit=crop&q=70",
  papa: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=70",
  jugo: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=70",
  naranja: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=70",
};

export const resolveProductImageUrl = (p: any): string => {
  if (p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.startsWith("http")) {
    return p.imageUrl;
  }
  const name = (p.name || "").toLowerCase();
  for (const [key, url] of Object.entries(PRODUCT_IMAGE_FALLBACKS)) {
    if (name.includes(key)) return url;
  }
  return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=70";
};

export const resolvePartnerType = (p: any): "MORAL" | "FISICA" | "FINAL_CONSUMER" | "DISTRIBUTOR" | "GOVERNMENT" => {
  if (p.partnerType && ["MORAL", "FISICA", "FINAL_CONSUMER", "DISTRIBUTOR", "GOVERNMENT"].includes(p.partnerType)) {
    return p.partnerType;
  }
  const tax = (p.taxNbr || "").trim().toUpperCase();
  const name = (p.name || p.fullName || "").toLowerCase();
  if (tax === "XAXX010101000" || name.includes("público en general") || name.includes("publico en general") || name.includes("mostrador")) {
    return "FINAL_CONSUMER";
  }
  if (p.priceListCode === "DISTRIBUTOR" || name.includes("distribuidora") || name.includes("mayorista")) {
    return "DISTRIBUTOR";
  }
  if (name.includes("gobierno") || name.includes("municipio") || name.includes("secretaria") || name.includes("instituto")) {
    return "GOVERNMENT";
  }
  if (tax.length === 13) {
    return "FISICA";
  }
  return "MORAL";
};

export class CatalogService {
  private uomSeeded = false;
  private priceListSeeded = false;

  // ==========================================
  // UNIDADES DE MEDIDA (UoM) - Backing en com.axelor.apps.base.db.Unit
  // ==========================================
  public async listUoMs(): Promise<UnitOfMeasure[]> {
    try {
      const res = await axelor.search("com.axelor.apps.base.db.Unit", {
        limit: 100,
        sortBy: ["code"],
      });
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) {
        return data.map((u: any) => ({
          code: u.code || u.name,
          name: u.name || u.code,
          symbol: u.symbol || u.code?.toLowerCase() || "u",
          category: u.unitTypeSelect || "UNIT",
        }));
      }

      // Bootstrap idempotente en Axelor si la tabla de unidades está vacía
      if (!this.uomSeeded) {
        this.uomSeeded = true;
        const seedPayloads = DEFAULT_UOMS.map((u) => ({
          code: u.code,
          name: u.name,
          symbol: u.symbol,
          unitTypeSelect: u.category || "UNIT",
        }));
        await axelor.createMany("com.axelor.apps.base.db.Unit", seedPayloads);
      }
      return DEFAULT_UOMS;
    } catch (err: any) {
      console.warn("[CatalogService] Error consultando UoMs en Axelor:", err.message);
      return DEFAULT_UOMS;
    }
  }

  public async createUoM(input: UnitOfMeasure): Promise<UnitOfMeasure> {
    const code = input.code.toUpperCase();
    const payload = {
      code,
      name: input.name,
      symbol: input.symbol || code.toLowerCase(),
      unitTypeSelect: input.category || "UNIT",
    };

    try {
      const searchRes = await axelor.search("com.axelor.apps.base.db.Unit", {
        data: { _domain: `self.code = '${code}'` },
        limit: 1,
      });
      if (searchRes.data && searchRes.data.length > 0) {
        return {
          code,
          name: searchRes.data[0].name || input.name,
          symbol: searchRes.data[0].symbol || input.symbol,
          category: searchRes.data[0].unitTypeSelect || input.category || "UNIT",
        };
      }

      const res = await axelor.create("com.axelor.apps.base.db.Unit", payload);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      return {
        code: created?.code || code,
        name: created?.name || input.name,
        symbol: created?.symbol || input.symbol,
        category: created?.unitTypeSelect || input.category || "UNIT",
      };
    } catch (err: any) {
      console.warn("[CatalogService] Error creando UoM en Axelor:", err.message);
      return { ...input, code };
    }
  }

  public async updateUoM(code: string, input: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    try {
      const searchRes = await axelor.search("com.axelor.apps.base.db.Unit", {
        data: { _domain: `self.code = '${code.toUpperCase()}'` },
        limit: 1,
      });
      if (searchRes.data && searchRes.data.length > 0) {
        const uom = searchRes.data[0];
        const updatePayload: any = { id: uom.id, version: uom.version ?? 0 };
        if (input.name) updatePayload.name = input.name;
        if (input.symbol) updatePayload.symbol = input.symbol;
        if (input.category) updatePayload.unitTypeSelect = input.category;
        const res = await axelor.update("com.axelor.apps.base.db.Unit", updatePayload);
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        return {
          code: updated?.code || code,
          name: updated?.name || input.name || uom.name,
          symbol: updated?.symbol || input.symbol || uom.symbol,
          category: updated?.unitTypeSelect || input.category || uom.unitTypeSelect || "UNIT",
        };
      }
    } catch (err: any) {
      console.warn("[CatalogService] Error actualizando UoM en Axelor:", err.message);
    }
    return { code: code.toUpperCase(), name: input.name || code, symbol: input.symbol || "u", category: input.category || "UNIT" };
  }

  public async deleteUoM(code: string): Promise<boolean> {
    try {
      const searchRes = await axelor.search("com.axelor.apps.base.db.Unit", {
        data: { _domain: `self.code = '${code.toUpperCase()}'` },
        limit: 1,
      });
      if (searchRes.data && searchRes.data.length > 0) {
        const uom = searchRes.data[0];
        return await axelor.remove("com.axelor.apps.base.db.Unit", uom.id, uom.version ?? 0);
      }
    } catch (err: any) {
      console.warn("[CatalogService] Error eliminando UoM en Axelor:", err.message);
    }
    return true;
  }

  // ==========================================
  // LISTAS DE PRECIOS - Backing en com.axelor.apps.sale.db.PriceList
  // ==========================================
  public async listPriceLists(): Promise<PriceListInput[]> {
    try {
      const res = await axelor.search("com.axelor.apps.sale.db.PriceList", {
        limit: 100,
        sortBy: ["code"],
      });
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) {
        return data.map((p: any) => ({
          code: p.code || p.name,
          name: p.name || p.code,
          discountPct: Number(p.discount || 0),
          description: p.description || p.name || `Tarifa ${p.name}`,
        }));
      }

      // Bootstrap en Axelor si está vacía
      if (!this.priceListSeeded) {
        this.priceListSeeded = true;
        const seedPayloads = DEFAULT_PRICE_LISTS.map((pl) => ({
          code: pl.code,
          name: pl.name,
          discount: pl.discountPct,
          description: pl.description,
        }));
        await axelor.createMany("com.axelor.apps.sale.db.PriceList", seedPayloads);
      }
      return DEFAULT_PRICE_LISTS;
    } catch (err: any) {
      console.warn("[CatalogService] Error consultando PriceLists en Axelor:", err.message);
      return DEFAULT_PRICE_LISTS;
    }
  }

  public async createPriceList(input: PriceListInput): Promise<PriceListInput> {
    const code = input.code.toUpperCase();
    const payload = {
      code,
      name: input.name,
      discount: input.discountPct,
      description: input.description || `Tarifa comercial ${input.name}`,
    };

    try {
      const searchRes = await axelor.search("com.axelor.apps.sale.db.PriceList", {
        data: { _domain: `self.code = '${code}'` },
        limit: 1,
      });
      if (searchRes.data && searchRes.data.length > 0) {
        return {
          code,
          name: searchRes.data[0].name || input.name,
          discountPct: Number(searchRes.data[0].discount || input.discountPct),
          description: searchRes.data[0].description || input.description,
        };
      }

      const res = await axelor.create("com.axelor.apps.sale.db.PriceList", payload);
      const created = Array.isArray(res.data) ? res.data[0] : res.data;
      return {
        code: created?.code || code,
        name: created?.name || input.name,
        discountPct: Number(created?.discount || input.discountPct),
        description: created?.description || input.description,
      };
    } catch (err: any) {
      console.warn("[CatalogService] Error creando PriceList en Axelor:", err.message);
      return { ...input, code };
    }
  }

  public async updatePriceList(code: string, input: Partial<PriceListInput>): Promise<PriceListInput> {
    try {
      const searchRes = await axelor.search("com.axelor.apps.sale.db.PriceList", {
        data: { _domain: `self.code = '${code.toUpperCase()}'` },
        limit: 1,
      });
      if (searchRes.data && searchRes.data.length > 0) {
        const pl = searchRes.data[0];
        const updatePayload: any = { id: pl.id, version: pl.version ?? 0 };
        if (input.name) updatePayload.name = input.name;
        if (input.discountPct !== undefined) updatePayload.discount = input.discountPct;
        if (input.description) updatePayload.description = input.description;
        const res = await axelor.update("com.axelor.apps.sale.db.PriceList", updatePayload);
        const updated = Array.isArray(res.data) ? res.data[0] : res.data;
        return {
          code: updated?.code || code,
          name: updated?.name || input.name || pl.name,
          discountPct: Number(updated?.discount ?? input.discountPct ?? pl.discount ?? 0),
          description: updated?.description || input.description || pl.description,
        };
      }
    } catch (err: any) {
      console.warn("[CatalogService] Error actualizando PriceList en Axelor:", err.message);
    }
    return { code: code.toUpperCase(), name: input.name || code, discountPct: input.discountPct || 0, description: input.description };
  }

  public async deletePriceList(code: string): Promise<boolean> {
    try {
      const searchRes = await axelor.search("com.axelor.apps.sale.db.PriceList", {
        data: { _domain: `self.code = '${code.toUpperCase()}'` },
        limit: 1,
      });
      if (searchRes.data && searchRes.data.length > 0) {
        const pl = searchRes.data[0];
        return await axelor.remove("com.axelor.apps.sale.db.PriceList", pl.id, pl.version ?? 0);
      }
    } catch (err: any) {
      console.warn("[CatalogService] Error eliminando PriceList en Axelor:", err.message);
    }
    return true;
  }

  // ==========================================
  // CATEGORÍAS / FAMILIAS DE PRODUCTO
  // ==========================================
  public async listCategories(): Promise<any[]> {
    try {
      const res = await axelor.search("com.axelor.apps.base.db.ProductCategory", {
        limit: 100,
        sortBy: ["name"],
      });
      const rawList = Array.isArray(res.data) && res.data.length > 0 ? res.data : [];
      if (rawList.length > 0) {
        return rawList;
      }
      return SEED_CATEGORIES;
    } catch {
      return SEED_CATEGORIES;
    }
  }

  public async createCategory(input: { name: string; code?: string; description?: string }): Promise<any> {
    const uniqueCode = input.code ? input.code.toUpperCase() : `CAT-${Math.floor(100 + Math.random() * 900)}`;
    const payload = {
      name: input.name,
      code: uniqueCode,
    };
    try {
      const res = await axelor.create("com.axelor.apps.base.db.ProductCategory", payload);
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      return item || { id: Date.now(), ...payload };
    } catch {
      return { id: Date.now(), ...payload };
    }
  }

  public async updateCategory(id: number, input: { name?: string; code?: string; description?: string }): Promise<any> {
    const payload: any = { id };
    if (input.name) payload.name = input.name;
    if (input.code) payload.code = input.code;
    try {
      const res = await axelor.update("com.axelor.apps.base.db.ProductCategory", payload);
      return res.data?.[0] || payload;
    } catch {
      return payload;
    }
  }

  public async deleteCategory(id: number): Promise<boolean> {
    try {
      await axelor.remove("com.axelor.apps.base.db.ProductCategory", id, 0);
      return true;
    } catch {
      return true;
    }
  }

  // ==========================================
  // PRODUCTOS & SERVICIOS
  // ==========================================
  public async listProducts(params: {
    companyId?: number;
    query?: string;
    categoryId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ products: any[]; total: number }> {
    const domainConditions: string[] = [];
    if (params.categoryId) {
      domainConditions.push(`self.productCategory.id = ${params.categoryId}`);
    }
    if (params.query) {
      const q = params.query.replace(/'/g, "''");
      domainConditions.push(`(lower(self.name) like '%${q.toLowerCase()}%' or lower(self.code) like '%${q.toLowerCase()}%')`);
    }

    const payload: any = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      sortBy: ["name"],
    };
    if (domainConditions.length > 0) {
      payload.data = { _domain: domainConditions.join(" and ") };
    }

    try {
      const res = await axelor.search("com.axelor.apps.base.db.Product", payload);
      const rawList = Array.isArray(res.data) ? res.data : [];
      const combined = rawList.length > 0 ? rawList : SEED_PRODUCTS;
      const seen = new Set<string>();
      const items: any[] = [];

      for (const p of combined) {
        if (!p.name || p.name === "null") continue;
        const normName = (p.name || "").trim().toLowerCase();
        const normCode = (p.code || "").trim().toLowerCase();
        const dedupeKey = normName || normCode || String(p.id);

        if (params.query) {
          const q = params.query.toLowerCase();
          if (!normName.includes(q) && !normCode.includes(q)) continue;
        }
        if (params.categoryId && p.categoryId && p.categoryId !== params.categoryId) {
          continue;
        }

        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          items.push({
            ...p,
            salePrice: Number(p.salePrice ?? 0),
            purchasePrice: Number(p.purchasePrice ?? p.costPrice ?? 0),
            uomCode: p.uomCode || p.unit?.code || "PZA",
            uomName: p.uomName || p.unit?.name || "Pieza",
            categoryName: p.categoryName || p.productCategory?.name || "General",
            imageUrl: resolveProductImageUrl(p),
            taxRate: p.taxRate || 16,
          });
        }
      }
      return { products: items, total: items.length };
    } catch {
      return { products: SEED_PRODUCTS, total: SEED_PRODUCTS.length };
    }
  }

  public async getProduct(id: number): Promise<any> {
    try {
      const prod = await axelor.fetch("com.axelor.apps.base.db.Product", id);
      if (prod) {
        return {
          ...prod,
          salePrice: Number(prod.salePrice ?? 0),
          costPrice: Number(prod.costPrice ?? prod.purchasePrice ?? 0),
          purchasePrice: Number(prod.purchasePrice ?? prod.costPrice ?? 0),
          uomCode: prod.unit?.code || "PZA",
          uomName: prod.unit?.name || "Pieza",
          categoryName: prod.productCategory?.name || "General",
        };
      }
    } catch {}
    const list = await this.listProducts({});
    return list.products.find((p) => p.id === id) || { id, name: `Producto #${id}`, costPrice: 0, salePrice: 0 };
  }

  public async createProduct(input: ProductInput): Promise<any> {
    const payload: Record<string, any> = {
      name: input.name,
      code: input.barCode || input.code,
      salePrice: input.salePrice,
      costPrice: input.purchasePrice || 0,
      purchasePrice: input.purchasePrice || 0,
      stockManaged: true,
      productTypeSelect: "storable",
      company: { id: input.companyId },
    };

    if (input.categoryId) {
      payload.productCategory = { id: input.categoryId };
    }

    try {
      const res = await axelor.create("com.axelor.apps.base.db.Product", payload);
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      return {
        ...(item || payload),
        id: item?.id || Date.now(),
        uomCode: input.uomCode || "PZA",
        uomName: input.uomName || "Pieza",
        categoryName: input.categoryName || "General",
        salePrice: input.salePrice,
        purchasePrice: input.purchasePrice || 0,
        taxRate: input.taxRate || 16,
      };
    } catch {
      return {
        id: Date.now(),
        ...payload,
        uomCode: input.uomCode || "PZA",
        uomName: input.uomName || "Pieza",
        categoryName: input.categoryName || "General",
        salePrice: input.salePrice,
        purchasePrice: input.purchasePrice || 0,
        taxRate: input.taxRate || 16,
      };
    }
  }

  public async updateProduct(id: number, input: Partial<ProductInput>): Promise<any> {
    const payload: Record<string, any> = { id };
    if (input.name) payload.name = input.name;
    if (input.code || input.barCode) payload.code = input.barCode || input.code;
    if (input.salePrice !== undefined) payload.salePrice = input.salePrice;
    if (input.purchasePrice !== undefined) {
      payload.purchasePrice = input.purchasePrice;
      payload.costPrice = input.purchasePrice;
    }
    if (input.categoryId) payload.productCategory = { id: input.categoryId };

    try {
      const res = await axelor.update("com.axelor.apps.base.db.Product", payload);
      return res.data?.[0] || payload;
    } catch {
      return payload;
    }
  }

  public async deleteProduct(id: number): Promise<boolean> {
    try {
      await axelor.remove("com.axelor.apps.base.db.Product", id, 0);
      return true;
    } catch {
      return true;
    }
  }

  // ==========================================
  // SOCIOS COMERCIALES (CLIENTES & PROVEEDORES) - Backing en com.axelor.apps.base.db.Partner
  // ==========================================
  public async listPartners(params: {
    companyId?: number;
    isCustomer?: boolean;
    isSupplier?: boolean;
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ partners: any[]; total: number }> {
    const domainConditions: string[] = [];
    if (params.isCustomer) {
      domainConditions.push(`self.isCustomer = true`);
    }
    if (params.isSupplier) {
      domainConditions.push(`self.isSupplier = true`);
    }
    if (params.query) {
      const q = params.query.replace(/'/g, "''");
      domainConditions.push(`(lower(self.name) like '%${q.toLowerCase()}%' or lower(self.taxNbr) like '%${q.toLowerCase()}%')`);
    }

    const payload: any = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      sortBy: ["name"],
    };
    if (domainConditions.length > 0) {
      payload.data = { _domain: domainConditions.join(" and ") };
    }

    try {
      const res = await axelor.search("com.axelor.apps.base.db.Partner", payload);
      const rawList = Array.isArray(res.data) && res.data.length > 0 ? res.data : [];
      const baseFallback = params.isSupplier
        ? SEED_SUPPLIERS
        : params.isCustomer
        ? SEED_CUSTOMERS
        : [...SEED_CUSTOMERS, ...SEED_SUPPLIERS];
      const combined = rawList.length > 0 ? rawList : baseFallback;

      const seen = new Set<string>();
      const partners: any[] = [];
      for (const p of combined) {
        if (params.isCustomer && !p.isCustomer) continue;
        if (params.isSupplier && !p.isSupplier) continue;

        const normalizedName = (p.name || "").trim().toLowerCase();
        const taxKey = (p.taxNbr || "").trim().toUpperCase();
        const dedupeKey = `${normalizedName}_${taxKey}` || String(p.id);

        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          const normalizedContacts =
            Array.isArray(p.contacts) && p.contacts.length > 0
              ? p.contacts
              : p.contactPerson || p.email || p.phone
              ? [
                  {
                    id: 1,
                    name: p.contactPerson || p.name || "Contacto Principal",
                    jobTitle: p.contactJobTitle || "Representante",
                    email: p.email || p.emailAddress?.address || "",
                    phone: p.phone || p.fixedPhone || "",
                    department: "General",
                    isPrimary: true,
                  },
                ]
              : [];

          const primaryContact = normalizedContacts.find((c: any) => c.isPrimary) || normalizedContacts[0];

          partners.push({
            ...p,
            partnerType: resolvePartnerType(p),
            fiscalRegime: p.fiscalRegime || "601 - General de Ley Personas Morales",
            cfdiUsage: p.cfdiUsage || "G03 - Gastos en general",
            priceListCode: p.priceListCode || "PUBLIC",
            creditLimit: Number(p.creditLimit || 0),
            creditDays: Number(p.creditDays || 0),
            contactPerson: primaryContact?.name || p.contactPerson || "",
            contactJobTitle: primaryContact?.jobTitle || p.contactJobTitle || "",
            email: primaryContact?.email || p.email || p.emailAddress?.address || "",
            phone: primaryContact?.phone || p.phone || p.fixedPhone || "",
            address: p.address || "",
            city: p.city || "",
            contacts: normalizedContacts,
          });
        }
      }
      return { partners, total: partners.length };
    } catch {
      const fallbackList = (params.isSupplier ? SEED_SUPPLIERS : params.isCustomer ? SEED_CUSTOMERS : [...SEED_CUSTOMERS, ...SEED_SUPPLIERS]).map((p) => ({
        ...p,
        partnerType: resolvePartnerType(p),
      }));
      return { partners: fallbackList, total: fallbackList.length };
    }
  }

  public async createPartner(input: PartnerInput): Promise<any> {
    const rawContacts = Array.isArray(input.contacts) ? input.contacts : [];
    const primaryContact = rawContacts.find((c) => c.isPrimary) || rawContacts[0];

    const contactName = primaryContact?.name || input.contactPerson || "";
    const contactJob = primaryContact?.jobTitle || input.contactJobTitle || "";
    const contactEmail = primaryContact?.email || input.email || "";
    const contactPhone = primaryContact?.phone || input.phone || "";

    const payload: Record<string, any> = {
      name: input.name,
      simpleFullName: input.name,
      taxNbr: input.taxNbr,
      isCustomer: input.isCustomer,
      isSupplier: input.isSupplier,
      fixedPhone: contactPhone || null,
      companySet: [{ id: input.companyId || 13 }],
    };

    let savedId = Date.now();
    try {
      const res = await axelor.create("com.axelor.apps.base.db.Partner", payload);
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      if (item?.id) savedId = item.id;
    } catch (err: any) {
      console.warn("[CatalogService] Error persistiendo Partner en Axelor:", err.message);
    }

    return {
      id: savedId,
      name: input.name,
      simpleFullName: input.name,
      fullName: `${input.taxNbr} - ${input.name}`,
      taxNbr: input.taxNbr,
      partnerType: input.partnerType || resolvePartnerType(input),
      isCustomer: input.isCustomer,
      isSupplier: input.isSupplier,
      fiscalRegime: input.fiscalRegime || "601 - General de Ley Personas Morales",
      cfdiUsage: input.cfdiUsage || "G03 - Gastos en general",
      priceListCode: input.priceListCode || "PUBLIC",
      creditLimit: Number(input.creditLimit || 0),
      creditDays: Number(input.creditDays || 0),
      contactPerson: contactName,
      contactJobTitle: contactJob,
      email: contactEmail,
      phone: contactPhone,
      address: input.address || "",
      city: input.city || "",
      contacts: rawContacts.length > 0 ? rawContacts : contactName ? [{
        id: Date.now(),
        name: contactName,
        jobTitle: contactJob,
        email: contactEmail,
        phone: contactPhone,
        department: "General",
        isPrimary: true,
      }] : [],
    };
  }

  public async updatePartner(id: number, input: Partial<PartnerInput>): Promise<any> {
    const rawContacts = Array.isArray(input.contacts) ? input.contacts : undefined;
    const primaryContact = rawContacts ? (rawContacts.find((c) => c.isPrimary) || rawContacts[0]) : undefined;

    const payload: Record<string, any> = { id };
    if (input.name) {
      payload.name = input.name;
      payload.simpleFullName = input.name;
    }
    if (input.taxNbr) payload.taxNbr = input.taxNbr;
    if (primaryContact?.phone || input.phone) payload.fixedPhone = primaryContact?.phone || input.phone;

    try {
      await axelor.update("com.axelor.apps.base.db.Partner", payload);
    } catch (err: any) {
      console.warn("[CatalogService] Error actualizando Partner en Axelor:", err.message);
    }

    return {
      id,
      ...input,
      contactPerson: primaryContact?.name ?? input.contactPerson,
      contactJobTitle: primaryContact?.jobTitle ?? input.contactJobTitle,
      email: primaryContact?.email ?? input.email,
      phone: primaryContact?.phone ?? input.phone,
      contacts: rawContacts,
    };
  }

  public async deletePartner(id: number): Promise<boolean> {
    try {
      await axelor.remove("com.axelor.apps.base.db.Partner", id, 0);
      return true;
    } catch (err: any) {
      console.warn("[CatalogService] Error eliminando Partner en Axelor:", err.message);
      return true;
    }
  }
}

export const catalogService = new CatalogService();
