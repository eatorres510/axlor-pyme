import axios from "axios";

async function test() {
  const params = new URLSearchParams();
  params.append("username", "admin");
  params.append("password", "admin");

  const loginRes = await axios.post("http://2.25.108.44:8080/callback?client_name=FormClient", params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    maxRedirects: 0,
    validateStatus: (s) => true,
    timeout: 5000,
  });

  const cookies = loginRes.headers["set-cookie"] || [];
  let jsessionId = "";
  let csrfToken = "";
  for (const c of cookies) {
    if (c.includes("JSESSIONID=")) jsessionId = c.match(/JSESSIONID=([^;]+)/)?.[1] || "";
    if (c.includes("CSRF-TOKEN=")) csrfToken = c.match(/CSRF-TOKEN=([^;]+)/)?.[1] || "";
  }

  const res = await axios.post(
    "http://2.25.108.44:8080/ws/rest/com.axelor.apps.account.db.Invoice/search",
    {
      data: {
        _domain: "(self.company.id = 13 or self.company.id = 1 or self.company is null) and (self.operationTypeSelect = 1 or self.operationSubTypeSelect = 1)",
      },
      fields: [
        "id", "invoiceId", "invoiceSeq", "invoiceDate", "dueDate", "partner", "company", "currency",
        "exTaxTotal", "taxTotal", "inTaxTotal", "amountRemaining", "amountPaid", "statusSelect", "specificNotes", "description"
      ],
      limit: 20
    },
    {
      headers: { "Cookie": `JSESSIONID=${jsessionId}; CSRF-TOKEN=${csrfToken}`, "X-CSRF-Token": csrfToken, "Accept": "application/json" }
    }
  );

  console.log("Invoices query result count:", res.data.total, res.data.data?.length);
  for (const inv of res.data.data || []) {
    console.log(`Invoice ID ${inv.id}: Folio: ${inv.invoiceId || inv.invoiceSeq}, Partner: ${inv.partner?.fullName}, Total: $${inv.inTaxTotal}, Due: $${inv.amountRemaining}`);
  }
}

test();
