// Script de carga inicial (seed) para poblar la base de datos con usuarios, plantel, partidos, tacticas, fichas medicas y tickets.
// Permite tener datos reales de Colo-Colo listos apenas arranca el servidor por primera vez.

import bcrypt from "bcryptjs";
import { initDb, queryOne, execute, saveDb } from "./db.js";

const USUARIOS_SEED = [
  {
    id: "usr-admin",
    nombre: "Aníbal Mosa (Dirección)",
    correo: "admin@colocolo.cl",
    passwordPlano: "colo2026",
    rol: "ADMIN",
    cargo: "Dirección Deportiva / DT Jefe",
  },
  {
    id: "usr-tecnico",
    nombre: "Jorge Almirón (Cuerpo Técnico)",
    correo: "tecnico@colocolo.cl",
    passwordPlano: "tecnico2026",
    rol: "CUERPO_TECNICO",
    cargo: "Analista Táctico y Área Médica",
  },
  {
    id: "usr-consulta",
    nombre: "Nicolás Córdova (Scouting)",
    correo: "consulta@colocolo.cl",
    passwordPlano: "consulta2026",
    rol: "ANALISTA_LECTURA",
    cargo: "Analista de Consulta y Scouting",
  },
];

const JUGADORES_SEED = [
  { id: "jug-1", nombre: "Brayan Cortés", dorsal: 1, posicion: "Arquero", edad: 29, altura: "1.86 m", pie: "Derecho", rol: "Titular", estado: "Disponible", partidos: 24 },
  { id: "jug-2", nombre: "Fernando de Paul", dorsal: 30, posicion: "Arquero", edad: 33, altura: "1.83 m", pie: "Derecho", rol: "Suplente", estado: "Disponible", partidos: 8 },
  { id: "jug-3", nombre: "Maximiliano Falcón", dorsal: 37, posicion: "Defensa", edad: 27, altura: "1.80 m", pie: "Derecho", rol: "Titular", estado: "Disponible", partidos: 26 },
  { id: "jug-4", nombre: "Alan Saldivia", dorsal: 4, posicion: "Defensa", edad: 22, altura: "1.81 m", pie: "Derecho", rol: "Titular", estado: "En recuperación", partidos: 20 },
  { id: "jug-5", nombre: "Erick Wiemberg", dorsal: 21, posicion: "Defensa", edad: 30, altura: "1.78 m", pie: "Izquierdo", rol: "Titular", estado: "Disponible", partidos: 25 },
  { id: "jug-6", nombre: "Óscar Opazo", dorsal: 16, posicion: "Defensa", edad: 34, altura: "1.70 m", pie: "Derecho", rol: "Titular", estado: "Disponible", partidos: 22 },
  { id: "jug-7", nombre: "Esteban Pavez", dorsal: 8, posicion: "Mediocampista", edad: 34, altura: "1.80 m", pie: "Derecho", rol: "Titular", estado: "Disponible", partidos: 28 },
  { id: "jug-8", nombre: "Arturo Vidal", dorsal: 23, posicion: "Mediocampista", edad: 37, altura: "1.80 m", pie: "Derecho", rol: "Titular", estado: "Disponible", partidos: 23 },
  { id: "jug-9", nombre: "Vicente Pizarro", dorsal: 34, posicion: "Mediocampista", edad: 22, altura: "1.76 m", pie: "Izquierdo", rol: "Titular", estado: "Disponible", partidos: 27 },
  { id: "jug-10", nombre: "Carlos Palacios", dorsal: 7, posicion: "Mediocampista", edad: 24, altura: "1.81 m", pie: "Derecho", rol: "Titular", estado: "Disponible", partidos: 25 },
  { id: "jug-11", nombre: "Javier Correa", dorsal: 9, posicion: "Delantero", edad: 32, altura: "1.86 m", pie: "Derecho", rol: "Titular", estado: "Disponible", partidos: 19 },
  { id: "jug-12", nombre: "Guillermo Paiva", dorsal: 29, posicion: "Delantero", edad: 27, altura: "1.82 m", pie: "Derecho", rol: "Suplente", estado: "Disponible", partidos: 21 },
  { id: "jug-13", nombre: "Lucas Cepeda", dorsal: 32, posicion: "Delantero", edad: 22, altura: "1.77 m", pie: "Izquierdo", rol: "Titular", estado: "Disponible", partidos: 24 },
  { id: "jug-14", nombre: "Marcos Bolados", dorsal: 11, posicion: "Delantero", edad: 28, altura: "1.70 m", pie: "Derecho", rol: "Suplente", estado: "Disponible", partidos: 18 },
  { id: "jug-15", nombre: "Alexander Oroz", dorsal: 20, posicion: "Delantero", edad: 21, altura: "1.72 m", pie: "Derecho", rol: "Reserva", estado: "En recuperación", partidos: 6 },
];

