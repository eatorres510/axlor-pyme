export interface PyMEAccountDefinition {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | "COST";
  description: string;
  reconcileOk?: boolean;
  isDefaultCash?: boolean;
  isDefaultBank?: boolean;
  isDefaultCustomer?: boolean;
  isDefaultSupplier?: boolean;
  isDefaultSales?: boolean;
  isDefaultCost?: boolean;
  isDefaultStock?: boolean;
  isDefaultSalary?: boolean;
}

export const PYME_CHART_OF_ACCOUNTS: PyMEAccountDefinition[] = [
  // --- 1. ACTIVO (1xx) ---
  { code: "101.01", name: "Caja General / Mostrador", type: "ASSET", description: "Efectivo disponible en caja y mostrador", isDefaultCash: true, reconcileOk: true },
  { code: "101.02", name: "Caja Chica", type: "ASSET", description: "Fondo fijo para gastos menores inmediatos", reconcileOk: true },
  { code: "102.01", name: "Bancos Nacionales", type: "ASSET", description: "Cuentas bancarias de cheques e inversión", isDefaultBank: true, reconcileOk: true },
  { code: "102.02", name: "Pasarelas de Pago / Tarjetas", type: "ASSET", description: "Saldos pendientes de liquidar por terminales TPV", reconcileOk: true },
  { code: "105.01", name: "Clientes Nacionales", type: "ASSET", description: "Cuentas por cobrar a clientes", isDefaultCustomer: true, reconcileOk: true },
  { code: "105.02", name: "Documentos por Cobrar", type: "ASSET", description: "Pagarés y títulos de crédito a favor", reconcileOk: true },
  { code: "107.01", name: "Deudores Diversos", type: "ASSET", description: "Préstamos a empleados y deudas varias", reconcileOk: true },
  { code: "115.01", name: "Inventario de Mercancías", type: "ASSET", description: "Existencias de productos para la venta", isDefaultStock: true, reconcileOk: false },
  { code: "118.01", name: "IVA Acreditable Pagado", type: "ASSET", description: "Impuesto al valor agregado pagado en compras", reconcileOk: false },
  { code: "118.02", name: "IVA por Acreditar", type: "ASSET", description: "IVA pendiente de acreditar por compras a crédito", reconcileOk: false },
  { code: "151.01", name: "Mobiliario y Equipo de Oficina", type: "ASSET", description: "Muebles, escritorios y equipo de oficina", reconcileOk: false },
  { code: "152.01", name: "Equipo de Cómputo", type: "ASSET", description: "Computadoras, impresoras y servidores", reconcileOk: false },
  { code: "154.01", name: "Equipo de Transporte", type: "ASSET", description: "Vehículos de reparto y utilitarios", reconcileOk: false },

  // --- 2. PASIVO (2xx) ---
  { code: "201.01", name: "Proveedores Nacionales", type: "LIABILITY", description: "Cuentas por pagar por compra de mercancías", isDefaultSupplier: true, reconcileOk: true },
  { code: "202.01", name: "Acreedores Diversos", type: "LIABILITY", description: "Deudas por servicios, renta y créditos no comerciales", reconcileOk: true },
  { code: "208.01", name: "IVA Trasladado Cobrado", type: "LIABILITY", description: "IVA cobrado en ventas de contado", reconcileOk: false },
  { code: "208.02", name: "IVA por Trasladar", type: "LIABILITY", description: "IVA pendiente de cobro en ventas a crédito", reconcileOk: false },
  { code: "211.01", name: "Sueldos y Salarios por Pagar", type: "LIABILITY", description: "Planilla y nómina devengada pendiente de pago", reconcileOk: true },
  { code: "212.01", name: "Impuestos y Retenciones por Pagar", type: "LIABILITY", description: "Retenciones de ISR, IMSS y otros impuestos", reconcileOk: false },

  // --- 3. CAPITAL CONTABLE (3xx) ---
  { code: "301.01", name: "Capital Social", type: "EQUITY", description: "Aportaciones de los socios o propietario", reconcileOk: false },
  { code: "302.01", name: "Utilidades Acumuladas", type: "EQUITY", description: "Ganancias retenidas de ejercicios anteriores", reconcileOk: false },
  { code: "303.01", name: "Resultado del Ejercicio", type: "EQUITY", description: "Utilidad o pérdida del periodo actual", reconcileOk: false },

  // --- 4. INGRESOS (4xx) ---
  { code: "401.01", name: "Ventas de Mercancías", type: "REVENUE", description: "Ingresos por ventas de contado y crédito", isDefaultSales: true, reconcileOk: false },
  { code: "402.01", name: "Devoluciones y Descuentos s/Ventas", type: "REVENUE", description: "Rebajas y notas de crédito a clientes", reconcileOk: false },
  { code: "403.01", name: "Otros Ingresos y Ganancias Financieras", type: "REVENUE", description: "Intereses ganados e ingresos extraordinarios", reconcileOk: false },

  // --- 5. COSTOS (5xx) ---
  { code: "501.01", name: "Costo de Ventas", type: "COST", description: "Costo real de las mercancías vendidas (PMP)", isDefaultCost: true, reconcileOk: false },

  // --- 6. GASTOS OPERATIVOS (6xx) ---
  { code: "601.01", name: "Gastos Generales de Operación", type: "EXPENSE", description: "Gastos de oficina y administración varios", reconcileOk: false },
  { code: "602.01", name: "Sueldos, Salarios y Prestaciones", type: "EXPENSE", description: "Nómina, bonos y sueldos del personal", isDefaultSalary: true, reconcileOk: false },
  { code: "603.01", name: "Renta y Arrendamientos", type: "EXPENSE", description: "Alquiler de locales comerciales y bodegas", reconcileOk: false },
  { code: "604.01", name: "Electricidad y Energía", type: "EXPENSE", description: "Servicios de luz y energía eléctrica (CFE/Compañía)", reconcileOk: false },
  { code: "605.01", name: "Combustibles y Lubricantes", type: "EXPENSE", description: "Gasolina y diésel para vehículos de entrega", reconcileOk: false },
  { code: "606.01", name: "Internet, Telefonía y Comunicaciones", type: "EXPENSE", description: "Telefonía móvil, fija y enlaces de fibra", reconcileOk: false },
  { code: "607.01", name: "Honorarios Profesionales", type: "EXPENSE", description: "Servicios contables, legales y asesorías", reconcileOk: false },
  { code: "608.01", name: "Papelería y Artículos de Oficina", type: "EXPENSE", description: "Insumos, papel térmico y papelería", reconcileOk: false },
  { code: "609.01", name: "Mantenimiento y Reparaciones", type: "EXPENSE", description: "Mantenimiento de equipo e instalaciones", reconcileOk: false },
  { code: "610.01", name: "Publicidad y Mercadotecnia", type: "EXPENSE", description: "Campañas en redes, anuncios y material POP", reconcileOk: false }
];
