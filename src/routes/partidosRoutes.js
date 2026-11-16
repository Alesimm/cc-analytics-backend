// rutas de calendario y partidos montadas en /api/v1/partidos.
// todos los roles autenticados pueden consultar el fixture; crear, editar o eliminar queda exclusivo para admin.

import { Router } from "express";
import {
  listarPartidos,
  obtenerPartido,
  crearPartido,
  actualizarPartido,
  eliminarPartido,
} from "../controllers/partidosController.js";
import { verificarToken, autorizarRoles } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(verificarToken);

router.get("/", listarPartidos);
router.get("/:id", obtenerPartido);
router.post("/", autorizarRoles("ADMIN"), crearPartido);
router.put("/:id", autorizarRoles("ADMIN"), actualizarPartido);
router.delete("/:id", autorizarRoles("ADMIN"), eliminarPartido);

export default router;