const DIRECTRICES_SEED = [
  { id: "dir-1", jugadorId: "jug-8", jugadorNombre: "Arturo Vidal", area: "Táctica", prioridad: "Alta", calificacion: 8.8, indicacion: "Sostener presión alta en campo rival durante los primeros 25 minutos para forzar salidas defectuosas.", fecha: "20 Abr 2026" },
  { id: "dir-2", jugadorId: "jug-8", jugadorNombre: "Arturo Vidal", area: "Estrategia", prioridad: "Alta", calificacion: 8.6, indicacion: "Distribuir en rombo con Vicente Pizarro para oxigenar los cambios de orientación de banda a banda.", fecha: "18 Abr 2026" },
  { id: "dir-3", jugadorId: "jug-10", jugadorNombre: "Carlos Palacios", area: "Técnica Individual", prioridad: "Alta", calificacion: 8.7, indicacion: "Atacar el intervalo entre lateral y central rival tras descarga de Javier Correa.", fecha: "19 Abr 2026" },
  { id: "dir-4", jugadorId: "jug-1", jugadorNombre: "Brayan Cortés", area: "Preparación Física", prioridad: "Media", calificacion: 8.5, indicacion: "Mantener posición adelantada para cortar balones largos a la espalda de los centrales.", fecha: "17 Abr 2026" },
];

const PARTIDOS_SEED = [
  {
    id: "part-prox-1", tipo: "proximo", rival: "Universidad Católica", siglaRival: "UC", rivalEscudo: "/photos/logo-cduc.webp", rivalEscudoColor: "#0284c7",
    condicion: "Local", torneo: "Campeonato Nacional", fecha: "2026-11-08", hora: "18:00", estadio: "Estadio Monumental David Arellano", ciudad: "Santiago",
    estado: "Confirmado", arbitro: "Piero Maza", jornada: "Fecha 28", clima: "Despejado 22°C", relevancia: "Clásico decisivo por la cima del torneo",
  },
  {
    id: "part-prox-2", tipo: "proximo", rival: "Palmeiras", siglaRival: "PAL", rivalEscudo: null, rivalEscudoColor: "#15803d",
    condicion: "Visita", torneo: "Copa Libertadores", fecha: "2026-11-14", hora: "21:30", estadio: "Allianz Parque", ciudad: "São Paulo, Brasil",
    estado: "Programado", arbitro: "Wilmar Roldán", jornada: "Cuartos de Final (Ida)", clima: "Húmedo 19°C", relevancia: "Duelo continental de alta exigencia táctica",
  },
  {
    id: "part-prox-3", tipo: "proximo", rival: "Coquimbo Unido", siglaRival: "COQ", rivalEscudo: null, rivalEscudoColor: "#ca8a04",
    condicion: "Visita", torneo: "Campeonato Nacional", fecha: "2026-11-21", hora: "17:30", estadio: "Estadio Francisco Sánchez Rumoroso", ciudad: "Coquimbo",
    estado: "Programado", arbitro: "Cristián Garay", jornada: "Fecha 29", clima: "Parcial 18°C", relevancia: "Penúltima fecha del campeonato",
  },
  {
    id: "part-prox-4", tipo: "proximo", rival: "Everton", siglaRival: "EVE", rivalEscudo: null, rivalEscudoColor: "#1e3a8a",
    condicion: "Local", torneo: "Campeonato Nacional", fecha: "2026-11-28", hora: "19:00", estadio: "Estadio Monumental David Arellano", ciudad: "Santiago",
    estado: "Programado", arbitro: "Por confirmar", jornada: "Fecha 30", clima: "Despejado 24°C", relevancia: "Cierre del torneo en Macul",
  },
  {
    id: "part-ant-1", tipo: "anterior", rival: "Universidad de Chile", siglaRival: "UCH", rivalEscudo: null, rivalEscudoColor: "#1d4ed8",
    condicion: "Local", torneo: "Campeonato Nacional", fecha: "2026-10-27", hora: "18:00", estadio: "Estadio Monumental David Arellano",
    golesColoColo: 2, golesRival: 1, resultado: "Victoria", jornada: "Fecha 27",
    goleadores: ["J. Correa 34'", "C. Palacios 78'"], goleadoresRival: ["L. Pons 62'"],
    estadisticas: { posesion: 58, tirosArco: 7, tirosRival: 4, faltas: 12, tarjetasAmarillas: 2, tarjetasRojas: 0, precisionPases: 84 },
    resumen: "Victoria táctica clave con dominio de la medular y contundencia en los momentos determinantes del Superclásico.",
  },
  {
    id: "part-ant-2", tipo: "anterior", rival: "Junior de Barranquilla", siglaRival: "JUN", rivalEscudo: null, rivalEscudoColor: "#dc2626",
    condicion: "Visita", torneo: "Copa Libertadores", fecha: "2026-10-20", hora: "20:30", estadio: "Estadio Metropolitano Roberto Meléndez",
    golesColoColo: 2, golesRival: 1, resultado: "Victoria", jornada: "Octavos de Final (Vuelta)",
    goleadores: ["L. Cepeda 43'", "M. Falcón 74'"], goleadoresRival: ["C. Bacca 45+1'"],
    estadisticas: { posesion: 46, tirosArco: 5, tirosRival: 6, faltas: 16, tarjetasAmarillas: 3, tarjetasRojas: 0, precisionPases: 79 },
    resumen: "Clasificación histórica a cuartos de final con gol agónico de pelota parada y solidez defensiva.",
  },
];

