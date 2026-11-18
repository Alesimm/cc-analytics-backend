// controlador para gestionar el calendario y fixture de partidos de colo-colo.
// permite listar encuentros (con filtro por tipo proximo o anterior), consultar uno puntual, crear, editar y eliminar partidos.

import crypto from "node:crypto";
import { queryAll, queryOne, execute } from "../database/db.js";

// transforma las columnas json de sqlite en objetos y arreglos listos para react
function formatearPartido(fila) {
  return {
    id: fila.id,
    tipo: fila.tipo,
    rival: fila.rival,
    siglaRival: fila.siglaRival,
    rivalEscudo: fila.rivalEscudo || null,
    rivalEscudoColor: fila.rivalEscudoColor || "#334155",
    condicion: fila.condicion,
    torneo: fila.torneo,
    fecha: fila.fecha,
    hora: fila.hora,
    estadio: fila.estadio,
    ciudad: fila.ciudad || null,
    estado: fila.estado || null,
    arbitro: fila.arbitro || null,
    jornada: fila.jornada || null,
    clima: fila.clima || null,
    relevancia: fila.relevancia || null,
    golesColoColo: fila.golesColoColo,
    golesRival: fila.golesRival,
    resultado: fila.resultado || null,
    goleadores: fila.goleadoresJson ? JSON.parse(fila.goleadoresJson) : [],
    goleadoresRival: fila.goleadoresRivalJson ? JSON.parse(fila.goleadoresRivalJson) : [],
    estadisticas: fila.estadisticasJson ? JSON.parse(fila.estadisticasJson) : null,
    resumen: fila.resumen || null,
  };
}

// get /api/v1/partidos -> lista todos los partidos (acepta filtro ?tipo=proximo o ?tipo=anterior)
export function listarPartidos(req, res) {
  const { tipo } = req.query || {};

  let filas;
  if (tipo === "proximo") {
    filas = queryAll("SELECT * FROM partidos WHERE tipo = ? ORDER BY fecha ASC", [tipo]);
  } else if (tipo === "anterior") {
    filas = queryAll("SELECT * FROM partidos WHERE tipo = ? ORDER BY fecha DESC", [tipo]);
  } else {
    filas = queryAll("SELECT * FROM partidos ORDER BY rowid ASC");
  }

  const partidos = filas.map(formatearPartido);
  res.json({ ok: true, total: partidos.length, partidos });
}

// get /api/v1/partidos/:id -> obtiene el detalle de un partido por su id
export function obtenerPartido(req, res) {
  const fila = queryOne("SELECT * FROM partidos WHERE id = ?", [req.params.id]);
  if (!fila) {
    return res.status(404).json({ ok: false, mensaje: "Partido no encontrado." });
  }

  res.json({ ok: true, partido: formatearPartido(fila) });
}

