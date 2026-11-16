// controlador del centro medico para registrar lesiones, actualizar fases, otorgar altas medicas y eliminar fichas.
// el nombre, dorsal y posicion de la ficha se toman siempre del plantel real (404 si el jugador no existe).
// ademas mantiene sincronizado el estado del jugador: si tiene alguna baja activa queda en recuperacion,
// y si ya no le quedan bajas activas vuelve a disponible.

import crypto from "node:crypto";
import { queryAll, queryOne, execute } from "../database/db.js";

const ALTA = "Alta Médica";

// revisa si el jugador tiene alguna ficha sin alta y actualiza su estado en el plantel
function sincronizarEstadoJugador(jugadorId) {
  const bajaActiva = queryOne(
    "SELECT id FROM registros_medicos WHERE jugadorId = ? AND estado != ?",
    [jugadorId, ALTA]
  );
  const nuevoEstado = bajaActiva ? "En recuperación" : "Disponible";
  execute("UPDATE jugadores SET estado = ? WHERE id = ?", [nuevoEstado, jugadorId]);
}

// get /api/v1/medico -> lista todas las fichas medicas registradas
export function listarRegistrosMedicos(req, res) {
  const registros = queryAll("SELECT * FROM registros_medicos ORDER BY rowid DESC");
  res.json({ ok: true, total: registros.length, registros });
}

