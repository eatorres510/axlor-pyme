import { Router, Response } from "express";
import { authService } from "./authService";
import { LoginSchema, SwitchCompanySchema, RegisterUserSchema } from "./authTypes";
import { verifyJWT, requireRole, AuthenticatedRequest } from "./authMiddleware";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", async (req, res: Response) => {
  try {
    const payload = LoginSchema.parse(req.body);
    const result = await authService.login(payload);
    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: result,
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: err.message || "Credenciales inválidas",
    });
  }
});

// GET /api/auth/me
authRouter.get("/me", verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// POST /api/auth/switch-company
authRouter.post("/switch-company", verifyJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = SwitchCompanySchema.parse(req.body);
    const result = await authService.switchCompany(req.user!, payload.companyId);
    res.json({
      success: true,
      message: `Empresa activa cambiada a ${result.user.activeCompanyName}`,
      data: result,
    });
  } catch (err: any) {
    res.status(403).json({
      success: false,
      error: err.message || "No se pudo cambiar de empresa",
    });
  }
});

// POST /api/auth/users
authRouter.post("/users", verifyJWT, requireRole(["ADMIN"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = RegisterUserSchema.parse(req.body);
    const newUser = await authService.registerUser(payload);
    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente en Axelor",
      data: newUser,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Error al registrar usuario",
    });
  }
});