const SUPLENTES_BASE = [
  { id: "jug-2", dorsal: 30, nombre: "F. De Paul", posicion: "Arquero", rol: "POR", media: 78 },
  { id: "jug-7", dorsal: 15, nombre: "E. Amor", posicion: "Defensa", rol: "DFC", media: 79 },
  { id: "jug-11", dorsal: 34, nombre: "V. Pizarro", posicion: "Mediocampo", rol: "MC", media: 80 },
  { id: "jug-14", dorsal: 29, nombre: "G. Paiva", posicion: "Delantero", rol: "DC", media: 79 },
];

const FORMACIONES_SEED = [
  {
    id: "4-3-3",
    nombre: "4-3-3 Ofensivo",
    descripcion: "Amplitud ofensiva por bandas, posesion progresiva y presion alta tras perdida.",
    esOficial: 1,
    alturaBloque: 75,
    anchuraEquipo: 70,
    intensidadPresion: 80,
    ritmoPosesion: 60,
    titulares: [
      { id: "jug-1", dorsal: 1, nombre: "B. Cortés", posicion: "Arquero", rol: "POR", x: 50, y: 90, media: 84 },
      { id: "jug-5", dorsal: 21, nombre: "E. Wiemberg", posicion: "Defensa", rol: "LI", x: 16, y: 74, media: 79 },
      { id: "jug-3", dorsal: 37, nombre: "M. Falcón", posicion: "Defensa", rol: "DCI", x: 37, y: 74, media: 83 },
      { id: "jug-4", dorsal: 4, nombre: "A. Saldivia", posicion: "Defensa", rol: "DCD", x: 63, y: 74, media: 81 },
      { id: "jug-6", dorsal: 16, nombre: "Ó. Opazo", posicion: "Defensa", rol: "LD", x: 84, y: 74, media: 78 },
      { id: "jug-8", dorsal: 8, nombre: "E. Pavez", posicion: "Mediocampo", rol: "MCD", x: 50, y: 58, media: 82 },
      { id: "jug-9", dorsal: 23, nombre: "A. Vidal", posicion: "Mediocampo", rol: "MC", x: 34, y: 42, media: 86 },
      { id: "jug-10", dorsal: 5, nombre: "L. Gil", posicion: "Mediocampo", rol: "MCO", x: 66, y: 42, media: 80 },
      { id: "jug-15", dorsal: 32, nombre: "L. Cepeda", posicion: "Delantero", rol: "EI", x: 18, y: 24, media: 81 },
      { id: "jug-13", dorsal: 9, nombre: "J. Correa", posicion: "Delantero", rol: "DC", x: 50, y: 20, media: 83 },
      { id: "jug-12", dorsal: 7, nombre: "C. Palacios", posicion: "Delantero", rol: "ED", x: 82, y: 24, media: 85 },
    ],
    suplentes: SUPLENTES_BASE,
  },
  {
    id: "4-2-3-1",
    nombre: "4-2-3-1 Control",
    descripcion: "Doble pivote de contencion en la medular con enganche y transicion rapida.",
    esOficial: 1,
    alturaBloque: 55,
    anchuraEquipo: 50,
    intensidadPresion: 65,
    ritmoPosesion: 50,
    titulares: [
      { id: "jug-1", dorsal: 1, nombre: "B. Cortés", posicion: "Arquero", rol: "POR", x: 50, y: 90, media: 84 },
      { id: "jug-5", dorsal: 21, nombre: "E. Wiemberg", posicion: "Defensa", rol: "LI", x: 16, y: 74, media: 79 },
      { id: "jug-3", dorsal: 37, nombre: "M. Falcón", posicion: "Defensa", rol: "DCI", x: 37, y: 74, media: 83 },
      { id: "jug-4", dorsal: 4, nombre: "A. Saldivia", posicion: "Defensa", rol: "DCD", x: 63, y: 74, media: 81 },
      { id: "jug-6", dorsal: 16, nombre: "Ó. Opazo", posicion: "Defensa", rol: "LD", x: 84, y: 74, media: 78 },
      { id: "jug-8", dorsal: 8, nombre: "E. Pavez", posicion: "Mediocampo", rol: "MCD", x: 36, y: 58, media: 82 },
      { id: "jug-9", dorsal: 23, nombre: "A. Vidal", posicion: "Mediocampo", rol: "MCD", x: 64, y: 58, media: 86 },
      { id: "jug-15", dorsal: 32, nombre: "L. Cepeda", posicion: "Delantero", rol: "MI", x: 18, y: 36, media: 81 },
      { id: "jug-10", dorsal: 5, nombre: "L. Gil", posicion: "Mediocampo", rol: "MCO", x: 50, y: 38, media: 80 },
      { id: "jug-12", dorsal: 7, nombre: "C. Palacios", posicion: "Delantero", rol: "MD", x: 82, y: 36, media: 85 },
      { id: "jug-13", dorsal: 9, nombre: "J. Correa", posicion: "Delantero", rol: "DC", x: 50, y: 20, media: 83 },
    ],
    suplentes: SUPLENTES_BASE,
  },
];