// post /api/v1/medico -> crea una ficha medica nueva y marca al jugador en recuperacion
export function crearRegistroMedico(req, res) {
  const {
    jugadorId,
    tipoLesion,
    diagnostico,
    gravedad,
    fechaIngreso,
    diasRecuperacion = 14,
    diasRestantes,
    fase = "Evaluación Inicial",
    estado = "Baja Activa",
    medicoTratante,
    observaciones = "",
  } = req.body || {};

  if (!jugadorId || !tipoLesion || !diagnostico || !gravedad || !medicoTratante) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos clinicos obligatorios para registrar la ficha." });
  }

  // los datos del jugador salen del plantel, no de lo que mande el cliente
  const jugador = queryOne("SELECT * FROM jugadores WHERE id = ?", [String(jugadorId).trim()]);
  if (!jugador) {
    return res.status(404).json({ ok: false, mensaje: "El jugador indicado no existe en el plantel." });
  }

  const diasRec = Number(diasRecuperacion);
  const diasRest = diasRestantes !== undefined ? Number(diasRestantes) : diasRec;

  if (Number.isNaN(diasRec) || Number.isNaN(diasRest)) {
    return res.status(400).json({ ok: false, mensaje: "Los dias de recuperacion y dias restantes deben ser numeros." });
  }

  const nuevo = {
    id: `med-${crypto.randomUUID().slice(0, 8)}`,
    jugadorId: jugador.id,
    jugadorNombre: jugador.nombre,
    dorsal: jugador.dorsal,
    posicion: jugador.posicion,
    tipoLesion: String(tipoLesion).trim(),
    diagnostico: String(diagnostico).trim(),
    gravedad: String(gravedad).trim(),
    fechaIngreso: fechaIngreso || new Date().toISOString().slice(0, 10),
    diasRecuperacion: diasRec,
    diasRestantes: diasRest,
    fase: String(fase).trim(),
    estado: String(estado).trim(),
    medicoTratante: String(medicoTratante).trim(),
    observaciones: String(observaciones).trim(),
  };

  execute(
    `INSERT INTO registros_medicos (
      id, jugadorId, jugadorNombre, dorsal, posicion, tipoLesion, diagnostico, gravedad,
      fechaIngreso, diasRecuperacion, diasRestantes, fase, estado, medicoTratante, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nuevo.id,
      nuevo.jugadorId,
      nuevo.jugadorNombre,
      nuevo.dorsal,
      nuevo.posicion,
      nuevo.tipoLesion,
      nuevo.diagnostico,
      nuevo.gravedad,
      nuevo.fechaIngreso,
      nuevo.diasRecuperacion,
      nuevo.diasRestantes,
      nuevo.fase,
      nuevo.estado,
      nuevo.medicoTratante,
      nuevo.observaciones,
    ]
  );

  sincronizarEstadoJugador(nuevo.jugadorId);

  res.status(201).json({ ok: true, mensaje: "Ficha medica registrada.", registro: nuevo });
}

// put /api/v1/medico/:id -> actualiza diagnostico, dias restantes, fase o estado de una ficha
export function actualizarRegistroMedico(req, res) {
  const existente = queryOne("SELECT * FROM registros_medicos WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Ficha medica no encontrada." });
  }

  const d = req.body || {};

  // si cambian el jugador de la ficha, revisamos que exista y usamos sus datos reales
  let jugador = { id: existente.jugadorId, nombre: existente.jugadorNombre, dorsal: existente.dorsal, posicion: existente.posicion };
  if (d.jugadorId !== undefined) {
    jugador = queryOne("SELECT * FROM jugadores WHERE id = ?", [String(d.jugadorId).trim()]);
    if (!jugador) {
      return res.status(404).json({ ok: false, mensaje: "El jugador indicado no existe en el plantel." });
    }
  }

  const actualizado = {
    id: existente.id,
    jugadorId: jugador.id,
    jugadorNombre: jugador.nombre,
    dorsal: jugador.dorsal,
    posicion: jugador.posicion,
    tipoLesion: d.tipoLesion !== undefined ? String(d.tipoLesion).trim() : existente.tipoLesion,
    diagnostico: d.diagnostico !== undefined ? String(d.diagnostico).trim() : existente.diagnostico,
    gravedad: d.gravedad !== undefined ? String(d.gravedad).trim() : existente.gravedad,
    fechaIngreso: d.fechaIngreso !== undefined ? String(d.fechaIngreso).trim() : existente.fechaIngreso,
    diasRecuperacion: d.diasRecuperacion !== undefined ? Number(d.diasRecuperacion) : existente.diasRecuperacion,
    diasRestantes: d.diasRestantes !== undefined ? Number(d.diasRestantes) : existente.diasRestantes,
    fase: d.fase !== undefined ? String(d.fase).trim() : existente.fase,
    estado: d.estado !== undefined ? String(d.estado).trim() : existente.estado,
    medicoTratante: d.medicoTratante !== undefined ? String(d.medicoTratante).trim() : existente.medicoTratante,
    observaciones: d.observaciones !== undefined ? String(d.observaciones).trim() : existente.observaciones,
  };

  if (Number.isNaN(actualizado.diasRecuperacion) || Number.isNaN(actualizado.diasRestantes)) {
    return res.status(400).json({ ok: false, mensaje: "Los dias de recuperacion y dias restantes deben ser numeros." });
  }

  execute(
    `UPDATE registros_medicos
     SET jugadorId = ?, jugadorNombre = ?, dorsal = ?, posicion = ?, tipoLesion = ?,
         diagnostico = ?, gravedad = ?, fechaIngreso = ?, diasRecuperacion = ?,
         diasRestantes = ?, fase = ?, estado = ?, medicoTratante = ?, observaciones = ?
     WHERE id = ?`,
    [
      actualizado.jugadorId,
      actualizado.jugadorNombre,
      actualizado.dorsal,
      actualizado.posicion,
      actualizado.tipoLesion,
      actualizado.diagnostico,
      actualizado.gravedad,
      actualizado.fechaIngreso,
      actualizado.diasRecuperacion,
      actualizado.diasRestantes,
      actualizado.fase,
      actualizado.estado,
      actualizado.medicoTratante,
      actualizado.observaciones,
      actualizado.id,
    ]
  );

  // sincronizamos al jugador actual y tambien al anterior si la ficha cambio de dueño
  sincronizarEstadoJugador(actualizado.jugadorId);
  if (existente.jugadorId !== actualizado.jugadorId) {
    sincronizarEstadoJugador(existente.jugadorId);
  }

  res.json({ ok: true, mensaje: "Ficha medica actualizada.", registro: actualizado });
}

// patch /api/v1/medico/:id/alta -> otorga el alta medica y deja disponible al jugador si no tiene otra baja
export function darAltaMedica(req, res) {
  const existente = queryOne("SELECT * FROM registros_medicos WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Ficha medica no encontrada." });
  }

  execute(
    "UPDATE registros_medicos SET fase = ?, estado = ?, diasRestantes = 0 WHERE id = ?",
    [ALTA, ALTA, req.params.id]
  );

  sincronizarEstadoJugador(existente.jugadorId);

  const actualizado = queryOne("SELECT * FROM registros_medicos WHERE id = ?", [req.params.id]);
  res.json({ ok: true, mensaje: `Alta medica otorgada a ${existente.jugadorNombre}.`, registro: actualizado });
}

// delete /api/v1/medico/:id -> elimina una ficha medica del historial (solo admin)
export function eliminarRegistroMedico(req, res) {
  const existente = queryOne("SELECT * FROM registros_medicos WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Ficha medica no encontrada." });
  }

  execute("DELETE FROM registros_medicos WHERE id = ?", [req.params.id]);

  // si se borro una baja activa, el jugador puede volver a quedar disponible
  sincronizarEstadoJugador(existente.jugadorId);

  res.json({ ok: true, mensaje: "Ficha medica eliminada." });
}
