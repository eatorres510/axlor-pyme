import { axelor } from "../../services/axelor/axelorClient.js";
import { ExpenseInput, ExpenseCategory } from "./expensesTypes.js";

export class ExpensesService {
  public async ensureAccountingPeriod(companyId: number, dateStr?: string): Promise<number> {
    const today = dateStr || new Date().toISOString().slice(0, 10);
    const yearCode = today.slice(0, 4);
    const periodCode = today.slice(0, 7);

    // 1. Ensure Year
    let yearId: number;
    const ySearch = await axelor.search("com.axelor.apps.base.db.Year", {
      data: { _domain: `self.company.id = ${companyId} and self.code = '${yearCode}'` },
      limit: 1,
    });

    if (Array.isArray(ySearch.data) && ySearch.data.length > 0) {
      yearId = ySearch.data[0].id;
    } else {
      const yCreate = await axelor.create("com.axelor.apps.base.db.Year", {
        name: `Año Fiscal ${yearCode}`,
        code: yearCode,
        fromDate: `${yearCode}-01-01`,
        toDate: `${yearCode}-12-31`,
        company: { id: companyId },
        statusSelect: 1,
      });
      const yItem = Array.isArray(yCreate.data) ? yCreate.data[0] : yCreate.data;
      yearId = yItem.id;
    }

    // 2. Ensure Period
    const pSearch = await axelor.search("com.axelor.apps.base.db.Period", {
      data: { _domain: `self.year.id = ${yearId} and self.code = '${periodCode}'` },
      limit: 1,
    });

    if (Array.isArray(pSearch.data) && pSearch.data.length > 0) {
      return pSearch.data[0].id;
    }

    const pCreate = await axelor.create("com.axelor.apps.base.db.Period", {
      name: `Periodo ${periodCode}`,
      code: periodCode,
      fromDate: `${periodCode}-01`,
      toDate: `${periodCode}-28`,
      year: { id: yearId },
      statusSelect: 1,
    });
    const pItem = Array.isArray(pCreate.data) ? pCreate.data[0] : pCreate.data;
    return pItem.id;
  }

  public async resolveAccount(companyId: number, codePrefix: string): Promise<number> {
    const res = await axelor.search("com.axelor.apps.account.db.Account", {
      data: {
        _domain: `self.company.id = ${companyId} and self.code like '${codePrefix}%'`,
      },
      limit: 1,
    });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0].id;
    }

    // Fallback search across all chart accounts
    const fallback = await axelor.search("com.axelor.apps.account.db.Account", {
      data: { _domain: `self.code like '${codePrefix}%'` },
      limit: 1,
    });
    return fallback.data?.[0]?.id || 1;
  }

  public async resolveJournal(companyId: number, isCash: boolean): Promise<number> {
    const techType = isCash ? 3 : 2; // 3 = Cash, 2 = Bank
    const res = await axelor.search("com.axelor.apps.account.db.Journal", {
      data: {
        _domain: `self.company.id = ${companyId} and self.journalType.technicalTypeSelect = ${techType}`,
      },
      limit: 1,
    });
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0].id;
    }

    // Any journal for the company
    const anyJ = await axelor.search("com.axelor.apps.account.db.Journal", {
      data: { _domain: `self.company.id = ${companyId}` },
      limit: 1,
    });
    return anyJ.data?.[0]?.id || 140;
  }

  // ==========================================
  // REGISTRO DE GASTOS
  // ==========================================

  public async createExpense(input: ExpenseInput): Promise<{
    id: number;
    category: ExpenseCategory;
    description: string;
    amount: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    moveId: number;
    date: string;
  }> {
    const today = input.expenseDate || new Date().toISOString().slice(0, 10);
    const total = Number((input.amount + input.taxAmount).toFixed(2));
    const isCash = input.paymentMethod === "CASH";

    const creditor = input.creditorName || input.supplierName || (input.supplierId ? `Acreedor #${input.supplierId}` : "Acreedor General");

    // 1. Resolve Accounting Entities
    const periodId = await this.ensureAccountingPeriod(input.companyId, today);
    const journalId = input.journalId || (await this.resolveJournal(input.companyId, isCash));

    // 2. Create Accounting Move (Asiento Contable)
    const movePayload: any = {
      company: { id: input.companyId },
      journal: { id: journalId },
      period: { id: periodId },
      date: today,
      statusSelect: 1, // Active
      origin: `Gasto Operativo: [${input.category}] $${total} - [${creditor}]: ${input.description}`,
    };
    if (input.supplierId) {
      movePayload.partner = { id: input.supplierId };
    }

    const res = await axelor.create("com.axelor.apps.account.db.Move", movePayload);
    const moveItem = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!moveItem || !moveItem.id) {
      throw new Error(`Error al registrar gasto contable: ${JSON.stringify(res)}`);
    }

    return {
      id: moveItem.id,
      category: input.category,
      description: input.description,
      amount: input.amount,
      taxAmount: input.taxAmount,
      total,
      paymentMethod: input.paymentMethod,
      moveId: moveItem.id,
      date: today,
    };
  }

  public async listExpenses(params: {
    companyId: number;
    category?: ExpenseCategory;
    limit?: number;
    offset?: number;
  }): Promise<{ expenses: any[]; total: number }> {
    const domainConditions: string[] = [
      `self.company.id = ${params.companyId}`,
      `self.origin like 'Gasto Operativo:%'`,
    ];
    if (params.category) {
      domainConditions.push(`self.origin like '%[${params.category}]%'`);
    }

    const payload: any = {
      limit: params.limit || 50,
      offset: params.offset || 0,
      sortBy: ["-createdOn"],
      data: {
        _domain: domainConditions.join(" and "),
      },
    };

    const res = await axelor.search("com.axelor.apps.account.db.Move", payload);
    const rawList = Array.isArray(res.data) ? res.data : [];
    return {
      expenses: rawList,
      total: res.total ?? rawList.length,
    };
  }

  public async getExpenseSummary(companyId: number): Promise<{
    companyId: number;
    totalSpent: number;
    byCategory: Record<ExpenseCategory, number>;
  }> {
    const res = await axelor.search("com.axelor.apps.account.db.Move", {
      data: {
        _domain: `self.company.id = ${companyId} and self.origin like 'Gasto Operativo:%'`,
      },
      limit: 200,
    });
    const moves = Array.isArray(res.data) ? res.data : [];

    const byCategory: Record<ExpenseCategory, number> = {
      RENT: 0,
      UTILITIES: 0,
      MARKETING: 0,
      MAINTENANCE: 0,
      SOFTWARE: 0,
      LOGISTICS: 0,
      OTHER: 0,
    };
    let totalSpent = 0;

    for (const move of moves) {
      const origin = move.origin || "";
      const match = origin.match(/Gasto Operativo: \[([A-Z_]+)\] \$([0-9.]+)/);
      if (match) {
        const cat = match[1] as ExpenseCategory;
        const amount = parseFloat(match[2]);
        if (byCategory[cat] !== undefined) {
          byCategory[cat] += amount;
        } else {
          byCategory["OTHER"] += amount;
        }
        totalSpent += amount;
      }
    }

    return {
      companyId,
      totalSpent: Number(totalSpent.toFixed(2)),
      byCategory,
    };
  }
}

export const expensesService = new ExpensesService();