const MEDICO_SEED = [
  { id: "med-1", jugadorId: "jug-4", jugadorNombre: "Alan Saldivia", dorsal: 4, posicion: "Defensa", tipoLesion: "Muscular", diagnostico: "Desgarro miofascial en isquiotibial derecho (Grado 1)", gravedad: "Moderada", fechaIngreso: "2026-04-14", diasRecuperacion: 21, diasRestantes: 7, fase: "Reintegro Deportivo", estado: "En Reintegro", medicoTratante: "Dr. Roberto Yáñez (Kinesiología CSD)", observaciones: "Buena cicatrización ecográfica. Inició trote y trabajo diferenciado con balón en cancha." },
  { id: "med-2", jugadorId: "jug-15", jugadorNombre: "Alexander Oroz", dorsal: 20, posicion: "Delantero", tipoLesion: "Ligamentosa", diagnostico: "Esguince de ligamento colateral medial en rodilla izquierda (Grado 2)", gravedad: "Grave", fechaIngreso: "2026-04-02", diasRecuperacion: 42, diasRestantes: 18, fase: "Rehabilitación Kinésica", estado: "Baja Activa", medicoTratante: "Dr. Gastón Carvajal (Traumatología)", observaciones: "Trabajo en piscina y fortalecimiento de cuádriceps en gimnasio sin dolor residual." },
  { id: "med-3", jugadorId: "jug-2", jugadorNombre: "Fernando de Paul", dorsal: 30, posicion: "Arquero", tipoLesion: "Sobrecarga", diagnostico: "Sobrecarga en aductor mayor derecho por esfuerzo repetitivo", gravedad: "Leve", fechaIngreso: "2026-04-18", diasRecuperacion: 7, diasRestantes: 2, fase: "Reintegro Deportivo", estado: "En Reintegro", medicoTratante: "Kgo. Wilson Ferrada", observaciones: "Descarga muscular completa y crioterapia." },
  { id: "med-4", jugadorId: "jug-8", jugadorNombre: "Arturo Vidal", dorsal: 23, posicion: "Mediocampista", tipoLesion: "Articular", diagnostico: "Sinovitis reactiva post-esfuerzo en rodilla derecha", gravedad: "Leve", fechaIngreso: "2026-03-25", diasRecuperacion: 10, diasRestantes: 0, fase: "Alta Médica", estado: "Alta Médica", medicoTratante: "Dr. Roberto Yáñez (Área Médica)", observaciones: "Control ecográfico normal. Alta médica otorgada." },
  { id: "med-5", jugadorId: "jug-11", jugadorNombre: "Javier Correa", dorsal: 9, posicion: "Delantero", tipoLesion: "Muscular", diagnostico: "Contractura en gemelo interno de pierna izquierda", gravedad: "Leve", fechaIngreso: "2026-03-10", diasRecuperacion: 8, diasRestantes: 0, fase: "Alta Médica", estado: "Alta Médica", medicoTratante: "Kgo. Wilson Ferrada", observaciones: "Completó microciclo de entrenamiento con el grupo profesional." },
];

