import requests

base_url = "http://localhost:5000/api/stock"

# Test product Kardex for a brand new product (or non-existing moves)
r = requests.get(f"{base_url}/kardex/product/999999?companyId=13")
print("1. Status Kardex New Product:", r.status_code)
data = r.json().get("data", {})
summary = data.get("summary", {})
print("   Saldo Inicial:", summary.get("initialStock"))
print("   Entradas (+):", summary.get("totalInflows"))
print("   Salidas (-):", summary.get("totalOutflows"))
print("   Existencia Actual:", summary.get("currentStock"))
print("   Movimientos en Kardex:", len(data.get("ledger", [])))

# Test Warehouse Valuation
r2 = requests.get(f"{base_url}/valuation?companyId=13")
print("\n2. Status Valuation:", r2.status_code)
val_data = r2.json().get("data", {})
print("   Total SKUs Activos:", val_data.get("totalActiveSkus"))
print("   Total Unidades:", val_data.get("totalCompanyUnits"))
