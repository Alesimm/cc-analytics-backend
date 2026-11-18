// controlador para gestionar los tickets de soporte tecnico y mesa de ayuda.
// permite listar tickets (con filtro opcional por estado), crear nuevas solicitudes,
// actualizar el estado o respuesta tecnica y eliminar tickets desde administracion.

import crypto from "node:crypto";
import { queryAll, queryOne, execute } from "../database/db.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESTADOS_VALIDOS = ["Abierto", "En Revisión", "Resuelto"];

// get /api/v1/soporte -> lista todos los tickets (acepta filtro ?estado=Abierto)
export function listarTickets(req, res) {
  const { estado } = req.query || {};

  let tickets;
  if (estado && ESTADOS_VALIDOS.includes(estado)) {
    tickets = queryAll("SELECT * FROM tickets_soporte WHERE estado = ? ORDER BY rowid DESC", [estado]);
  } else {
    tickets = queryAll("SELECT * FROM tickets_soporte ORDER BY rowid DESC");
  }

  res.json({ ok: true, total: tickets.length, tickets });
}

// post /api/v1/soporte -> registra un nuevo ticket de soporte (todos los roles autenticados)
export function crearTicket(req, res) {
  const {
    nombreSolicitante = "",
    email = "",
    departamento = "General",
    categoria = "Incidencia Técnica",
    prioridad = "Media",
    asunto = "",
    descripcion = "",
  } = req.body || {};

  const nombreLimpio = String(nombreSolicitante).trim();
  const emailLimpio = String(email).trim().toLowerCase();
  const asuntoLimpio = String(asunto).trim();
  const descripcionLimpia = String(descripcion).trim();

  if (nombreLimpio.length < 3) {
    return res.status(400).json({ ok: false, mensaje: "El nombre del solicitante debe tener al menos 3 caracteres." });
  }
  if (!EMAIL_REGEX.test(emailLimpio)) {
    return res.status(400).json({ ok: false, mensaje: "El correo de contacto no es valido." });
  }
  if (asuntoLimpio.length < 5) {
    return res.status(400).json({ ok: false, mensaje: "El asunto debe tener al menos 5 caracteres." });
  }
  if (descripcionLimpia.length < 10) {
    return res.status(400).json({ ok: false, mensaje: "La descripcion debe tener al menos 10 caracteres." });
  }

  const nuevo = {
    id: `tk-${crypto.randomUUID().slice(0, 6)}`,
    nombreSolicitante: nombreLimpio,
    email: emailLimpio,
    departamento: String(departamento).trim(),
    categoria: String(categoria).trim(),
    prioridad: String(prioridad).trim(),
    asunto: asuntoLimpio,
    descripcion: descripcionLimpia,
    fecha: new Date().toISOString().split("T")[0],
    estado: "Abierto",
    respuestaTecnica: "Ticket recibido en cola de atención. Asignado a especialista de Mesa de Ayuda.",
  };

  execute(
    `INSERT INTO tickets_soporte (
      id, nombreSolicitante, email, departamento, categoria, prioridad,
      asunto, descripcion, fecha, estado, respuestaTecnica
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nuevo.id,
      nuevo.nombreSolicitante,
      nuevo.email,
      nuevo.departamento,
      nuevo.categoria,
      nuevo.prioridad,
      nuevo.asunto,
      nuevo.descripcion,
      nuevo.fecha,
      nuevo.estado,
      nuevo.respuestaTecnica,
    ]
  );

  res.status(201).json({ ok: true, mensaje: "Ticket de soporte registrado correctamente.", ticket: nuevo });
}

// patch /api/v1/soporte/:id/estado -> cambia el estado o respuesta tecnica del ticket (solo admin)
export function actualizarEstadoTicket(req, res) {
  const existente = queryOne("SELECT * FROM tickets_soporte WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Ticket no encontrado." });
  }

  const { estado, respuestaTecnica } = req.body || {};

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      ok: false,
      mensaje: "El estado debe ser Abierto, En Revisión o Resuelto.",
    });
  }

  const nuevaRespuesta =
    respuestaTecnica !== undefined ? String(respuestaTecnica).trim() : existente.respuestaTecnica;

  execute(
    "UPDATE tickets_soporte SET estado = ?, respuestaTecnica = ? WHERE id = ?",
    [estado, nuevaRespuesta, req.params.id]
  );

  const actualizado = queryOne("SELECT * FROM tickets_soporte WHERE id = ?", [req.params.id]);
  res.json({ ok: true, mensaje: "Estado del ticket actualizado.", ticket: actualizado });
}

// delete /api/v1/soporte/:id -> elimina un ticket de soporte (solo admin)
export function eliminarTicket(req, res) {
  const existente = queryOne("SELECT * FROM tickets_soporte WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Ticket no encontrado." });
  }

  execute("DELETE FROM tickets_soporte WHERE id = ?", [req.params.id]);
  res.json({ ok: true, mensaje: "Ticket eliminado." });
}