// post /api/v1/partidos -> programa o registra un nuevo encuentro (solo admin)
export function crearPartido(req, res) {
  const d = req.body || {};

  if (!d.rival || !d.condicion || !d.torneo || !d.fecha || !d.hora || !d.estadio) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos obligatorios del partido." });
  }
  if (d.golesColoColo !== undefined && d.golesColoColo !== null && Number.isNaN(Number(d.golesColoColo))) {
    return res.status(400).json({ ok: false, mensaje: "Los goles de Colo-Colo deben ser un numero valido." });
  }
  if (d.golesRival !== undefined && d.golesRival !== null && Number.isNaN(Number(d.golesRival))) {
    return res.status(400).json({ ok: false, mensaje: "Los goles del rival deben ser un numero valido." });
  }

  const rivalLimpio = String(d.rival).trim();
  const sigla = d.siglaRival
    ? String(d.siglaRival).trim().toUpperCase().slice(0, 4)
    : rivalLimpio.replace(/\s+/g, "").slice(0, 3).toUpperCase();

  const nuevo = {
    id: `part-${crypto.randomUUID().slice(0, 8)}`,
    tipo: d.tipo === "anterior" ? "anterior" : "proximo",
    rival: rivalLimpio,
    siglaRival: sigla,
    rivalEscudo: d.rivalEscudo || null,
    rivalEscudoColor: d.rivalEscudoColor || "#334155",
    condicion: String(d.condicion).trim(),
    torneo: String(d.torneo).trim(),
    fecha: String(d.fecha).trim(),
    hora: String(d.hora).trim(),
    estadio: String(d.estadio).trim(),
    ciudad: d.ciudad ? String(d.ciudad).trim() : null,
    estado: d.estado ? String(d.estado).trim() : "Programado",
    arbitro: d.arbitro ? String(d.arbitro).trim() : "Por confirmar",
    jornada: d.jornada ? String(d.jornada).trim() : null,
    clima: d.clima ? String(d.clima).trim() : null,
    relevancia: d.relevancia ? String(d.relevancia).trim() : null,
    golesColoColo: d.golesColoColo !== undefined && d.golesColoColo !== null ? Number(d.golesColoColo) : null,
    golesRival: d.golesRival !== undefined && d.golesRival !== null ? Number(d.golesRival) : null,
    resultado: d.resultado || null,
    goleadoresJson: d.goleadores ? JSON.stringify(d.goleadores) : null,
    goleadoresRivalJson: d.goleadoresRival ? JSON.stringify(d.goleadoresRival) : null,
    estadisticasJson: d.estadisticas ? JSON.stringify(d.estadisticas) : null,
    resumen: d.resumen ? String(d.resumen).trim() : null,
  };

  execute(
    `INSERT INTO partidos (
      id, tipo, rival, siglaRival, rivalEscudo, rivalEscudoColor, condicion, torneo,
      fecha, hora, estadio, ciudad, estado, arbitro, jornada, clima, relevancia,
      golesColoColo, golesRival, resultado, goleadoresJson, goleadoresRivalJson, estadisticasJson, resumen
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nuevo.id, nuevo.tipo, nuevo.rival, nuevo.siglaRival, nuevo.rivalEscudo, nuevo.rivalEscudoColor,
      nuevo.condicion, nuevo.torneo, nuevo.fecha, nuevo.hora, nuevo.estadio, nuevo.ciudad,
      nuevo.estado, nuevo.arbitro, nuevo.jornada, nuevo.clima, nuevo.relevancia,
      nuevo.golesColoColo, nuevo.golesRival, nuevo.resultado,
      nuevo.goleadoresJson, nuevo.goleadoresRivalJson, nuevo.estadisticasJson, nuevo.resumen,
    ]
  );

  res.status(201).json({ ok: true, mensaje: "Partido programado correctamente.", partido: formatearPartido(nuevo) });
}

// put /api/v1/partidos/:id -> actualiza fecha, estadio, estado o marcador de un partido (solo admin)
export function actualizarPartido(req, res) {
  const existente = queryOne("SELECT * FROM partidos WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Partido no encontrado." });
  }

  const d = req.body || {};

  if (d.tipo !== undefined && d.tipo !== "proximo" && d.tipo !== "anterior") {
    return res.status(400).json({ ok: false, mensaje: "El tipo debe ser proximo o anterior." });
  }
  if (d.golesColoColo !== undefined && d.golesColoColo !== null && Number.isNaN(Number(d.golesColoColo))) {
    return res.status(400).json({ ok: false, mensaje: "Los goles de Colo-Colo deben ser un número válido." });
  }
  if (d.golesRival !== undefined && d.golesRival !== null && Number.isNaN(Number(d.golesRival))) {
    return res.status(400).json({ ok: false, mensaje: "Los goles del rival deben ser un número válido." });
  }

  const actualizado = {
    id: existente.id,
    tipo: d.tipo !== undefined ? String(d.tipo).trim() : existente.tipo,
    rival: d.rival !== undefined ? String(d.rival).trim() : existente.rival,
    siglaRival: d.siglaRival !== undefined ? String(d.siglaRival).trim().toUpperCase().slice(0, 4) : existente.siglaRival,
    rivalEscudo: d.rivalEscudo !== undefined ? d.rivalEscudo : existente.rivalEscudo,
    rivalEscudoColor: d.rivalEscudoColor !== undefined ? d.rivalEscudoColor : existente.rivalEscudoColor,
    condicion: d.condicion !== undefined ? String(d.condicion).trim() : existente.condicion,
    torneo: d.torneo !== undefined ? String(d.torneo).trim() : existente.torneo,
    fecha: d.fecha !== undefined ? String(d.fecha).trim() : existente.fecha,
    hora: d.hora !== undefined ? String(d.hora).trim() : existente.hora,
    estadio: d.estadio !== undefined ? String(d.estadio).trim() : existente.estadio,
    ciudad: d.ciudad !== undefined ? d.ciudad : existente.ciudad,
    estado: d.estado !== undefined ? d.estado : existente.estado,
    arbitro: d.arbitro !== undefined ? d.arbitro : existente.arbitro,
    jornada: d.jornada !== undefined ? d.jornada : existente.jornada,
    clima: d.clima !== undefined ? d.clima : existente.clima,
    relevancia: d.relevancia !== undefined ? d.relevancia : existente.relevancia,
    golesColoColo: d.golesColoColo !== undefined ? (d.golesColoColo === null ? null : Number(d.golesColoColo)) : existente.golesColoColo,
    golesRival: d.golesRival !== undefined ? (d.golesRival === null ? null : Number(d.golesRival)) : existente.golesRival,
    resultado: d.resultado !== undefined ? d.resultado : existente.resultado,
    goleadoresJson: d.goleadores !== undefined ? JSON.stringify(d.goleadores) : existente.goleadoresJson,
    goleadoresRivalJson: d.goleadoresRival !== undefined ? JSON.stringify(d.goleadoresRival) : existente.goleadoresRivalJson,
    estadisticasJson: d.estadisticas !== undefined ? JSON.stringify(d.estadisticas) : existente.estadisticasJson,
    resumen: d.resumen !== undefined ? d.resumen : existente.resumen,
  };

  execute(
    `UPDATE partidos SET
      tipo = ?, rival = ?, siglaRival = ?, rivalEscudo = ?, rivalEscudoColor = ?,
      condicion = ?, torneo = ?, fecha = ?, hora = ?, estadio = ?, ciudad = ?,
      estado = ?, arbitro = ?, jornada = ?, clima = ?, relevancia = ?,
      golesColoColo = ?, golesRival = ?, resultado = ?,
      goleadoresJson = ?, goleadoresRivalJson = ?, estadisticasJson = ?, resumen = ?
     WHERE id = ?`,
    [
      actualizado.tipo, actualizado.rival, actualizado.siglaRival, actualizado.rivalEscudo,
      actualizado.rivalEscudoColor, actualizado.condicion, actualizado.torneo,
      actualizado.fecha, actualizado.hora, actualizado.estadio, actualizado.ciudad,
      actualizado.estado, actualizado.arbitro, actualizado.jornada, actualizado.clima,
      actualizado.relevancia, actualizado.golesColoColo, actualizado.golesRival,
      actualizado.resultado, actualizado.goleadoresJson, actualizado.goleadoresRivalJson,
      actualizado.estadisticasJson, actualizado.resumen, actualizado.id,
    ]
  );

  res.json({ ok: true, mensaje: "Partido actualizado.", partido: formatearPartido(actualizado) });
}

// delete /api/v1/partidos/:id -> elimina un encuentro del calendario (solo admin)
export function eliminarPartido(req, res) {
  const existente = queryOne("SELECT * FROM partidos WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Partido no encontrado." });
  }

  execute("DELETE FROM partidos WHERE id = ?", [req.params.id]);
  res.json({ ok: true, mensaje: `Partido ante ${existente.rival} eliminado.` });
}
