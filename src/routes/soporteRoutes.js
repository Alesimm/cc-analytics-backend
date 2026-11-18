// rutas de soporte tecnico montadas en /api/v1/soporte.
// todos los roles autenticados pueden consultar y crear tickets; cambiar estado y eliminar queda para admin.

import { Router } from "express";
import {
  listarTickets,
  crearTicket,
  actualizarEstadoTicket,
  eliminarTicket,
} from "../controllers/soporteController.js";
import { verificarToken, autorizarRoles } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(verificarToken);

router.get("/", listarTickets);
router.post("/", crearTicket);
router.patch("/:id/estado", autorizarRoles("ADMIN"), actualizarEstadoTicket);
router.delete("/:id", autorizarRoles("ADMIN"), eliminarTicket);

export default router;
