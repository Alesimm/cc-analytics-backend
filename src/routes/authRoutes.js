// rutas de autenticacion montadas en /api/v1/auth.
// post /login es publica para iniciar sesion y get /me es privada para validar la sesion activa con token.

import { Router } from "express";
import { login, me } from "../controllers/authController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", verificarToken, me);

export default router;
