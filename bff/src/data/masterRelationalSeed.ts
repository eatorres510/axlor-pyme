/**
 * DATASET RELACIONAL MAESTRO UNIFICADO (MASTER RELATIONAL SEED)
 * 
 * Contiene todas las entidades del ERP interconectadas relacionalmente:
 * - Cuentas Bancarias (BAC Credomatic, LAFISE Bancentro, Banpro Promerica, BDF)
 * - Cajas de Efectivo y Cortes
 * - Almacenes y Bodegas
 * - Categorías y Productos con Kardex y Existencias
 * - Socios Comerciales (Proveedores y Clientes con tarifas y límites de crédito)
 * - Órdenes de Compra y CxP
 * - Cotizaciones, Pedidos B2B y CxC
 * - Ventas POS en Mostrador
 * - Empleados, Puestos, Periodos y Recibos de Nómina
 * - Movimientos de Tesorería y Conciliación Bancaria
 */

export const MASTER_COMPANY_ID = 13;

// ==========================================
// 1. BANCOS & CAJAS DE EFECTIVO
// ==========================================
export const SEED_BANK_ACCOUNTS = [
  {
    id: 1,
    bankName: "BAC Credomatic",
    label: "BAC Credomatic - Operativa Principal",
    accountNumber: "0102938475",
    currencyCode: "USD",
    initialBalance: 145000,
    currentBalance: 145000,
    type: "Corriente / Operativa",
    companyId: MASTER_COMPANY_ID,
  },
  {
    id: 2,
    bankName: "Banco LAFISE Bancentro",
    label: "Banco LAFISE - Cobranza Clientes B2B",
    accountNumber: "1920837461",
    currencyCode: "USD",
    initialBalance: 88500,
    currentBalance: 88500,
    type: "Concentradora / Cobranza",
    companyId: MASTER_COMPANY_ID,
  },
  {
    id: 3,
    bankName: "Banpro Grupo Promerica",
    label: "Banpro - Nómina & Pagos Proveedores",
    accountNumber: "8831092834",
    currencyCode: "USD",
    initialBalance: 150000,
    currentBalance: 150000,
    type: "Dispersión / Nómina",
    companyId: MASTER_COMPANY_ID,
  },
  {
    id: 4,
    bankName: "BDF (Banco de Finanzas)",
    label: "BDF - Reserva & Ahorro Empresarial",
    accountNumber: "4561029384",
    currencyCode: "USD",
    initialBalance: 50000,
    currentBalance: 50000,
    type: "Ahorro / Inversión",
    companyId: MASTER_COMPANY_ID,
  },
];

export const SEED_CASH_REGISTERS = [
  {
    id: 1,
    name: "Caja Mostrador POS (Sucursal Principal)",
    code: "CAJ-01",
    accountCode: "101.01",
    initialBalance: 1000,
    currentBalance: 2500,
    status: "OPEN",
    branchName: "Sucursal Matriz",
    companyId: MASTER_COMPANY_ID,
  },
  {
    id: 2,
    name: "Caja Chica Administración",
    code: "CAJ-02",
    accountCode: "101.02",
    initialBalance: 2500,
    currentBalance: 5000,
    status: "OPEN",
    branchName: "Oficinas Centrales",
    companyId: MASTER_COMPANY_ID,
  },
];

// ==========================================
// 2. ALMACENES / BODEGAS
// ==========================================
export const SEED_WAREHOUSES = [
  { id: 1, name: "Almacén Principal / Matriz", code: "ALM-MAT", typeSelect: 1, company: { id: MASTER_COMPANY_ID } },
  { id: 2, name: "Bodega de Despacho & POS", code: "BOD-POS", typeSelect: 1, company: { id: MASTER_COMPANY_ID } },
  { id: 3, name: "Bodega Sucursal Norte / Mayoreo", code: "BOD-NORTE", typeSelect: 1, company: { id: MASTER_COMPANY_ID } },
];

