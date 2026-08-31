import { describe, it, expect, beforeAll } from "vitest";
import { axelor } from "../services/axelor/axelorClient.js";
import { onboardingService } from "../modules/onboarding/onboardingService.js";

describe("Fase 1: Axelor BFF & Zero-Config Onboarding E2E Tests", () => {
  beforeAll(async () => {
    const appInfo = await axelor.getAppInfo();
    expect(appInfo).toBeDefined();
    expect(appInfo.application).toBeDefined();
  });

  it("Debe autenticarse y obtener la sesión en Axelor", async () => {
    const authSuccess = await axelor.authenticate();
    expect(authSuccess).toBe(true);
  });

  it("Debe realizar Onboarding Zero-Config de una empresa en <15 segundos", async () => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testInput = {
      name: `Empresa Test PyME ${randomSuffix}`,
      taxId: `TEST${randomSuffix}RFC`,
      currencyCode: "MXN",
    };

    const startTime = Date.now();
    const result = await onboardingService.onboardCompany(testInput);
    const elapsed = Date.now() - startTime;

    console.log(`⏱️ Onboarding completado en ${elapsed}ms:`, result.company);

    expect(result.success).toBe(true);
    expect(result.company.id).toBeGreaterThan(0);
    expect(result.company.name).toBe(testInput.name);
    expect(result.warehouse.id).toBeGreaterThan(0);
    expect(result.accountsCreated).toBe(36);
    expect(result.journalsCreated).toBe(5);
    expect(result.sequencesCreated).toBe(5);
    expect(result.defaultAccounts.cashAccountId).toBeDefined();
    expect(result.defaultAccounts.salesAccountId).toBeDefined();
    expect(result.defaultAccounts.costAccountId).toBeDefined();
    expect(elapsed).toBeLessThan(15000);

    // Verify company isolation in accounts
    const companyAccounts = await onboardingService.getCompanyAccounts(result.company.id);
    expect(companyAccounts.length).toBe(36);
    expect(companyAccounts[0].code).toBeDefined();
  });

  it("Debe listar las empresas registradas", async () => {
    const companies = await onboardingService.listCompanies();
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);
  });
});
