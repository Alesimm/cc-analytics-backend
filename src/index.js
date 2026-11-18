// archivo principal que levanta el servidor backend de cc analytics.
// configura express, cors y swagger (/api-docs), inicia sqlite con datos base, expone /api/health y conecta las rutas de la api.
// al final responde 404 en json para rutas inexistentes y atrapa cualquier error para no devolver html.

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { ENV } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { initDb, queryOne } from "./database/db.js";
import { seedIfEmpty } from "./database/seed.js";
import authRoutes from "./routes/authRoutes.js";
import jugadoresRoutes from "./routes/jugadoresRoutes.js";
import formacionesRoutes from "./routes/formacionesRoutes.js";
import medicoRoutes from "./routes/medicoRoutes.js";
import partidosRoutes from "./routes/partidosRoutes.js";
import soporteRoutes from "./routes/soporteRoutes.js";
import { listarJugadoresV2, eliminarDirectriz } from "./controllers/jugadoresController.js";
import { verificarToken, autorizarRoles } from "./middlewares/authMiddleware.js";

const app = express();

// oculta la cabecera x-powered-by y limita el tamaño del json por seguridad
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// ruta publica de verificacion de estado y base de datos
app.get("/api/health", (req, res) => {
  const usuarios = queryOne("SELECT COUNT(*) AS total FROM usuarios")?.total || 0;
  const jugadores = queryOne("SELECT COUNT(*) AS total FROM jugadores")?.total || 0;
  const partidos = queryOne("SELECT COUNT(*) AS total FROM partidos")?.total || 0;

  res.json({
    ok: true,
    servicio: "CC Analytics API REST",
    version: "v1",
    baseDeDatos: {
      motor: "SQLite (sql.js)",
      usuarios,
      jugadores,
      partidos,
    },
  });
});

// documentacion interactiva swagger ui y especificacion json
app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// rutas de la version 1 y version 2 de la api
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jugadores", jugadoresRoutes);
app.use("/api/v1/formaciones", formacionesRoutes);
app.use("/api/v1/medico", medicoRoutes);
app.use("/api/v1/partidos", partidosRoutes);
app.use("/api/v1/soporte", soporteRoutes);
// rutas sueltas directas (v2 y eliminacion directa de directriz) para evitar archivos de una sola ruta
app.delete("/api/v1/directrices/:id", verificarToken, autorizarRoles("ADMIN", "CUERPO_TECNICO"), eliminarDirectriz);
app.get("/api/v2/jugadores", verificarToken, listarJugadoresV2);

// si ninguna ruta coincide respondemos 404 en json
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: "Ruta no encontrada." });
});

// manejador global de errores: json malformado da 400 y cualquier otro error da 500, siempre en json
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, mensaje: "El cuerpo de la peticion no es un json valido." });
  }

  console.error("Error inesperado:", err);
  res.status(500).json({ ok: false, mensaje: "Ocurrio un error inesperado en el servidor." });
});

// arranque ordenado: inicializar sqlite, poblar si esta vacio y levantar servidor
export async function iniciarServidor(puerto = ENV.PORT) {
  await initDb();
  const poblado = await seedIfEmpty(false);
  if (poblado) {
    console.log("Seed inicial ejecutado en cc_analytics.db");
  }

  return new Promise((resolve) => {
    const server = app.listen(puerto, () => {
      console.log(`Servidor CC Analytics corriendo en http://localhost:${puerto}`);
      console.log(`Swagger UI disponible en http://localhost:${puerto}/api-docs`);
      resolve(server);
    });
  });
}

// solo arranca automaticamente cuando se ejecuta directamente con node src/index.js
const esEjecucionDirecta = process.argv[1] && process.argv[1].endsWith("index.js");
if (esEjecucionDirecta) {
  iniciarServidor().catch((error) => {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  });
}

export { app };
