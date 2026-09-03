import requests
import json

base_url = "http://localhost:5000/api/finance"

# Simulate a partner with 4 invoices of $300 each (Total $1,200)
invoices = [
    {"id": 101, "seq": "FAC-001", "due": "2026-08-01", "remaining": 300.0},
    {"id": 102, "seq": "FAC-002", "due": "2026-08-10", "remaining": 300.0},
    {"id": 103, "seq": "FAC-003", "due": "2026-08-20", "remaining": 300.0},
    {"id": 104, "seq": "FAC-004", "due": "2026-09-01", "remaining": 300.0},
]

# Client pays $1,000 global partial payment
target_amount = 1000.0
rem_pool = target_amount
allocations = []

for inv in invoices:
    if rem_pool <= 0:
        continue
    can_pay = min(inv["remaining"], rem_pool)
    allocations.append({
        "invoiceId": inv["id"],
        "invoiceSeq": inv["seq"],
        "amountPaid": can_pay,
        "previousBalance": inv["remaining"],
        "newBalance": inv["remaining"] - can_pay
    })
    rem_pool -= can_pay

print("=== DISTRIBUCIÓN AUTOMÁTICA FIFO ===")
for alloc in allocations:
    print(f"Factura {alloc['invoiceSeq']} (Saldo: ${alloc['previousBalance']}) -> Abono Aplicado: ${alloc['amountPaid']} | Nuevo Saldo: ${alloc['newBalance']}")

payload = {
    "companyId": 13,
    "partnerId": 1,
    "partnerName": "Distribuidora del Norte S.A.",
    "partnerType": "CUSTOMER",
    "totalAmount": target_amount,
    "paymentMethod": "BANK_TRANSFER",
    "sourceAccount": "BANK",
    "paymentDate": "2026-09-02",
    "reference": "SPEI-FIFO-1000",
    "notes": "Abono global de $1,000 distribuido FIFO",
    "allocations": allocations
}

r = requests.post(f"{base_url}/quick-payment", json=payload)
print("\nRecibo Oficial Generado:", r.status_code, r.json().get("data", {}).get("receiptSeq"))
print("Desglose en Recibo:", json.dumps(r.json().get("data", {}).get("invoicesSettled"), indent=2))
