import { axelor } from "../services/axelor/axelorClient.js";

async function cleanDuplicatePartners() {
  console.log("=== Eliminando Clientes Duplicados en Axelor ===");

  const res = await axelor.search("com.axelor.apps.base.db.Partner", {
    limit: 500,
  });

  const partners = Array.isArray(res.data) ? res.data : [];
  console.log(`Total de partners encontrados: ${partners.length}`);

  const nameMap = new Map<string, any>();
  const duplicatesToDelete: any[] = [];

  for (const p of partners) {
    const normName = (p.name || "").trim().toLowerCase();
    const normTax = (p.taxNbr || "").trim().toUpperCase();
    const key = `${normName}|${normTax}`;

    if (!nameMap.has(key)) {
      nameMap.set(key, p);
    } else {
      duplicatesToDelete.push(p);
    }
  }

  console.log(`Detectados ${duplicatesToDelete.length} registros repetidos.`);

  for (const dup of duplicatesToDelete) {
    console.log(`Eliminando duplicado ID ${dup.id}: "${dup.name}" (RFC: ${dup.taxNbr})`);
    try {
      await axelor.remove("com.axelor.apps.base.db.Partner", dup.id, dup.version || 0);
      console.log(`  -> Eliminado ID ${dup.id} OK`);
    } catch (e: any) {
      console.warn(`  -> No se pudo eliminar ID ${dup.id}:`, e.message);
    }
  }

  // Asegurar que los clientes únicos estén vinculados a la Empresa 13
  for (const [key, primary] of nameMap.entries()) {
    console.log(`Vinculando cliente principal ID ${primary.id} "${primary.name}" a Empresa 13...`);
    try {
      await axelor.update("com.axelor.apps.base.db.Partner", {
        id: primary.id,
        version: primary.version || 0,
        companySet: [{ id: 13 }],
      });
    } catch (e: any) {
      console.warn(`No se pudo actualizar empresa para ${primary.id}:`, e.message);
    }
  }

  console.log("=== Limpieza de duplicados finalizada con éxito ===");
}

cleanDuplicatePartners().catch(console.error);
