// controlador que maneja el inicio de sesion y la consulta del perfil actual.
// login valida correo y contraseña contra la base de datos y entrega un token jwt.
// me devuelve los datos del usuario dueño del token para mantener la sesion al recargar la pagina.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { queryOne } from "../database/db.js";

// arma el objeto del usuario sin incluir nunca la contraseña encriptada
function usuarioPublico(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    rol: fila.rol,
    cargo: fila.cargo,
  };
}

export function login(req, res) {
  const { correo, password } = req.body || {};

  if (!correo || !password) {
    return res.status(400).json({ ok: false, mensaje: "Debes enviar correo y contraseña." });
  }

  const fila = queryOne("SELECT * FROM usuarios WHERE correo = ?", [String(correo).trim().toLowerCase()]);

  // usamos el mismo mensaje si falla el correo o la contraseña para no dar pistas
  if (!fila || !bcrypt.compareSync(String(password), fila.passwordHash)) {
    return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos." });
  }

  const usuario = usuarioPublico(fila);

  // el token guarda el id y rol del usuario con tiempo de expiracion
  const token = jwt.sign(usuario, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

  res.json({ ok: true, token, usuario });
}

export function me(req, res) {
  // leemos de nuevo desde la base de datos por si el usuario cambio o fue dado de baja
  const fila = queryOne("SELECT * FROM usuarios WHERE id = ?", [req.usuario.id]);

  if (!fila) {
    return res.status(401).json({ ok: false, mensaje: "El usuario ya no existe." });
  }

  res.json({ ok: true, usuario: usuarioPublico(fila) });
}
