// rutas de plantel y directrices tacticas montadas en /api/v1/jugadores.
// todas las rutas piden token valido y las acciones de escritura revisan el rol permitido.

import { Router } from "express";
import {
  listarJugadores,
  obtenerJugador,
  crearJugador,
  actualizarJugador,
  eliminarJugador,
  listarDirectricesJugador,
  crearDirectriz,
} from "../controllers/jugadoresController.js";
import { verificarToken, autorizarRoles } from "../middlewares/authMiddleware.js";

const router = Router();

// todas las rutas de jugadores requieren sesion iniciada
router.use(verificarToken);

router.get("/", listarJugadores);
router.get("/:id", obtenerJugador);
router.post("/", autorizarRoles("ADMIN"), crearJugador);
router.put("/:id", autorizarRoles("ADMIN"), actualizarJugador);
router.delete("/:id", autorizarRoles("ADMIN"), eliminarJugador);

// subrutas de directrices tacticas por jugador
router.get("/:id/directrices", listarDirectricesJugador);
router.post("/:id/directrices", autorizarRoles("ADMIN", "CUERPO_TECNICO"), crearDirectriz);

export default router;
