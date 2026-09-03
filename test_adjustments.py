import requests
import json

base_url = "http://localhost:5000/api/stock"

print("=== 1. LISTAR HISTÓRICO DE AJUSTES ===")
r_list = requests.get(f"{base_url}/adjustments?companyId=13")
print("Status:", r_list.status_code, "Ajustes registrados:", len(r_list.json().get("data", [])))

print("\n=== 2. PROBAR AJUSTE POSITIVO (INVENTARIO INICIAL / SOBRANTE) ===")
# Producto 1: Ajustar a 50 unidades físicas
payload_pos = {
    "companyId": 13,
    "warehouseId": 6,
    "productId": 1,
    "productName": "Agua Mineral 600ml",
    "productCode": "7501055312345",
    "physicalQty": 50,
    "reason": "INITIAL_INVENTORY",
    "notes": "Carga inicial de inventario para apertura de tienda",
    "responsibleName": "Auditor Principal"
}
r_pos = requests.post(f"{base_url}/adjustments", json=payload_pos)
print("Status Ajuste Positivo:", r_pos.status_code)
voucher_pos = r_pos.json().get("data", {})
print("Folio:", voucher_pos.get("voucherSeq"))
print("Exist. Anterior:", voucher_pos.get("previousStock"))
print("Conteo Físico:", voucher_pos.get("physicalQty"))
print("Diferencia Δ:", voucher_pos.get("deltaQty"))
print("Tipo Movimiento:", voucher_pos.get("adjustmentType"))
print("Impacto Valorizado ($):", voucher_pos.get("totalImpactValue"))
print("StockMove Axelor ID:", voucher_pos.get("stockMoveId"))

print("\n=== 3. CONSULTAR KARDEX TRAS AJUSTE POSITIVO ===")
r_kardex1 = requests.get(f"{base_url}/kardex/product/1?companyId=13")
kdata1 = r_kardex1.json().get("data", {})
print("Existencia Actual en Kardex:", kdata1.get("summary", {}).get("currentStock"))
if kdata1.get("ledger"):
    print("Último movimiento en Kardex:", kdata1["ledger"][0])

print("\n=== 4. PROBAR AJUSTE NEGATIVO (MERMA / FALTANTE) ===")
# Producto 1: Conteo físico real da 42 unidades (merma de 8 unidades)
payload_neg = {
    "companyId": 13,
    "warehouseId": 6,
    "productId": 1,
    "productName": "Agua Mineral 600ml",
    "productCode": "7501055312345",
    "physicalQty": 42,
    "reason": "DAMAGED_WASTE",
    "notes": "Merma por botellas rotas en maniobra de descarga",
    "responsibleName": "Jefe de Almacén"
}
r_neg = requests.post(f"{base_url}/adjustments", json=payload_neg)
print("Status Ajuste Negativo:", r_neg.status_code)
voucher_neg = r_neg.json().get("data", {})
print("Folio:", voucher_neg.get("voucherSeq"))
print("Exist. Anterior:", voucher_neg.get("previousStock"))
print("Conteo Físico:", voucher_neg.get("physicalQty"))
print("Diferencia Δ:", voucher_neg.get("deltaQty"))
print("Tipo Movimiento:", voucher_neg.get("adjustmentType"))
print("Impacto Valorizado ($):", voucher_neg.get("totalImpactValue"))
print("StockMove Axelor ID:", voucher_neg.get("stockMoveId"))

print("\n=== 5. CONSULTAR KARDEX TRAS AJUSTE NEGATIVO ===")
r_kardex2 = requests.get(f"{base_url}/kardex/product/1?companyId=13")
kdata2 = r_kardex2.json().get("data", {})
print("Existencia Final en Kardex:", kdata2.get("summary", {}).get("currentStock"))
print("Entradas Totales:", kdata2.get("summary", {}).get("totalInflows"))
print("Salidas Totales:", kdata2.get("summary", {}).get("totalOutflows"))
print("Movimientos en Kardex:", len(kdata2.get("ledger", [])))
