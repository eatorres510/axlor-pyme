const axios = require("axios");

async function run() {
  try {
    const params = new URLSearchParams();
    params.append("username", "admin");
    params.append("password", "admin");

    const loginRes = await axios.post("http://127.0.0.1:8080/callback?client_name=FormClient", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      maxRedirects: 0,
      validateStatus: () => true
    });

    const setCookie = loginRes.headers["set-cookie"] || [];
    let jsession = "";
    let csrf = loginRes.headers["x-csrf-token"] || "";

    setCookie.forEach(c => {
      if (c.includes("JSESSIONID=")) jsession = c.match(/JSESSIONID=([^;]+)/)[1];
      if (c.includes("CSRF-TOKEN=")) csrf = c.match(/CSRF-TOKEN=([^;]+)/)[1];
    });

    const headers = {
      "Cookie": `JSESSIONID=${jsession}; CSRF-TOKEN=${csrf}`,
      "X-CSRF-Token": csrf,
      "Content-Type": "application/json"
    };

    console.log("Testing Invoice Creation with dueDate and invoiceDate...");
    const invRes = await axios.post("http://127.0.0.1:8080/ws/rest/com.axelor.apps.account.db.Invoice", {
      data: {
        operationTypeSelect: 1,
        operationSubTypeSelect: 2,
        invoiceTypeSelect: 2,
        company: { id: 13 },
        partner: { id: 24 },
        currency: { id: 100 },
        invoiceDate: "2026-07-15",
        dueDate: "2026-07-15",
        statusSelect: 1,
        inTaxTotal: 9000.00
      }
    }, { headers });
    const invId = invRes.data?.data?.[0]?.id;
    console.log("Created Invoice ID:", invId);

    const getRes = await axios.get(`http://127.0.0.1:8080/ws/rest/com.axelor.apps.account.db.Invoice/${invId}`, { headers });
    console.log("Fetched Invoice:", JSON.stringify(getRes.data.data?.[0]));

  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