const SOPORTE_SEED = [
  { id: "tk-101", nombreSolicitante: "Jorge Almirón", email: "j.almiron@colocolo.cl", departamento: "Cuerpo Técnico", categoria: "Métricas & Estadísticas", prioridad: "Alta", asunto: "Sincronización de velocidad punta en módulo de Rendimiento", descripcion: "Los reportes de la práctica matutina del jueves no están promediando las aceleraciones sobre 25 km/h.", fecha: "2026-05-02", estado: "Resuelto", respuestaTecnica: "Mesa de Ayuda TI: Se recalibró el convertidor telemétrico de GPS Catapult." },
  { id: "tk-102", nombreSolicitante: "Dr. Roberto Yáñez", email: "r.yanez@colocolo.cl", departamento: "Área Médica", categoria: "Incidencia Técnica", prioridad: "Media", asunto: "Actualización de protocolo en fichas de reintegro deportivo", descripcion: "Requerimos añadir una anotación sobre el test de fuerza isocinética.", fecha: "2026-05-03", estado: "En Revisión", respuestaTecnica: "Soporte CC: Requerimiento derivado al equipo de desarrollo." },
  { id: "tk-103", nombreSolicitante: "Maximiliano Velázquez", email: "m.velazquez@colocolo.cl", departamento: "Cuerpo Técnico", categoria: "Cuentas & Accesos", prioridad: "Urgente", asunto: "Habilitación de acceso analítico para nuevo preparador asistente", descripcion: "Solicitamos credenciales con rol de Cuerpo Técnico para el partido del fin de semana.", fecha: "2026-05-04", estado: "Abierto", respuestaTecnica: "En espera de validación de credenciales por coordinación." },
  { id: "tk-104", nombreSolicitante: "Matías Camacho", email: "m.camacho@colocolo.cl", departamento: "Coordinación Deportiva", categoria: "Sugerencia", prioridad: "Baja", asunto: "Exportación de fixture oficial a formato imprimible", descripcion: "Sería útil poder descargar el listado de los próximos 5 encuentros en una ficha resumen.", fecha: "2026-05-04", estado: "Abierto", respuestaTecnica: "Ticket registrado en el backlog de mejoras visuales." },
];

