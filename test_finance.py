import requests
import json

base_url = "http://localhost:5000/api/finance"

# 1. Test Receipts list
r = requests.get(f"{base_url}/receipts")
print("1. Receipts List Status:", r.status_code, "Count:", len(r.json().get("data", [])))

# 2. Test Pending Invoices FIFO for Partner 1
r2 = requests.get(f"{base_url}/partner/1/pending-invoices?companyId=13&type=CUSTOMER")
data2 = r2.json().get("data", {})
invoices = data2.get("invoices", [])
print("2. Pending Invoices Status:", r2.status_code, "Invoices:", len(invoices), "Total Outstanding:", data2.get("totalOutstanding"))

# 3. Test Quick Payment with FIFO
quick_payload = {
    "companyId": 13,
    "partnerId": 1,
    "partnerName": "Supermercados La Union S.A.",
    "partnerType": "CUSTOMER",
    "totalAmount": 1000.0,
    "paymentMethod": "CASH",
    "sourceAccount": "CASH",
    "paymentDate": "2026-09-02",
    "reference": "TEST-COBRO-FIFO-01",
    "notes": "Cobro rapido con distribucion FIFO",
    "allocations": [
        {"invoiceId": 1, "invoiceSeq": "FAC-2026-0098", "amountPaid": 1000.0, "previousBalance": 1000.0, "newBalance": 0.0}
    ]
}
r3 = requests.post(f"{base_url}/quick-payment", json=quick_payload)
print("3. Quick Payment Status:", r3.status_code, "Receipt:", r3.json().get("data", {}).get("receiptSeq"))
created_id = r3.json().get("data", {}).get("id")

# 4. Test Immutability Guard (PUT on created receipt)
r4 = requests.put(f"{base_url}/receipts/{created_id}", json={"totalAmount": 2000})
print("4. Immutability Guard Status (Expected 400):", r4.status_code)
print("   Error message:", r4.json().get("error"))