// ==========================================
// 3. PRODUCTOS & CATEGORÍAS
// ==========================================
export const SEED_CATEGORIES = [
  { id: 1, name: "Bebidas & Refrescos", code: "BEB", description: "Línea de bebidas embotelladas, jugos y aguas" },
  { id: 2, name: "Snacks & Botanas", code: "SNK", description: "Golosinas, papas, galletas y barras de cereal" },
  { id: 3, name: "Empaques & Suministros", code: "EMP", description: "Cajas de cartón, cinta y plástico para embalaje" },
  { id: 4, name: "Servicios & Fletes", code: "SRV", description: "Servicios logísticos, entregas y mantenimiento" },
];

export const SEED_PRODUCTS = [
  // Bebidas
  { id: 1, name: "Refresco Cola 600ml", code: "REF-COLA-600", barCode: "7501055310884", categoryId: 1, categoryName: "Bebidas & Refrescos", costPrice: 10.5, purchasePrice: 10.5, salePrice: 18.0, minStock: 50, maxStock: 500, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 2, name: "Agua Mineral 600ml", code: "AGUA-MIN-600", barCode: "7501055310891", categoryId: 1, categoryName: "Bebidas & Refrescos", costPrice: 8.0, purchasePrice: 8.0, salePrice: 15.0, minStock: 40, maxStock: 400, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 3, name: "Jugo Naranja Natural 1L", code: "JUG-NAR-1L", barCode: "7501055310907", categoryId: 1, categoryName: "Bebidas & Refrescos", costPrice: 15.0, purchasePrice: 15.0, salePrice: 26.0, minStock: 30, maxStock: 300, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 4, name: "Té Helado Limón 500ml", code: "TE-LIM-500", barCode: "7501055310914", categoryId: 1, categoryName: "Bebidas & Refrescos", costPrice: 11.0, purchasePrice: 11.0, salePrice: 20.0, minStock: 25, maxStock: 250, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 5, name: "Bebida Energizante 355ml", code: "NRG-DRK-355", barCode: "7501055310921", categoryId: 1, categoryName: "Bebidas & Refrescos", costPrice: 22.0, purchasePrice: 22.0, salePrice: 38.0, minStock: 20, maxStock: 200, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },

  // Snacks
  { id: 6, name: "Papas Fritas Clásicas 45g", code: "PAP-SAL-45G", barCode: "7501055320012", categoryId: 2, categoryName: "Snacks & Botanas", costPrice: 10.0, purchasePrice: 10.0, salePrice: 18.0, minStock: 50, maxStock: 500, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 7, name: "Galletas Rellenas Chocolate 100g", code: "GAL-CHOC-100G", barCode: "7501055320029", categoryId: 2, categoryName: "Snacks & Botanas", costPrice: 9.5, purchasePrice: 9.5, salePrice: 18.0, minStock: 40, maxStock: 400, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 8, name: "Cacahuates Salados 70g", code: "CAC-SAL-70G", barCode: "7501055320036", categoryId: 2, categoryName: "Snacks & Botanas", costPrice: 7.5, purchasePrice: 7.5, salePrice: 15.0, minStock: 35, maxStock: 350, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 9, name: "Barra de Cereal & Miel 30g", code: "BAR-CER-30G", barCode: "7501055320043", categoryId: 2, categoryName: "Snacks & Botanas", costPrice: 6.0, purchasePrice: 6.0, salePrice: 12.0, minStock: 30, maxStock: 300, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 10, name: "Nachos de Maíz con Queso 85g", code: "NCH-QSO-85G", barCode: "7501055320050", categoryId: 2, categoryName: "Snacks & Botanas", costPrice: 12.0, purchasePrice: 12.0, salePrice: 22.0, minStock: 30, maxStock: 300, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },

  // Empaques & Suministros
  { id: 11, name: "Caja de Cartón Kraft 30x30x30", code: "CJ-KRF-30", barCode: "7501055330011", categoryId: 3, categoryName: "Empaques & Suministros", costPrice: 8.5, purchasePrice: 8.5, salePrice: 16.0, minStock: 100, maxStock: 1000, uomCode: "XBX", uomName: "Caja", taxRate: 16 },
  { id: 12, name: "Rollo Plástico Emplaye 18 Pulg", code: "EMP-ROL-18", barCode: "7501055330028", categoryId: 3, categoryName: "Empaques & Suministros", costPrice: 120.0, purchasePrice: 120.0, salePrice: 195.0, minStock: 15, maxStock: 150, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
  { id: 13, name: "Cinta Adhesiva Canela 50m", code: "CIN-CAN-50M", barCode: "7501055330035", categoryId: 3, categoryName: "Empaques & Suministros", costPrice: 18.0, purchasePrice: 18.0, salePrice: 32.0, minStock: 40, maxStock: 400, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },

  // Servicios & Gastos Operativos
  { id: 14, name: "Servicio de Flete & Reparto Local", code: "SRV-FLT-LOC", barCode: "SRV001", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 150.0, purchasePrice: 150.0, salePrice: 350.0, minStock: 0, maxStock: 0, uomCode: "E48", uomName: "Unidad de Servicio", taxRate: 16 },
  { id: 15, name: "Mantenimiento Preventivo de Equipo", code: "SRV-MANT-PREV", barCode: "SRV002", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 300.0, purchasePrice: 300.0, salePrice: 650.0, minStock: 0, maxStock: 0, uomCode: "HUR", uomName: "Hora de Servicio", taxRate: 16 },
  { id: 16, name: "Energía Eléctrica (Suministro CFE)", code: "SRV-ENERGIA", barCode: "SRV003", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 1200.0, purchasePrice: 1200.0, salePrice: 1200.0, minStock: 0, maxStock: 0, uomCode: "E48", uomName: "Unidad de Servicio", taxRate: 16 },
  { id: 17, name: "Combustible & Gasolina para Flotilla", code: "SRV-COMB-GAS", barCode: "SRV004", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 24.5, purchasePrice: 24.5, salePrice: 24.5, minStock: 0, maxStock: 0, uomCode: "LTR", uomName: "Litro", taxRate: 16 },
  { id: 18, name: "Servicio de Internet & Telefonía Empresarial", code: "SRV-INTERNET", barCode: "SRV005", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 850.0, purchasePrice: 850.0, salePrice: 850.0, minStock: 0, maxStock: 0, uomCode: "E48", uomName: "Unidad de Servicio", taxRate: 16 },
  { id: 19, name: "Arrendamiento / Renta de Inmuebles", code: "SRV-RENTA-LOCAL", barCode: "SRV006", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 15000.0, purchasePrice: 15000.0, salePrice: 15000.0, minStock: 0, maxStock: 0, uomCode: "E48", uomName: "Unidad de Servicio", taxRate: 16 },
  { id: 20, name: "Honorarios Contables & Asesoría Fiscal", code: "SRV-HON-CONT", barCode: "SRV007", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 4000.0, purchasePrice: 4000.0, salePrice: 4000.0, minStock: 0, maxStock: 0, uomCode: "E48", uomName: "Unidad de Servicio", taxRate: 16 },
  { id: 21, name: "Papelería, Insumos de Oficina & Limpieza", code: "SRV-PAPEL-OFIC", barCode: "SRV008", categoryId: 4, categoryName: "Servicios & Fletes", costPrice: 450.0, purchasePrice: 450.0, salePrice: 450.0, minStock: 0, maxStock: 0, uomCode: "PZA", uomName: "Pieza / Unidad", taxRate: 16 },
];

// ==========================================
// 4. SOCIOS COMERCIALES (PROVEEDORES & CLIENTES)
// ==========================================
export const SEED_SUPPLIERS = [
  {
    id: 101,
    name: "Distribuidora Embotelladora Nacional",
    taxNbr: "DEN120304LL1",
    email: "ventas@embotelladora.mx",
    phone: "55 5329 0000",
    contactPerson: "Ing. Esteban Vega",
    contactJobTitle: "Ejecutivo de Cuentas Clave",
    isCustomer: false,
    isSupplier: true,
    creditDays: 30,
    creditLimit: 200000,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G01 - Adquisición de mercancías",
    address: "Calz. Vallejo 1020, Parque Industrial",
    city: "Guadalajara, Jal.",
    bankAccountTarget: "Banpro Grupo Promerica",
  },
  {
    id: 102,
    name: "Proveedor Industrial de Empaques S.A.",
    taxNbr: "PIE150820KL4",
    email: "contacto@empaques.mx",
    phone: "33 3810 5544",
    contactPerson: "Lic. Mónica Rivas",
    contactJobTitle: "Atención a Clientes",
    isCustomer: false,
    isSupplier: true,
    creditDays: 30,
    creditLimit: 80000,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G01 - Adquisición de mercancías",
    address: "Zona Industrial El Álamo",
    city: "Tlaquepaque, Jal.",
    bankAccountTarget: "BAC Credomatic",
  },
  {
    id: 103,
    name: "Distribuidora Mayorista Dulces & Snacks",
    taxNbr: "DMD170912MN8",
    email: "pedidos@dulcessnacks.com",
    phone: "44 4812 7700",
    contactPerson: "Sr. Gabriel Fuentes",
    contactJobTitle: "Gerente de Ventas",
    isCustomer: false,
    isSupplier: true,
    creditDays: 15,
    creditLimit: 100000,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G01 - Adquisición de mercancías",
    address: "Av. Industrias 400",
    city: "San Luis Potosí, SLP",
    bankAccountTarget: "Banco LAFISE",
  },
  {
    id: 104,
    name: "Empresa Eléctrica Nacional",
    taxNbr: "CFE370814QI0",
    email: "servicios@electricidad.com",
    phone: "071",
    contactPerson: "Ventanilla Corporativa",
    contactJobTitle: "Servicio Empresarial",
    isCustomer: false,
    isSupplier: true,
    creditDays: 0,
    creditLimit: 0,
    fiscalRegime: "603 - Personas Morales con Fines no Lucrativos",
    cfdiUsage: "G03 - Gastos en general",
    address: "Paseo de la Reforma 164",
    city: "CDMX",
    bankAccountTarget: "BAC Credomatic",
  },
  {
    id: 105,
    name: "Inmobiliaria & Bodegas del Centro S.A.",
    taxNbr: "ICC140218OP9",
    email: "rentas@inmobiliariacentro.com",
    phone: "33 3616 8000",
    contactPerson: "Lic. Sofía Alarcón",
    contactJobTitle: "Administradora de Inmuebles",
    isCustomer: false,
    isSupplier: true,
    creditDays: 15,
    creditLimit: 50000,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G03 - Gastos en general",
    address: "Av. Juárez 650",
    city: "Guadalajara, Jal.",
    bankAccountTarget: "Banco LAFISE",
  },
];

export const SEED_CUSTOMERS = [
  {
    id: 1,
    name: "Supermercados La Central S.A. de C.V.",
    taxNbr: "SLC190420AB1",
    email: "compras@lacentral.mx",
    phone: "33 3615 4800",
    contactPerson: "Lic. Roberto Garza",
    contactJobTitle: "Director de Compras",
    isCustomer: true,
    isSupplier: false,
    priceListCode: "WHOLESALE",
    creditLimit: 50000,
    creditDays: 30,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G01 - Adquisición de mercancías",
    address: "Av. López Mateos Sur 1450",
    city: "Guadalajara, Jal.",
  },
  {
    id: 2,
    name: "Abarrotes y Minisúper Central",
    taxNbr: "AMC210901XY2",
    email: "contacto@abarrotescentral.com",
    phone: "33 1234 5678",
    contactPerson: "Sra. Carmen Morales",
    contactJobTitle: "Propietaria",
    isCustomer: true,
    isSupplier: false,
    priceListCode: "PUBLIC",
    creditLimit: 15000,
    creditDays: 15,
    fiscalRegime: "612 - Personas Físicas con Actividades Empresariales",
    cfdiUsage: "G03 - Gastos en general",
    address: "Calle Hidalgo 210",
    city: "Zapopan, Jal.",
  },
  {
    id: 3,
    name: "Distribuciones del Norte S.A.",
    taxNbr: "DNO180712KL3",
    email: "ventas@distnorte.com",
    phone: "81 8345 6789",
    contactPerson: "Ing. Alejandro Treviño",
    contactJobTitle: "Gerente Comercial",
    isCustomer: true,
    isSupplier: false,
    priceListCode: "DISTRIBUTOR",
    creditLimit: 120000,
    creditDays: 45,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G01 - Adquisición de mercancías",
    address: "Parque Industrial Norte",
    city: "Monterrey, N.L.",
  },
  {
    id: 4,
    name: "Restaurante El Portal Gourmet",
    taxNbr: "RPG200315GH7",
    email: "administracion@elportal.mx",
    phone: "55 5280 1122",
    contactPerson: "Chef Marco Antonio Ruiz",
    contactJobTitle: "Administrador General",
    isCustomer: true,
    isSupplier: false,
    priceListCode: "PUBLIC",
    creditLimit: 25000,
    creditDays: 15,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G03 - Gastos en general",
    address: "Col. Roma Norte",
    city: "CDMX",
  },
  {
    id: 5,
    name: "Tiendas de Conveniencia / Cadena Comercial",
    taxNbr: "CCO8605231N4",
    email: "facturacion@tiendasconveniencia.com",
    phone: "80 0288 6996",
    contactPerson: "Lic. Andrea Lozano",
    contactJobTitle: "Jefe de Cuentas B2B",
    isCustomer: true,
    isSupplier: false,
    priceListCode: "WHOLESALE",
    creditLimit: 250000,
    creditDays: 60,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G01 - Adquisición de mercancías",
    address: "Av. Edison 1235 Norte",
    city: "Monterrey, N.L.",
  },
  {
    id: 6,
    name: "Bodega Mayorista Don Pepe",
    taxNbr: "BMD220108JK5",
    email: "donpepe@mayoristas.mx",
    phone: "33 3671 2200",
    contactPerson: "Don José Luis Navarro",
    contactJobTitle: "Gerente General",
    isCustomer: true,
    isSupplier: false,
    priceListCode: "DISTRIBUTOR",
    creditLimit: 80000,
    creditDays: 30,
    fiscalRegime: "612 - Personas Físicas con Actividades Empresariales",
    cfdiUsage: "G01 - Adquisición de mercancías",
    address: "Mercado de Abastos Bodega 42",
    city: "Guadalajara, Jal.",
  },
  {
    id: 7,
    name: "Comercializadora San Juan",
    taxNbr: "CSJ191104MN9",
    email: "pedidos@sanjuan.com",
    phone: "44 2215 9000",
    contactPerson: "Lic. Patricia Salgado",
    contactJobTitle: "Compras y Proveeduría",
    isCustomer: true,
    isSupplier: false,
    priceListCode: "WHOLESALE",
    creditLimit: 45000,
    creditDays: 30,
    fiscalRegime: "601 - General de Ley Personas Morales",
    cfdiUsage: "G03 - Gastos en general",
    address: "Av. 5 de Febrero 800",
    city: "Querétaro, Qro.",
  },
];

export const SEED_PARTNERS = [...SEED_CUSTOMERS, ...SEED_SUPPLIERS];

// ==========================================
// 5. EMPLEADOS & NÓMINA
// ==========================================
export const SEED_EMPLOYEES = [
  { id: 1, name: "Lic. Fernando Garza Salinas", code: "EMP-001", taxId: "GASF780214XX1", jobTitle: "Director General", baseSalary: 45000, paymentPeriod: "QUINCENAL", department: "Dirección", bankName: "BAC Credomatic", bankAccount: "9012847501" },
  { id: 2, name: "Carlos Mendoza", code: "EMP-002", taxId: "MEAC850912YY2", jobTitle: "Ejecutivo B2B Senior", baseSalary: 22000, paymentPeriod: "QUINCENAL", department: "Ventas B2B", bankName: "BAC Credomatic", bankAccount: "9012847502" },
  { id: 3, name: "Mariana Fuentes", code: "EMP-003", taxId: "FUMM920315ZZ3", jobTitle: "Cajera & Vendedora Mostrador", baseSalary: 14000, paymentPeriod: "QUINCENAL", department: "Operaciones / POS", bankName: "Banpro", bankAccount: "8831092801" },
  { id: 4, name: "Alejandro Ruiz", code: "EMP-004", taxId: "RUGA880720WW4", jobTitle: "Jefe de Almacén & Logística", baseSalary: 18000, paymentPeriod: "QUINCENAL", department: "Almacén", bankName: "Banpro", bankAccount: "8831092802" },
  { id: 5, name: "Sofía Garza", code: "EMP-005", taxId: "GAS940510VV5", jobTitle: "Contadora General", baseSalary: 24000, paymentPeriod: "QUINCENAL", department: "Finanzas & Contabilidad", bankName: "Banco LAFISE", bankAccount: "1920837401" },
  { id: 6, name: "Pedro Ramírez", code: "EMP-006", taxId: "RAP891104UU6", jobTitle: "Chofer Repartidor", baseSalary: 13500, paymentPeriod: "QUINCENAL", department: "Logística & Reparto", bankName: "Banpro", bankAccount: "8831092803" },
];

export const SEED_PAYROLL_PERIODS = [
  {
    id: "2026-07-Q1",
    name: "1ra Quincena Julio 2026",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    paymentDate: "2026-07-15",
    status: "PAID",
    totalGross: 68250,
    totalDeductions: 10237.5,
    totalNet: 58012.5,
    disbursedFromBank: "Banpro Grupo Promerica",
  },
  {
    id: "2026-07-Q2",
    name: "2da Quincena Julio 2026",
    startDate: "2026-07-16",
    endDate: "2026-07-31",
    paymentDate: "2026-07-31",
    status: "PAID",
    totalGross: 68250,
    totalDeductions: 10237.5,
    totalNet: 58012.5,
    disbursedFromBank: "Banpro Grupo Promerica",
  },
  {
    id: "2026-08-Q1",
    name: "1ra Quincena Agosto 2026",
    startDate: "2026-08-01",
    endDate: "2026-08-15",
    paymentDate: "2026-08-15",
    status: "CONFIRMED",
    totalGross: 68250,
    totalDeductions: 10237.5,
    totalNet: 58012.5,
    disbursedFromBank: "Banpro Grupo Promerica",
  },
];

// ==========================================
// 6. ÓRDENES DE COMPRA & ABASTECIMIENTO
// ==========================================
export const SEED_PURCHASE_ORDERS = [
  {
    id: 1,
    orderNumber: "OC-2026-001",
    supplierId: 101,
    supplierName: "Distribuidora Embotelladora Nacional",
    creationDate: "2026-07-02",
    orderDate: "2026-07-02",
    statusSelect: 3, // Received
    warehouseId: 1,
    warehouseName: "Almacén Principal / Matriz",
    exTaxTotal: 25400.0,
    inTaxTotal: 29464.0,
    paymentStatus: "PAID",
    paidFromBank: "Banpro Grupo Promerica",
    lines: [
      { productId: 1, productName: "Refresco Cola 600ml", qty: 1000, unitPrice: 10.5, total: 10500 },
      { productId: 2, productName: "Agua Mineral 600ml", qty: 800, unitPrice: 8.0, total: 6400 },
      { productId: 3, productName: "Jugo Naranja Natural 1L", qty: 500, unitPrice: 15.0, total: 7500 },
      { productId: 4, productName: "Té Helado Limón 500ml", qty: 100, unitPrice: 10.0, total: 1000 },
    ],
  },
  {
    id: 2,
    orderNumber: "OC-2026-002",
    supplierId: 103,
    supplierName: "Distribuidora Mayorista Dulces & Snacks",
    creationDate: "2026-07-18",
    orderDate: "2026-07-18",
    statusSelect: 3, // Received
    warehouseId: 1,
    warehouseName: "Almacén Principal / Matriz",
    exTaxTotal: 18250.0,
    inTaxTotal: 21170.0,
    paymentStatus: "PENDING_CXP",
    lines: [
      { productId: 6, productName: "Papas Fritas Clásicas 45g", qty: 1000, unitPrice: 10.0, total: 10000 },
      { productId: 7, productName: "Galletas Rellenas Chocolate 100g", qty: 500, unitPrice: 9.5, total: 4750 },
      { productId: 8, productName: "Cacahuates Salados 70g", qty: 400, unitPrice: 7.5, total: 3000 },
      { productId: 9, productName: "Barra de Cereal & Miel 30g", qty: 83, unitPrice: 6.0, total: 500 },
    ],
  },
  {
    id: 3,
    orderNumber: "OC-2026-003",
    supplierId: 102,
    supplierName: "Proveedor Industrial de Empaques S.A.",
    creationDate: "2026-08-05",
    orderDate: "2026-08-05",
    statusSelect: 2, // Confirmed in transit
    warehouseId: 1,
    warehouseName: "Almacén Principal / Matriz",
    exTaxTotal: 12450.0,
    inTaxTotal: 14442.0,
    paymentStatus: "PENDING_CXP",
    lines: [
      { productId: 11, productName: "Caja de Cartón Kraft 30x30x30", qty: 800, unitPrice: 8.5, total: 6800 },
      { productId: 12, productName: "Rollo Plástico Emplaye 18 Pulg", qty: 30, unitPrice: 120.0, total: 3600 },
      { productId: 13, productName: "Cinta Adhesiva Canela 50m", qty: 114, unitPrice: 18.0, total: 2050 },
    ],
  },
];

// ==========================================
// 7. COTIZACIONES & VENTAS B2B
// ==========================================
export const SEED_QUOTATIONS = [
  {
    id: 1,
    quoteNumber: "COT-2026-001",
    customerPartner: { id: 1, name: "Supermercados La Central S.A. de C.V." },
    priceListCode: "WHOLESALE",
    creationDate: "2026-07-10",
    expirationDate: "2026-07-25",
    statusSelect: 4, // WON / Convertida a Factura
    totalAmount: 18450.0,
    paidToBank: "Banco LAFISE Bancentro",
    items: [
      { productId: 1, productName: "Refresco Cola 600ml", qty: 500, unitPrice: 16.2, total: 8100 },
      { productId: 2, productName: "Agua Mineral 600ml", qty: 400, unitPrice: 13.5, total: 5400 },
      { productId: 6, productName: "Papas Fritas Clásicas 45g", qty: 305, unitPrice: 16.2, total: 4950 },
    ],
  },
  {
    id: 2,
    quoteNumber: "COT-2026-002",
    customerPartner: { id: 3, name: "Distribuciones del Norte S.A." },
    priceListCode: "DISTRIBUTOR",
    creationDate: "2026-08-02",
    expirationDate: "2026-08-17",
    statusSelect: 2, // SENT
    totalAmount: 32600.0,
    items: [
      { productId: 1, productName: "Refresco Cola 600ml", qty: 1000, unitPrice: 14.4, total: 14400 },
      { productId: 3, productName: "Jugo Naranja Natural 1L", qty: 400, unitPrice: 20.8, total: 8320 },
      { productId: 6, productName: "Papas Fritas Clásicas 45g", qty: 686, unitPrice: 14.4, total: 9880 },
    ],
  },
  {
    id: 3,
    quoteNumber: "COT-2026-003",
    customerPartner: { id: 4, name: "Restaurante El Portal Gourmet" },
    priceListCode: "PUBLIC",
    creationDate: "2026-08-10",
    expirationDate: "2026-08-25",
    statusSelect: 1, // DRAFT
    totalAmount: 8950.0,
    items: [
      { productId: 1, productName: "Refresco Cola 600ml", qty: 200, unitPrice: 18.0, total: 3600 },
      { productId: 2, productName: "Agua Mineral 600ml", qty: 150, unitPrice: 15.0, total: 2250 },
      { productId: 14, productName: "Servicio de Flete & Reparto Local", qty: 1, unitPrice: 350.0, total: 350 },
      { productId: 3, productName: "Jugo Naranja Natural 1L", qty: 105, unitPrice: 26.0, total: 2750 },
    ],
  },
];
