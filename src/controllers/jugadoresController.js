// controlador para gestionar el plantel de jugadores y sus directrices tacticas.
// incluye el crud completo de jugadores (v1), el listado enriquecido con directrices (v2)
// y la creacion, consulta y eliminacion de directrices para la vista de rendimiento.

import { queryAll, queryOne, execute } from "../database/db.js";

// genera un id simple y unico usando la marca de tiempo
function generarId(prefijo) {
  return `${prefijo}-${Date.now().toString().slice(-6)}`;
}

// formatea la fecha actual en texto corto como "13 nov 2026"
function fechaCortaHoy() {
  return new Date().toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// get /api/v1/jugadores -> lista todos los jugadores ordenados por dorsal
export function listarJugadores(req, res) {
  const jugadores = queryAll("SELECT * FROM jugadores ORDER BY dorsal ASC");
  res.json({ ok: true, total: jugadores.length, jugadores });
}

// get /api/v2/jugadores -> version 2 que entrega cada jugador con sus directrices y promedio
export function listarJugadoresV2(req, res) {
  const jugadores = queryAll("SELECT * FROM jugadores ORDER BY dorsal ASC");
  const directrices = queryAll("SELECT * FROM directrices ORDER BY rowid DESC");

  const resultado = jugadores.map((jugador) => {
    const susDirectrices = directrices.filter((d) => d.jugadorId === jugador.id);
    const suma = susDirectrices.reduce((acc, d) => acc + Number(d.calificacion || 0), 0);
    const promedio = susDirectrices.length > 0 ? Number((suma / susDirectrices.length).toFixed(1)) : 0;

    return {
      ...jugador,
      totalDirectrices: susDirectrices.length,
      promedioCalificacion: promedio,
      directrices: susDirectrices,
    };
  });

  res.json({ ok: true, version: "v2", total: resultado.length, jugadores: resultado });
}

// get /api/v1/jugadores/:id -> busca un jugador puntual por su id
export function obtenerJugador(req, res) {
  const jugador = queryOne("SELECT * FROM jugadores WHERE id = ?", [req.params.id]);

  if (!jugador) {
    return res.status(404).json({ ok: false, mensaje: "Jugador no encontrado." });
  }

  res.json({ ok: true, jugador });
}

// post /api/v1/jugadores -> crea un nuevo futbolista en el plantel (solo admin)
export function crearJugador(req, res) {
  const { nombre, dorsal, posicion, edad, altura, pie, rol, estado, partidos } = req.body || {};

  if (!nombre || !dorsal || !posicion || !edad || !altura || !pie || !rol || !estado) {
    return res.status(400).json({ ok: false, mensaje: "Faltan campos obligatorios del jugador." });
  }

  const dorsalNumero = Number(dorsal);
  const edadNumero = Number(edad);

  if (Number.isNaN(dorsalNumero) || dorsalNumero < 1 || dorsalNumero > 99) {
    return res.status(400).json({ ok: false, mensaje: "El dorsal debe ser un numero entre 1 y 99." });
  }

  const dorsalOcupado = queryOne("SELECT id FROM jugadores WHERE dorsal = ?", [dorsalNumero]);
  if (dorsalOcupado) {
    return res.status(400).json({ ok: false, mensaje: `El dorsal ${dorsalNumero} ya esta ocupado.` });
  }

  const nuevo = {
    id: generarId("jug"),
    nombre: String(nombre).trim(),
    dorsal: dorsalNumero,
    posicion: String(posicion).trim(),
    edad: edadNumero,
    altura: String(altura).trim(),
    pie: String(pie).trim(),
    rol: String(rol).trim(),
    estado: String(estado).trim(),
    partidos: Number(partidos) || 0,
  };

  execute(
    `INSERT INTO jugadores (id, nombre, dorsal, posicion, edad, altura, pie, rol, estado, partidos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nuevo.id, nuevo.nombre, nuevo.dorsal, nuevo.posicion, nuevo.edad, nuevo.altura, nuevo.pie, nuevo.rol, nuevo.estado, nuevo.partidos]
  );

  res.status(201).json({ ok: true, mensaje: "Jugador fichado correctamente.", jugador: nuevo });
}

// put /api/v1/jugadores/:id -> actualiza los datos de un jugador existente (solo admin)
export function actualizarJugador(req, res) {
  const existente = queryOne("SELECT * FROM jugadores WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Jugador no encontrado." });
  }

  const datos = req.body || {};
  const dorsalNumero = datos.dorsal !== undefined ? Number(datos.dorsal) : existente.dorsal;

  if (Number.isNaN(dorsalNumero) || dorsalNumero < 1 || dorsalNumero > 99) {
    return res.status(400).json({ ok: false, mensaje: "El dorsal debe ser un numero entre 1 y 99." });
  }

  const dorsalOcupado = queryOne("SELECT id FROM jugadores WHERE dorsal = ? AND id != ?", [dorsalNumero, req.params.id]);
  if (dorsalOcupado) {
    return res.status(400).json({ ok: false, mensaje: `El dorsal ${dorsalNumero} ya pertenece a otro jugador.` });
  }

  const actualizado = {
    id: existente.id,
    nombre: datos.nombre !== undefined ? String(datos.nombre).trim() : existente.nombre,
    dorsal: dorsalNumero,
    posicion: datos.posicion !== undefined ? String(datos.posicion).trim() : existente.posicion,
    edad: datos.edad !== undefined ? Number(datos.edad) : existente.edad,
    altura: datos.altura !== undefined ? String(datos.altura).trim() : existente.altura,
    pie: datos.pie !== undefined ? String(datos.pie).trim() : existente.pie,
    rol: datos.rol !== undefined ? String(datos.rol).trim() : existente.rol,
    estado: datos.estado !== undefined ? String(datos.estado).trim() : existente.estado,
    partidos: datos.partidos !== undefined ? Number(datos.partidos) : existente.partidos,
  };

  execute(
    `UPDATE jugadores
     SET nombre = ?, dorsal = ?, posicion = ?, edad = ?, altura = ?, pie = ?, rol = ?, estado = ?, partidos = ?
     WHERE id = ?`,
    [
      actualizado.nombre,
      actualizado.dorsal,
      actualizado.posicion,
      actualizado.edad,
      actualizado.altura,
      actualizado.pie,
      actualizado.rol,
      actualizado.estado,
      actualizado.partidos,
      actualizado.id,
    ]
  );

  res.json({ ok: true, mensaje: "Jugador actualizado correctamente.", jugador: actualizado });
}

// delete /api/v1/jugadores/:id -> da de baja un jugador del plantel (solo admin)
export function eliminarJugador(req, res) {
  const existente = queryOne("SELECT * FROM jugadores WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Jugador no encontrado." });
  }

  execute("DELETE FROM jugadores WHERE id = ?", [req.params.id]);
  res.json({ ok: true, mensaje: `Jugador ${existente.nombre} dado de baja.` });
}

// get /api/v1/jugadores/:id/directrices -> lista las directrices tacticas de un jugador
export function listarDirectricesJugador(req, res) {
  const jugador = queryOne("SELECT id FROM jugadores WHERE id = ?", [req.params.id]);
  if (!jugador) {
    return res.status(404).json({ ok: false, mensaje: "Jugador no encontrado." });
  }

  const directrices = queryAll("SELECT * FROM directrices WHERE jugadorId = ? ORDER BY rowid DESC", [req.params.id]);
  res.json({ ok: true, total: directrices.length, directrices });
}

// post /api/v1/jugadores/:id/directrices -> agrega una directriz tactica (admin y cuerpo tecnico)
export function crearDirectriz(req, res) {
  const jugador = queryOne("SELECT * FROM jugadores WHERE id = ?", [req.params.id]);
  if (!jugador) {
    return res.status(404).json({ ok: false, mensaje: "Jugador no encontrado." });
  }

  const { area, prioridad, calificacion, indicacion } = req.body || {};
  if (!area || !prioridad || calificacion === undefined || !indicacion) {
    return res.status(400).json({ ok: false, mensaje: "Debes completar area, prioridad, calificacion e indicacion." });
  }

  const nota = Number(calificacion);
  if (Number.isNaN(nota) || nota < 1 || nota > 10) {
    return res.status(400).json({ ok: false, mensaje: "La calificacion debe estar entre 1 y 10." });
  }

  const nueva = {
    id: generarId("dir"),
    jugadorId: jugador.id,
    jugadorNombre: jugador.nombre,
    area: String(area).trim(),
    prioridad: String(prioridad).trim(),
    calificacion: nota,
    indicacion: String(indicacion).trim(),
    fecha: fechaCortaHoy(),
  };

  execute(
    `INSERT INTO directrices (id, jugadorId, jugadorNombre, area, prioridad, calificacion, indicacion, fecha)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nueva.id, nueva.jugadorId, nueva.jugadorNombre, nueva.area, nueva.prioridad, nueva.calificacion, nueva.indicacion, nueva.fecha]
  );

  res.status(201).json({ ok: true, mensaje: "Directriz registrada.", directriz: nueva });
}

// delete /api/v1/directrices/:id -> elimina una directriz tactica (admin y cuerpo tecnico)
export function eliminarDirectriz(req, res) {
  const existente = queryOne("SELECT * FROM directrices WHERE id = ?", [req.params.id]);
  if (!existente) {
    return res.status(404).json({ ok: false, mensaje: "Directriz no encontrada." });
  }

  execute("DELETE FROM directrices WHERE id = ?", [req.params.id]);
  res.json({ ok: true, mensaje: "Directriz eliminada." });
}
