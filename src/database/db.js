// Conexion y manejo de la base de datos SQLite usando sql.js.
// Aqui se crean las 7 tablas del sistema y se definen funciones simples para leer y guardar datos en cc_analytics.db.

import fs from "node:fs";
import initSqlJs from "sql.js";
import { ENV } from "../config/env.js";

let db = null;

// guarda el estado actual de la base de datos en el archivo .db
export function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(ENV.DB_PATH, Buffer.from(data));
}

// inicializa sql.js, carga o crea el archivo sqlite y asegura las 7 tablas
export async function initDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(ENV.DB_PATH)) {
    const fileBuffer = fs.readFileSync(ENV.DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON;");

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'CUERPO_TECNICO', 'ANALISTA_LECTURA')),
      cargo TEXT NOT NULL,
      creadoEn TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jugadores (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      dorsal INTEGER NOT NULL,
      posicion TEXT NOT NULL,
      edad INTEGER NOT NULL,
      altura TEXT NOT NULL,
      pie TEXT NOT NULL,
      rol TEXT NOT NULL,
      estado TEXT NOT NULL,
      partidos INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS directrices (
      id TEXT PRIMARY KEY,
      jugadorId TEXT NOT NULL,
      jugadorNombre TEXT NOT NULL,
      area TEXT NOT NULL,
      prioridad TEXT NOT NULL,
      calificacion REAL NOT NULL,
      indicacion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      FOREIGN KEY (jugadorId) REFERENCES jugadores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS partidos (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      rival TEXT NOT NULL,
      siglaRival TEXT NOT NULL,
      rivalEscudo TEXT,
      rivalEscudoColor TEXT,
      condicion TEXT NOT NULL,
      torneo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      estadio TEXT NOT NULL,
      ciudad TEXT,
      estado TEXT,
      arbitro TEXT,
      jornada TEXT,
      clima TEXT,
      relevancia TEXT,
      golesColoColo INTEGER,
      golesRival INTEGER,
      resultado TEXT,
      goleadoresJson TEXT,
      goleadoresRivalJson TEXT,
      estadisticasJson TEXT,
      resumen TEXT
    );

    CREATE TABLE IF NOT EXISTS formaciones (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      esOficial INTEGER NOT NULL DEFAULT 0,
      alturaBloque INTEGER NOT NULL DEFAULT 60,
      anchuraEquipo INTEGER NOT NULL DEFAULT 60,
      intensidadPresion INTEGER NOT NULL DEFAULT 65,
      ritmoPosesion INTEGER NOT NULL DEFAULT 55,
      titularesJson TEXT NOT NULL,
      suplentesJson TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registros_medicos (
      id TEXT PRIMARY KEY,
      jugadorId TEXT NOT NULL,
      jugadorNombre TEXT NOT NULL,
      dorsal INTEGER NOT NULL,
      posicion TEXT NOT NULL,
      tipoLesion TEXT NOT NULL,
      diagnostico TEXT NOT NULL,
      gravedad TEXT NOT NULL,
      fechaIngreso TEXT NOT NULL,
      diasRecuperacion INTEGER NOT NULL,
      diasRestantes INTEGER NOT NULL,
      fase TEXT NOT NULL,
      estado TEXT NOT NULL,
      medicoTratante TEXT NOT NULL,
      observaciones TEXT
    );

    CREATE TABLE IF NOT EXISTS tickets_soporte (
      id TEXT PRIMARY KEY,
      nombreSolicitante TEXT NOT NULL,
      email TEXT NOT NULL,
      departamento TEXT NOT NULL,
      categoria TEXT NOT NULL,
      prioridad TEXT NOT NULL,
      asunto TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT NOT NULL,
      respuestaTecnica TEXT
    );
  `);

  saveDb();
  return db;
}

// consulta multiples filas como arreglo de objetos planos
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// consulta una sola fila o null si no existe
export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// ejecuta insert, update o delete y persiste en disco
export function execute(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  saveDb();
}
