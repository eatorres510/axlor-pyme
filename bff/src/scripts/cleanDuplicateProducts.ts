import { axelor } from "../services/axelor/axelorClient.js";

async function cleanDuplicateProducts() {
  console.log("=== Eliminando Productos Duplicados en Axelor ===");

  const res = await axelor.search("com.axelor.apps.base.db.Product", {
    limit: 500,
  });

  const products = Array.isArray(res.data) ? res.data : [];
  console.log(`Total de productos en base de datos: ${products.length}`);

  const nameMap = new Map<string, any>();
  const duplicatesToDelete: any[] = [];

  for (const p of products) {
    if (!p.name || p.name === "null" || !p.code || p.code === "null") {
      duplicatesToDelete.push(p);
      continue;
    }

    const normName = p.name.trim().toLowerCase();
    if (!nameMap.has(normName)) {
      nameMap.set(normName, p);
    } else {
      duplicatesToDelete.push(p);
    }
  }

  console.log(`Detectados ${duplicatesToDelete.length} productos duplicados/inválidos a eliminar.`);

  for (const dup of duplicatesToDelete) {
    console.log(`Eliminando producto ID ${dup.id}: "${dup.name}" (Código: ${dup.code})...`);
    try {
      await axelor.remove("com.axelor.apps.base.db.Product", dup.id, dup.version || 0);
      console.log(`  -> Eliminado ID ${dup.id} OK`);
    } catch (e: any) {
      console.warn(`  -> Error al eliminar ${dup.id}:`, e.message);
    }
  }

  // Ensure unique primary products have correct data & company link
  console.log("Asegurando catálogo limpio con datos reales...");
  const CLEAN_CATALOG = [
    { name: "Refresco Cola 600ml", code: "7501055300011", barCode: "7501055300011", salePrice: 17.5, purchasePrice: 10.5, costPrice: 10.5, stockManaged: true },
    { name: "Agua Mineral 600ml", code: "7501055312345", barCode: "7501055312345", salePrice: 15.0, purchasePrice: 8.0, costPrice: 8.0, stockManaged: true },
    { name: "Agua Mineral Gasificada 600ml", code: "7501055103326", barCode: "7501055103326", salePrice: 18.5, purchasePrice: 11.0, costPrice: 11.0, stockManaged: true },
    { name: "Jugo Naranja 1L", code: "7501055400022", barCode: "7501055400022", salePrice: 25.0, purchasePrice: 14.0, costPrice: 14.0, stockManaged: true },
    { name: "Bebida Energética 473ml", code: "7501055500033", barCode: "7501055500033", salePrice: 38.0, purchasePrice: 22.0, costPrice: 22.0, stockManaged: true },
    { name: "Papas Fritas Sal 45g", code: "7509991000011", barCode: "7509991000011", salePrice: 18.0, purchasePrice: 10.0, costPrice: 10.0, stockManaged: true },
    { name: "Galletas de Chocolate 100g", code: "750999100374", barCode: "750999100374", salePrice: 25.0, purchasePrice: 12.0, costPrice: 12.0, stockManaged: true },
    { name: "Cacahuates Enchilados 70g", code: "7509993000033", barCode: "7509993000033", salePrice: 14.0, purchasePrice: 7.5, costPrice: 7.5, stockManaged: true },
    { name: "Caja de Cartón Reforzada", code: "750888235017", barCode: "750888235017", salePrice: 50.0, purchasePrice: 25.0, costPrice: 25.0, stockManaged: true },
    { name: "Rollo Cinta Canela 150m", code: "7508882000022", barCode: "7508882000022", salePrice: 35.0, purchasePrice: 18.0, costPrice: 18.0, stockManaged: true },
    { name: "Rollo Plástico Burbuja 50m", code: "7508883000033", barCode: "7508883000033", salePrice: 120.0, purchasePrice: 65.0, costPrice: 65.0, stockManaged: true },
    { name: "Bolsa Kraft c/Asa", code: "7508884000044", barCode: "7508884000044", salePrice: 8.5, purchasePrice: 4.0, costPrice: 4.0, stockManaged: true },
  ];

  for (const item of CLEAN_CATALOG) {
    const existing = nameMap.get(item.name.toLowerCase());
    if (existing) {
      console.log(`Actualizando producto existente ID ${existing.id} "${item.name}"...`);
      try {
        await axelor.update("com.axelor.apps.base.db.Product", {
          id: existing.id,
          version: existing.version || 0,
          name: item.name,
          code: item.code,
          salePrice: item.salePrice,
          purchasePrice: item.purchasePrice,
          costPrice: item.costPrice,
          stockManaged: true,
          company: { id: 13 },
        });
      } catch (e: any) {
        console.warn(`Error al actualizar ${existing.id}:`, e.message);
      }
    } else {
      console.log(`Creando producto faltante "${item.name}"...`);
      try {
        await axelor.create("com.axelor.apps.base.db.Product", {
          name: item.name,
          code: item.code,
          salePrice: item.salePrice,
          purchasePrice: item.purchasePrice,
          costPrice: item.costPrice,
          stockManaged: true,
          productTypeSelect: "storable",
          company: { id: 13 },
        });
      } catch (e: any) {
        console.warn(`Error al crear ${item.name}:`, e.message);
      }
    }
  }

  console.log("=== Limpieza de productos duplicados completada con éxito ===");
}

cleanDuplicateProducts().catch(console.error);
