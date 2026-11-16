// controlador del centro medico para registrar lesiones, actualizar fases, otorgar altas medicas y eliminar fichas.
// ademas sincroniza automaticamente el estado del jugador en el plantel cuando entra o recibe el alta.

import { queryAll, queryOne, execute } from "../database/db.js";

// get /api/v1/medico -> lista todas las fichas medicas registradas
export function listarRegistrosMedicos(req, res) {
  const registros = queryAll("SELECT * FROM registros_medicos ORDER BY rowid DESC");
  res.json({ ok: true, total: registros.length, registros });
}

// post /api/v1/medico -> crea una ficha medica nueva y marca al jugador en recuperacion
export function crearRegistroMedico(req, res) {
  const {
    jugadorId,
    jugadorNombre,
    dorsal = 0,
    posicion = "Sin definir",
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

  if (!jugadorId || !jugadorNombre || !tipoLesion || !diagnostico || !gravedad || !medicoTratante) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos clinicos obligatorios para registrar la ficha." });
  }

  const diasRec = Number(diasRecuperacion);
  const diasRest = diasRestantes !== undefined ? Number(diasRestantes) : diasRec;

  const nuevo = {
    id: `med-${Date.now().toString().slice(-6)}`,
    jugadorId: String(jugadorId).trim(),
    jugadorNombre: String(jugadorNombre).trim(),
    dorsal: Number(dorsal) || 0,
    posicion: String(posicion).trim(),
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

  // si el jugador no entra con alta medica inmediata, actualizamos su estado en el plantel
  if (nuevo.estado !== "Alta Médica") {
    execute("UPDATE jugadores SET estado = ? WHERE id = ?", ["En recuperación", nuevo.jugadorId]);
  }

  res.status(201).json({ ok: true, mensaje: "Ficha medica registrada.", registro: nuevo });
}

// put /api/v1/medico/:id -> actualiza diagnostico, dias restantes, fase o estado de una ficha
export function actualizarRegistroMedico(req, res) {
  const existente = queryOne("SELECT * FROM registros_medicos WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Ficha medica no encontrada." });
  }

  const d = req.body || {};
  const actualizado = {
    id: existente.id,
    jugadorId: d.jugadorId !== undefined ? String(d.jugadorId).trim() : existente.jugadorId,
    jugadorNombre: d.jugadorNombre !== undefined ? String(d.jugadorNombre).trim() : existente.jugadorNombre,
    dorsal: d.dorsal !== undefined ? Number(d.dorsal) : existente.dorsal,
    posicion: d.posicion !== undefined ? String(d.posicion).trim() : existente.posicion,
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

  res.json({ ok: true, mensaje: "Ficha medica actualizada.", registro: actualizado });
}

// patch /api/v1/medico/:id/alta -> otorga el alta medica y deja disponible al jugador en el plantel
export function darAltaMedica(req, res) {
  const existente = queryOne("SELECT * FROM registros_medicos WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Ficha medica no encontrada." });
  }

  execute(
    "UPDATE registros_medicos SET fase = ?, estado = ?, diasRestantes = 0 WHERE id = ?",
    ["Alta Médica", "Alta Médica", req.params.id]
  );

  execute("UPDATE jugadores SET estado = ? WHERE id = ?", ["Disponible", existente.jugadorId]);

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
  res.json({ ok: true, mensaje: "Ficha medica eliminada." });
}
