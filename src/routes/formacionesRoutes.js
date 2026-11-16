// rutas de formaciones tacticas montadas en /api/v1/formaciones.
// todos los roles autenticados pueden leer; crear o editar queda para admin y cuerpo tecnico; borrar solo para admin.

import { Router } from "express";
import {
  listarFormaciones,
  crearFormacion,
  actualizarFormacion,
  eliminarFormacion,
} from "../controllers/formacionesController.js";
import { verificarToken, autorizarRoles } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(verificarToken);

router.get("/", listarFormaciones);
router.post("/", autorizarRoles("ADMIN", "CUERPO_TECNICO"), crearFormacion);
router.put("/:id", autorizarRoles("ADMIN", "CUERPO_TECNICO"), actualizarFormacion);
router.delete("/:id", autorizarRoles("ADMIN"), eliminarFormacion);

export default router;
