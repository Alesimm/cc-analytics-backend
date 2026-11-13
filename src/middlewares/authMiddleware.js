// guardias de seguridad para proteger las rutas privadas de la api.
// verificartoken revisa si llega un token jwt valido en la peticion (si falta o vencio responde 401).
// autorizarroles revisa si el rol del usuario tiene permiso para esa accion (si no puede responde 403).

import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

// 401 significa que no sabemos quien es el usuario (sin token, token malo o vencido)
export function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization || "";
  const [tipo, token] = cabecera.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, mensaje: "Falta el token de acceso." });
  }

  try {
    // si el token es valido guardamos los datos del usuario en req.usuario para usarlo en el controlador
    req.usuario = jwt.verify(token, ENV.JWT_SECRET);
    next();
  } catch (error) {
    const mensaje = error.name === "TokenExpiredError" ? "La sesion expiro, inicia sesion de nuevo." : "Token invalido.";
    return res.status(401).json({ ok: false, mensaje });
  }
}

// 403 significa que sabemos quien es, pero su rol no tiene permiso para esta accion
export function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ ok: false, mensaje: "No tienes permiso para realizar esta accion." });
    }
    next();
  };
}
