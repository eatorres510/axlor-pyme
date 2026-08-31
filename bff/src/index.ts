import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { onboardingRouter } from "./modules/onboarding/onboardingController";
import { catalogRouter } from "./modules/catalog/catalogController";
import { treasuryRouter } from "./modules/treasury/treasuryController";
import { purchasingRouter } from "./modules/purchasing/purchasingController";
import { stockRouter } from "./modules/stock/stockController";
import { posRouter } from "./modules/pos/posController";
import { expensesRouter } from "./modules/expenses/expensesController";
import { payrollRouter } from "./modules/payroll/payrollController";
import { financeRouter } from "./modules/finance/financeController";
import { dashboardRouter } from "./modules/dashboard/dashboardController";
import { authRouter } from "./modules/auth/authController";
import { saasRouter } from "./modules/saas/saasController";
import { tenantRouter } from "./modules/tenant/tenantController";
import { salesRouter } from "./modules/sales/salesController";
import { logisticsRouter } from "./modules/logistics/logisticsController";
import { testCycleRouter } from "./modules/testing/testCycleController";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public Healthcheck
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "axelor-pyme-bff",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Authentication Router
app.use("/api/auth", authRouter);

// SaaS Super Admin Router
app.use("/api/saas", saasRouter);

// Tenant Admin Router
app.use("/api/tenant", tenantRouter);

// Test Cycle Engine
app.use("/api/test", testCycleRouter);

// Mid-Market Operational Modules
app.use("/api/sales", salesRouter);
app.use("/api/logistics", logisticsRouter);

// Core ERP Routers
app.use("/api/onboarding", onboardingRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/treasury", treasuryRouter);
app.use("/api/purchases", purchasingRouter);
app.use("/api/purchasing", purchasingRouter);
app.use("/api/stock", stockRouter);
app.use("/api/pos", posRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/finance", financeRouter);
app.use("/api/dashboard", dashboardRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`[BFF] Axelor PyME Gateway running on http://localhost:${PORT}`);
  });
}

export default app;
