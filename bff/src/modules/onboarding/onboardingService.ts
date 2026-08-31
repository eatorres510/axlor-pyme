import { axelor } from "../../services/axelor/axelorClient.js";
import { PYME_CHART_OF_ACCOUNTS } from "../../data/pymeChartOfAccounts.js";
import { CompanyOnboardInput, OnboardResult } from "./onboardingTypes.js";

export class OnboardingService {
  /**
   * Generates a clean unique code from company name if none provided.
   */
  private generateCode(name: string): string {
    const clean = name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900).toString();
    return (clean.slice(0, 5) + randomSuffix).slice(0, 8);
  }

  /**
   * Ensures base AccountTypes exist in Axelor and returns a mapping.
   */
  private async ensureAccountTypes(): Promise<Record<string, number>> {
    const searchRes = await axelor.search("com.axelor.apps.account.db.AccountType", {
      limit: 100,
    });

    const typeMap: Record<string, number> = {};
    const existing = searchRes.data || [];

    for (const t of existing) {
      if (t.name) {
        typeMap[t.name.toUpperCase()] = t.id;
      }
    }

    const standardTypes = [
      { name: "Activo", technicalTypeSelect: "asset", key: "ASSET" },
      { name: "Pasivo", technicalTypeSelect: "liability", key: "LIABILITY" },
      { name: "Capital", technicalTypeSelect: "equity", key: "EQUITY" },
      { name: "Ingreso", technicalTypeSelect: "revenue", key: "REVENUE" },
      { name: "Costo", technicalTypeSelect: "expense", key: "COST" },
      { name: "Gasto", technicalTypeSelect: "expense", key: "EXPENSE" },
    ];

    for (const st of standardTypes) {
      if (!typeMap[st.name.toUpperCase()]) {
        const created = await axelor.create("com.axelor.apps.account.db.AccountType", {
          name: st.name,
          technicalTypeSelect: st.technicalTypeSelect,
        });
        if (created.data && created.data.length > 0) {
          typeMap[st.name.toUpperCase()] = created.data[0].id;
          typeMap[st.key] = created.data[0].id;
        }
      } else {
        typeMap[st.key] = typeMap[st.name.toUpperCase()];
      }
    }

    return typeMap;
  }

  /**
   * Ensures standard JournalTypes exist in Axelor and returns a mapping.
   */
  private async ensureJournalTypes(): Promise<Record<number, number>> {
    const searchRes = await axelor.search("com.axelor.apps.account.db.JournalType", {
      limit: 100,
    });

    const jtMap: Record<number, number> = {};
    const existing = searchRes.data || [];

    for (const jt of existing) {
      if (jt.technicalTypeSelect !== undefined) {
        jtMap[jt.technicalTypeSelect] = jt.id;
      }
    }

    const standardJournalTypes = [
      { name: "Ventas", code: "VEN", technicalTypeSelect: 1 },
      { name: "Compras", code: "COM", technicalTypeSelect: 2 },
      { name: "Caja", code: "CAJ", technicalTypeSelect: 3 },
      { name: "Bancos", code: "BAN", technicalTypeSelect: 4 },
      { name: "Operaciones Varias", code: "VAR", technicalTypeSelect: 5 },
    ];

    for (const sjt of standardJournalTypes) {
      if (!jtMap[sjt.technicalTypeSelect]) {
        const created = await axelor.create("com.axelor.apps.account.db.JournalType", {
          name: sjt.name,
          code: sjt.code,
          technicalTypeSelect: sjt.technicalTypeSelect,
        });
        if (created.data && created.data.length > 0) {
          jtMap[sjt.technicalTypeSelect] = created.data[0].id;
        }
      }
    }

    return jtMap;
  }

  /**
   * Resolves currency ID by code (e.g. MXN, USD, EUR).
   */
  private async getCurrencyId(currencyCode: string): Promise<number | null> {
    try {
      const searchRes = await axelor.search("com.axelor.apps.base.db.Currency", {
        data: {
          _domain: `self.code = '${currencyCode.toUpperCase()}'`,
        },
        limit: 1,
      });

      if (searchRes.data && searchRes.data.length > 0) {
        return searchRes.data[0].id;
      }
    } catch (e: any) {
      console.warn("Currency lookup warning:", e.message);
    }
    return null;
  }

  /**
   * High-speed Zero-Config Multi-Company Onboarding
   */
  public async onboardCompany(input: CompanyOnboardInput): Promise<OnboardResult> {
    const startTime = Date.now();
    const companyCode = input.code || this.generateCode(input.name);

    // 1. Resolve Currency
    const currencyId = await this.getCurrencyId(input.currencyCode || "MXN");
    const currencyObj = currencyId ? { id: currencyId } : undefined;

    // 2. Create Company
    const companyPayload: Record<string, any> = {
      name: input.name,
      code: companyCode,
    };
    if (currencyObj) {
      companyPayload.currency = currencyObj;
    }

    const companyRes = await axelor.create("com.axelor.apps.base.db.Company", companyPayload);

    if (!companyRes || !companyRes.data || companyRes.data.length === 0) {
      throw new Error(`Error al crear la empresa en Axelor: ${JSON.stringify(companyRes)}`);
    }
    const createdCompany = companyRes.data[0];
    const companyRef = { id: createdCompany.id };

    // 3. Ensure Account Types & Journal Types
    const accountTypeMap = await this.ensureAccountTypes();
    const journalTypeMap = await this.ensureJournalTypes();

    // 4. Create Master Chart of Accounts (36 Accounts) concurrently in batches
    const defaultAccounts: OnboardResult["defaultAccounts"] = {};
    const accountPayloads = PYME_CHART_OF_ACCOUNTS.map((acc) => ({
      name: acc.name,
      code: acc.code,
      statusSelect: 1,
      company: companyRef,
      reconcileOk: acc.reconcileOk ?? false,
      accountType: accountTypeMap[acc.type] ? { id: accountTypeMap[acc.type] } : undefined,
    }));

    const createdAccounts = await axelor.createMany("com.axelor.apps.account.db.Account", accountPayloads);

    // Map default account IDs
    createdAccounts.forEach((acc: any) => {
      const def = PYME_CHART_OF_ACCOUNTS.find((d) => d.code === acc.code);
      if (!def) return;
      if (def.isDefaultCash) defaultAccounts.cashAccountId = acc.id;
      if (def.isDefaultBank) defaultAccounts.bankAccountId = acc.id;
      if (def.isDefaultCustomer) defaultAccounts.customerAccountId = acc.id;
      if (def.isDefaultSupplier) defaultAccounts.supplierAccountId = acc.id;
      if (def.isDefaultSales) defaultAccounts.salesAccountId = acc.id;
      if (def.isDefaultCost) defaultAccounts.costAccountId = acc.id;
      if (def.isDefaultStock) defaultAccounts.stockAccountId = acc.id;
      if (def.isDefaultSalary) defaultAccounts.salaryAccountId = acc.id;
    });

    // 5. Create Standard Journals (with linked journalType)
    const standardJournals = [
      { name: "Diario de Ventas", code: `VEN-${companyCode}`, statusSelect: 1, company: companyRef, journalType: { id: journalTypeMap[1] } },
      { name: "Diario de Compras", code: `COM-${companyCode}`, statusSelect: 1, company: companyRef, journalType: { id: journalTypeMap[2] } },
      { name: "Diario de Caja Mostrador", code: `CAJ-${companyCode}`, statusSelect: 1, company: companyRef, journalType: { id: journalTypeMap[3] } },
      { name: "Diario de Bancos", code: `BAN-${companyCode}`, statusSelect: 1, company: companyRef, journalType: { id: journalTypeMap[4] } },
      { name: "Diario de Operaciones Varias", code: `VAR-${companyCode}`, statusSelect: 1, company: companyRef, journalType: { id: journalTypeMap[5] } },
    ];
    const createdJournals = await axelor.createMany("com.axelor.apps.account.db.Journal", standardJournals);

    // 6. Create Main Warehouse Location (typeSelect: 1 = Internal warehouse)
    const warehousePayload = {
      name: "Almacén Principal",
      company: companyRef,
      typeSelect: 1,
      usableOnSaleOrder: true,
      usableOnPurchaseOrder: true,
    };
    const warehouseRes = await axelor.create("com.axelor.apps.stock.db.StockLocation", warehousePayload);
    const createdWarehouse = warehouseRes.data?.[0] || { id: 0, name: "Almacén Principal", code: `ALM-${companyCode}` };

    // 7. Create Standard Sequences (including Partner sequence)
    const standardSequences = [
      { name: "Secuencia Facturas Ventas", codeSelect: "invoice", prefixe: "FAC-", padding: 6, toBeAdded: 1, sequenceTypeSelect: "NUMBERS", company: companyRef },
      { name: "Secuencia Órdenes Compra", codeSelect: "purchase.order", prefixe: "OC-", padding: 6, toBeAdded: 1, sequenceTypeSelect: "NUMBERS", company: companyRef },
      { name: "Secuencia Pedidos y Cotizaciones", codeSelect: "sale.order", prefixe: "PED-", padding: 6, toBeAdded: 1, sequenceTypeSelect: "NUMBERS", company: companyRef },
      { name: "Secuencia Traslados Internos", codeSelect: "stock.move", prefixe: "TRAS-", padding: 6, toBeAdded: 1, sequenceTypeSelect: "NUMBERS", company: companyRef },
      { name: "Secuencia Contactos", codeSelect: "partner", prefixe: "PAR-", padding: 5, toBeAdded: 1, sequenceTypeSelect: "NUMBERS", company: companyRef },
    ];
    const createdSequences = await axelor.createMany("com.axelor.apps.base.db.Sequence", standardSequences);

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      company: {
        id: createdCompany.id,
        name: createdCompany.name,
        code: createdCompany.code,
        taxId: input.taxId,
        currency: input.currencyCode || "MXN",
      },
      warehouse: {
        id: createdWarehouse.id,
        name: createdWarehouse.name,
        code: `ALM-${companyCode}`,
      },
      accountsCreated: createdAccounts.length,
      journalsCreated: createdJournals.length,
      sequencesCreated: createdSequences.length,
      defaultAccounts,
      durationMs,
    };
  }

  /**
   * List all registered companies.
   */
  public async listCompanies(): Promise<any[]> {
    const res = await axelor.search("com.axelor.apps.base.db.Company", {
      limit: 100,
      sortBy: ["name"],
    });
    const items = res.data || [];
    return items.map((c: any) => ({
      ...c,
      currency:
        typeof c.currency === "object" && c.currency
          ? c.currency.code || "MXN"
          : typeof c.currency === "string"
          ? c.currency
          : "MXN",
    }));
  }

  /**
   * Get company details by ID.
   */
  public async getCompany(id: number): Promise<any | null> {
    return await axelor.fetch("com.axelor.apps.base.db.Company", id);
  }

  /**
   * Get all chart of accounts for a specific company.
   */
  public async getCompanyAccounts(companyId: number): Promise<any[]> {
    const res = await axelor.search("com.axelor.apps.account.db.Account", {
      data: {
        _domain: `self.company.id = ${companyId}`,
      },
      limit: 100,
      sortBy: ["code"],
    });
    return res.data || [];
  }
}

export const onboardingService = new OnboardingService();
