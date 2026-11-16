// rutas del centro medico montadas en /api/v1/medico.
// solo pueden entrar admin y cuerpo tecnico por confidencialidad clinica; eliminar queda exclusivo para admin.

import { Router } from "express";
import {
  listarRegistrosMedicos,
  crearRegistroMedico,
  actualizarRegistroMedico,
  darAltaMedica,
  eliminarRegistroMedico,
} from "../controllers/medicoController.js";
import { verificarToken, autorizarRoles } from "../middlewares/authMiddleware.js";

const router = Router();

// requiere sesion iniciada y rol clinico o administrativo (analista_lectura recibe 403)
router.use(verificarToken);
router.use(autorizarRoles("ADMIN", "CUERPO_TECNICO"));

router.get("/", listarRegistrosMedicos);
router.post("/", crearRegistroMedico);
router.put("/:id", actualizarRegistroMedico);
router.patch("/:id/alta", darAltaMedica);
router.delete("/:id", autorizarRoles("ADMIN"), eliminarRegistroMedico);

export default router;
