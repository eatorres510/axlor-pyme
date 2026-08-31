import { Request, Response, Router } from "express";
import { catalogService } from "./catalogService.js";
import {
  ProductSchema,
  PartnerSchema,
  UnitOfMeasureSchema,
  PriceListSchema,
  ProductCategorySchema,
} from "./catalogTypes.js";

export const catalogRouter = Router();

// ==========================================
// UNIDADES DE MEDIDA (UoM)
// ==========================================
catalogRouter.get("/uom", async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await catalogService.listUoMs();
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.post("/uom", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = UnitOfMeasureSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de UoM inválidos", details: parse.error.flatten() });
      return;
    }
    const item = await catalogService.createUoM(parse.data);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.put("/uom/:code", async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const item = await catalogService.updateUoM(code, req.body);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

catalogRouter.delete("/uom/:code", async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const success = await catalogService.deleteUoM(code);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// LISTAS DE PRECIOS
// ==========================================
catalogRouter.get("/price-lists", async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await catalogService.listPriceLists();
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.post("/price-lists", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = PriceListSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de lista inválidos", details: parse.error.flatten() });
      return;
    }
    const item = await catalogService.createPriceList(parse.data);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.put("/price-lists/:code", async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const item = await catalogService.updatePriceList(code, req.body);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

catalogRouter.delete("/price-lists/:code", async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;
    const success = await catalogService.deletePriceList(code);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// CATEGORÍAS / FAMILIAS DE PRODUCTO
// ==========================================
catalogRouter.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await catalogService.listCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.post("/categories", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = ProductCategorySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de categoría inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await catalogService.createCategory(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.put("/categories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await catalogService.updateCategory(id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.delete("/categories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await catalogService.deleteCategory(id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// PRODUCTOS & SERVICIOS
// ==========================================
catalogRouter.get("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
    const query = req.query.q as string | undefined;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await catalogService.listProducts({ companyId, query, categoryId, limit, offset });
    res.json({ success: true, data: result.products, total: result.total });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.post("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = ProductSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: "Datos de producto inválidos", details: parse.error.flatten() });
      return;
    }
    const result = await catalogService.createProduct(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.put("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await catalogService.updateProduct(id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.delete("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await catalogService.deleteProduct(id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// CONTACTOS (CLIENTES & PROVEEDORES)
// ==========================================
catalogRouter.get("/partners", async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string, 10) : undefined;
    const isCustomer = req.query.isCustomer !== undefined ? req.query.isCustomer === "true" : undefined;
    const isSupplier = req.query.isSupplier !== undefined ? req.query.isSupplier === "true" : undefined;
    const query = req.query.q as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await catalogService.listPartners({ companyId, isCustomer, isSupplier, query, limit, offset });
    res.json({ success: true, data: result.partners, total: result.total });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.post("/partners", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = PartnerSchema.safeParse(req.body);
    if (!parse.success) {
      const errorMsg = parse.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ success: false, error: `Error en datos del cliente/proveedor: ${errorMsg}`, details: parse.error.flatten() });
      return;
    }
    const result = await catalogService.createPartner(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.put("/partners/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await catalogService.updatePartner(id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

catalogRouter.delete("/partners/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await catalogService.deletePartner(id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