// inserta los datos iniciales solo si la tabla usuarios esta vacia
export async function seedIfEmpty(forzar = false) {
  await initDb();

  const existeUsuario = queryOne("SELECT COUNT(*) AS total FROM usuarios");
  if (!forzar && existeUsuario && existeUsuario.total > 0) {
    return false;
  }

  if (forzar) {
    execute("DELETE FROM directrices");
    execute("DELETE FROM registros_medicos");
    execute("DELETE FROM tickets_soporte");
    execute("DELETE FROM formaciones");
    execute("DELETE FROM partidos");
    execute("DELETE FROM jugadores");
    execute("DELETE FROM usuarios");
  }

  const ahora = new Date().toISOString();

  for (const u of USUARIOS_SEED) {
    const hash = bcrypt.hashSync(u.passwordPlano, 10);
    execute(
      `INSERT INTO usuarios (id, nombre, correo, passwordHash, rol, cargo, creadoEn)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.nombre, u.correo, hash, u.rol, u.cargo, ahora]
    );
  }

  for (const j of JUGADORES_SEED) {
    execute(
      `INSERT INTO jugadores (id, nombre, dorsal, posicion, edad, altura, pie, rol, estado, partidos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [j.id, j.nombre, j.dorsal, j.posicion, j.edad, j.altura, j.pie, j.rol, j.estado, j.partidos]
    );
  }

  for (const d of DIRECTRICES_SEED) {
    execute(
      `INSERT INTO directrices (id, jugadorId, jugadorNombre, area, prioridad, calificacion, indicacion, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.jugadorId, d.jugadorNombre, d.area, d.prioridad, d.calificacion, d.indicacion, d.fecha]
    );
  }

  for (const p of PARTIDOS_SEED) {
    execute(
      `INSERT INTO partidos (
        id, tipo, rival, siglaRival, rivalEscudo, rivalEscudoColor, condicion, torneo,
        fecha, hora, estadio, ciudad, estado, arbitro, jornada, clima, relevancia,
        golesColoColo, golesRival, resultado, goleadoresJson, goleadoresRivalJson, estadisticasJson, resumen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.tipo, p.rival, p.siglaRival, p.rivalEscudo || null, p.rivalEscudoColor || null,
        p.condicion, p.torneo, p.fecha, p.hora, p.estadio, p.ciudad || null, p.estado || null,
        p.arbitro || null, p.jornada || null, p.clima || null, p.relevancia || null,
        p.golesColoColo ?? null, p.golesRival ?? null, p.resultado || null,
        p.goleadores ? JSON.stringify(p.goleadores) : null,
        p.goleadoresRival ? JSON.stringify(p.goleadoresRival) : null,
        p.estadisticas ? JSON.stringify(p.estadisticas) : null,
        p.resumen || null,
      ]
    );
  }

  for (const f of FORMACIONES_SEED) {
    execute(
      `INSERT INTO formaciones (
        id, nombre, descripcion, esOficial, alturaBloque, anchuraEquipo,
        intensidadPresion, ritmoPosesion, titularesJson, suplentesJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id, f.nombre, f.descripcion, f.esOficial, f.alturaBloque, f.anchuraEquipo,
        f.intensidadPresion, f.ritmoPosesion, JSON.stringify(f.titulares), JSON.stringify(f.suplentes),
      ]
    );
  }

  for (const m of MEDICO_SEED) {
    execute(
      `INSERT INTO registros_medicos (
        id, jugadorId, jugadorNombre, dorsal, posicion, tipoLesion, diagnostico, gravedad,
        fechaIngreso, diasRecuperacion, diasRestantes, fase, estado, medicoTratante, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id, m.jugadorId, m.jugadorNombre, m.dorsal, m.posicion, m.tipoLesion, m.diagnostico,
        m.gravedad, m.fechaIngreso, m.diasRecuperacion, m.diasRestantes, m.fase, m.estado,
        m.medicoTratante, m.observaciones || "",
      ]
    );
  }

  for (const t of SOPORTE_SEED) {
    execute(
      `INSERT INTO tickets_soporte (
        id, nombreSolicitante, email, departamento, categoria, prioridad,
        asunto, descripcion, fecha, estado, respuestaTecnica
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, t.nombreSolicitante, t.email, t.departamento, t.categoria, t.prioridad,
        t.asunto, t.descripcion, t.fecha, t.estado, t.respuestaTecnica || "",
      ]
    );
  }

  saveDb();
  return true;
}

// permite ejecutar el seed directamente con "npm run seed"
const esEjecucionDirecta = process.argv[1] && process.argv[1].endsWith("seed.js");
if (esEjecucionDirecta) {
  seedIfEmpty(true)
    .then(() => {
      console.log("Base de datos cc_analytics.db poblada correctamente.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error al poblar la base de datos:", err);
      process.exit(1);
    });
}
