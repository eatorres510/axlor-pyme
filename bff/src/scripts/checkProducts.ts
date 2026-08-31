import { axelor } from "../services/axelor/axelorClient.js";

async function checkProducts() {
  console.log("=== Inspeccionando Productos en Axelor ===");
  const res = await axelor.search("com.axelor.apps.base.db.Product", {
    limit: 500,
  });
  const rawList = Array.isArray(res.data) ? res.data : [];
  console.log(`Total de productos encontrados: ${rawList.length}`);

  const nameMap = new Map<string, any>();
  const duplicates: any[] = [];

  for (const p of rawList) {
    const key = (p.name || "").trim().toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, p);
    } else {
      duplicates.push(p);
    }
  }

  console.log(`Productos duplicados detectados: ${duplicates.length}`);
  for (const dup of duplicates) {
    console.log(`  - ID: ${dup.id} | Código: "${dup.code}" | Nombre: "${dup.name}" | Precio: ${dup.salePrice}`);
  }

  console.log("\n=== Lista completa de productos ===");
  for (const p of rawList) {
    console.log(`ID: ${p.id} | Código: "${p.code}" | Nombre: "${p.name}" | Precio: ${p.salePrice} | Empresa: ${p.company?.id || "N/A"}`);
  }
}

checkProducts().catch(console.error);
