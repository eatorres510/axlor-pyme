/**
 * Universal number and currency formatting utilities for Axelor PyME ERP.
 * Standardizes currency, decimal separators, and thousands separators across the entire platform.
 */

export const formatCurrency = (
  amount: number | string | null | undefined,
  currency = "MXN"
): string => {
  if (amount === null || amount === undefined || amount === "") {
    return "$0.00";
  }

  let num: number;
  if (typeof amount === "string") {
    // Remove existing currency symbols if present
    const cleanStr = amount.replace(/[^0-9.-]+/g, "");
    num = parseFloat(cleanStr);
  } else {
    num = Number(amount);
  }

  if (isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (
  val: number | string | null | undefined,
  decimals = 0
): string => {
  if (val === null || val === undefined || val === "") {
    return "0";
  }

  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatPercent = (
  pct: number | string | null | undefined,
  decimals = 1
): string => {
  if (pct === null || pct === undefined || pct === "") {
    return "0.0%";
  }

  const num = typeof pct === "string" ? parseFloat(pct) : Number(pct);
  if (isNaN(num)) return "0.0%";

  return `${num.toFixed(decimals)}%`;
};
