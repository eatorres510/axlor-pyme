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

  // 1. Fetch SaleOrder 72
  const soRes = await axios.get("http://2.25.108.44:8080/ws/rest/com.axelor.apps.sale.db.SaleOrder/72", {
    headers: { "Cookie": `JSESSIONID=${jsessionId}; CSRF-TOKEN=${csrfToken}`, "X-CSRF-Token": csrfToken, "Accept": "application/json" }
  });
  console.log("SaleOrder 72 fetch result:", JSON.stringify(soRes.data.data, null, 2));

  // 2. Search SaleOrderLine for saleOrder.id = 72
  const lineRes = await axios.post(
    "http://2.25.108.44:8080/ws/rest/com.axelor.apps.sale.db.SaleOrderLine/search",
    {
      data: { _domain: "self.saleOrder.id = 72" },
      fields: ["id", "product", "productName", "qty", "price", "discount", "exTaxTotal", "inTaxTotal", "unit"]
    },
    {
      headers: { "Cookie": `JSESSIONID=${jsessionId}; CSRF-TOKEN=${csrfToken}`, "X-CSRF-Token": csrfToken, "Accept": "application/json" }
    }
  );
  console.log("\nSaleOrderLine search result for SO 72:", JSON.stringify(lineRes.data.data, null, 2));
}

test();
