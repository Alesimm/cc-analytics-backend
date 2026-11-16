// controlador para administrar las formaciones tacticas de la pizarra.
// permite listar los esquemas oficiales y personalizados, crear nuevos, actualizar ajustes y eliminar los propios.

import crypto from "node:crypto";
import { queryAll, queryOne, execute } from "../database/db.js";

// revisa que los cuatro ajustes tacticos sean numeros validos
function ajustesInvalidos(formacion) {
  return (
    Number.isNaN(formacion.alturaBloque) ||
    Number.isNaN(formacion.anchuraEquipo) ||
    Number.isNaN(formacion.intensidadPresion) ||
    Number.isNaN(formacion.ritmoPosesion)
  );
}

const MENSAJE_AJUSTES = "Los ajustes tacticos (altura, anchura, presion y ritmo) deben ser numeros.";

// convierte las columnas json de sqlite en arreglos listos para el frontend
function formatearFormacion(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    esOficial: Boolean(fila.esOficial),
    alturaBloque: fila.alturaBloque,
    anchuraEquipo: fila.anchuraEquipo,
    intensidadPresion: fila.intensidadPresion,
    ritmoPosesion: fila.ritmoPosesion,
    titulares: JSON.parse(fila.titularesJson || "[]"),
    suplentes: JSON.parse(fila.suplentesJson || "[]"),
  };
}

// get /api/v1/formaciones -> lista todas las formaciones guardadas
export function listarFormaciones(req, res) {
  const filas = queryAll("SELECT * FROM formaciones ORDER BY esOficial DESC, rowid ASC");
  const formaciones = filas.map(formatearFormacion);
  res.json({ ok: true, total: formaciones.length, formaciones });
}

// post /api/v1/formaciones -> crea una nueva formacion tactica (admin y cuerpo tecnico)
export function crearFormacion(req, res) {
  const {
    nombre,
    descripcion,
    alturaBloque = 60,
    anchuraEquipo = 60,
    intensidadPresion = 65,
    ritmoPosesion = 55,
    titulares = [],
    suplentes = [],
  } = req.body || {};

  if (!nombre || !descripcion) {
    return res.status(400).json({ ok: false, mensaje: "Debes ingresar nombre y descripcion del esquema." });
  }

  const nueva = {
    id: `form-${crypto.randomUUID().slice(0, 8)}`,
    nombre: String(nombre).trim(),
    descripcion: String(descripcion).trim(),
    esOficial: 0,
    alturaBloque: Number(alturaBloque),
    anchuraEquipo: Number(anchuraEquipo),
    intensidadPresion: Number(intensidadPresion),
    ritmoPosesion: Number(ritmoPosesion),
    titularesJson: JSON.stringify(Array.isArray(titulares) ? titulares : []),
    suplentesJson: JSON.stringify(Array.isArray(suplentes) ? suplentes : []),
  };

  if (ajustesInvalidos(nueva)) {
    return res.status(400).json({ ok: false, mensaje: MENSAJE_AJUSTES });
  }

  execute(
    `INSERT INTO formaciones (
      id, nombre, descripcion, esOficial, alturaBloque, anchuraEquipo,
      intensidadPresion, ritmoPosesion, titularesJson, suplentesJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nueva.id,
      nueva.nombre,
      nueva.descripcion,
      nueva.esOficial,
      nueva.alturaBloque,
      nueva.anchuraEquipo,
      nueva.intensidadPresion,
      nueva.ritmoPosesion,
      nueva.titularesJson,
      nueva.suplentesJson,
    ]
  );

  res.status(201).json({
    ok: true,
    mensaje: "Formacion tactica guardada.",
    formacion: formatearFormacion(nueva),
  });
}

// put /api/v1/formaciones/:id -> actualiza ajustes tacticos o jugadores de una formacion
export function actualizarFormacion(req, res) {
  const existente = queryOne("SELECT * FROM formaciones WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Formacion no encontrada." });
  }

  const datos = req.body || {};
  const actualizada = {
    id: existente.id,
    nombre: datos.nombre !== undefined ? String(datos.nombre).trim() : existente.nombre,
    descripcion: datos.descripcion !== undefined ? String(datos.descripcion).trim() : existente.descripcion,
    esOficial: existente.esOficial,
    alturaBloque: datos.alturaBloque !== undefined ? Number(datos.alturaBloque) : existente.alturaBloque,
    anchuraEquipo: datos.anchuraEquipo !== undefined ? Number(datos.anchuraEquipo) : existente.anchuraEquipo,
    intensidadPresion: datos.intensidadPresion !== undefined ? Number(datos.intensidadPresion) : existente.intensidadPresion,
    ritmoPosesion: datos.ritmoPosesion !== undefined ? Number(datos.ritmoPosesion) : existente.ritmoPosesion,
    titularesJson: datos.titulares !== undefined ? JSON.stringify(datos.titulares) : existente.titularesJson,
    suplentesJson: datos.suplentes !== undefined ? JSON.stringify(datos.suplentes) : existente.suplentesJson,
  };

  if (ajustesInvalidos(actualizada)) {
    return res.status(400).json({ ok: false, mensaje: MENSAJE_AJUSTES });
  }

  execute(
    `UPDATE formaciones
     SET nombre = ?, descripcion = ?, alturaBloque = ?, anchuraEquipo = ?,
         intensidadPresion = ?, ritmoPosesion = ?, titularesJson = ?, suplentesJson = ?
     WHERE id = ?`,
    [
      actualizada.nombre,
      actualizada.descripcion,
      actualizada.alturaBloque,
      actualizada.anchuraEquipo,
      actualizada.intensidadPresion,
      actualizada.ritmoPosesion,
      actualizada.titularesJson,
      actualizada.suplentesJson,
      actualizada.id,
    ]
  );

  res.json({
    ok: true,
    mensaje: "Formacion actualizada.",
    formacion: formatearFormacion(actualizada),
  });
}

// delete /api/v1/formaciones/:id -> elimina una formacion de la pizarra (solo admin)
export function eliminarFormacion(req, res) {
  const existente = queryOne("SELECT * FROM formaciones WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Formacion no encontrada." });
  }

  execute("DELETE FROM formaciones WHERE id = ?", [req.params.id]);
  res.json({ ok: true, mensaje: "Formacion eliminada." });
}
